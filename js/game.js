//Мой govnoкод.

//Все "11" и "10" надо поменять на "fieldSize" и "fieldSize - 1".

var canv = document.getElementById("gameCanvas");
var ctx = canv.getContext("2d");

var headLeft = new Image();
var headRight = new Image();

var headx = 5; // Не в пикселях,
var heady = 5; // а в клетках.

var headxp = 0; // А вот это
var headxy = 0; // в пикселях

var gameState; // 0 - идёт, 1 - поражение, 2 - победа.

headLeft.src = "images/faceLeft.webp";
headRight.src = "images/faceRight.webp";

var head = headRight;

fieldSize = 11;
var circles = []; // true/false - заблокирована ли клетка
var circlesid = []; // иды клеток, для матрицы смежности.
var cellsAmount = 0;
var adjMatrix = [];
var ccord = [];
var retry;
var gotox = 0;
var gotoy = 0;
var banned = []; // Список клеток, ведущих в тупик.
var used = []; // Список клеток, по которым уже прошёл. Чтоб не ходить кругами.
var queue = []; // Маршрут.
var goBanned = false;
var deadendCount = 0;
var isHovered = false;
createField();
head.onload = function() {
	draw();
}

function createField() {
	for (var i = 0; i < fieldSize; i++) {
		circles[i] = [];
		circlesid[i] = []
		ccord[i] = []
		for (var j = 0; j < fieldSize; j++) {
			circles[i][j] = false;
			circlesid[i][j] = i * fieldSize + j;
		}
	}

	if(heady % 2 == 0) {
		headxp = headx*35; 
		headyp = heady*35;
	}
	else  {
		headxp = 15+(headx*40); 
		headyp = heady*39;
	}

	cellsAmount = circles.length * circles[0].length;

	adjMatrixGen();
}

function draw() {

	ctx.clearRect(0,0,canv.width, canv.height);

	if (gameState == 1) {

		ctx.fillStyle = "#332fed";
		ctx.font = "bold 25px Arial";
		ctx.fillText("Увы, ему удалось улизнуть,", 30, 100);
		ctx.fillText("и одним нарушителем", 50, 150);
		ctx.fillText("в Зеленодольске стало больше.", 10, 200);

		ctx.font = "35px Arial";
		if (isHovered) ctx.fillStyle = ('#8987fa');
		else ctx.fillStyle = ('#332fed');
		ctx.fillText("Может повторите?", 50, 300);
		ctx.fillStyle = '#9ACD32';

		var retry = new Path2D();

		requestAnimationFrame(draw);

		return;
	}

	if (gameState == 2) {

		ctx.fillStyle = "#332fed";
		ctx.font = "bold 25px Arial";
		ctx.fillText("Поздравляем, одним нарушителем", 10, 100);
		//ctx.fillText("одним нарушителем", 60, 100);
		ctx.fillText("в Зеленодольске стало меньше!", 20, 150);

		ctx.font = "35px Arial";
		if (isHovered) ctx.fillStyle = ('#8987fa');
		else ctx.fillStyle = ('#332fed');
		ctx.fillText("Может повторите?", 50, 300);
		ctx.fillStyle = '#9ACD32';

		var retry = new Path2D();

		requestAnimationFrame(draw);

		return;
	}

	var ycord = 20;
	for (var i = 0; i < fieldSize; i++) {
		var xcord = 20;
		for (var j = 0; j < fieldSize; j++) {
			if (i % 2 == 0) {
				ccord[i][j] = new Path2D();
				ccord[i][j].arc(xcord,ycord,15,0,Math.PI*2,false);
				ctx.font = "10px TimesNewRoman";
				ctx.fillText(circlesid[i][j], xcord, ycord);
				xcord += 40;
			}
			else  {
				xcord += 20;
				ccord[i][j] = new Path2D();
				ccord[i][j].arc(xcord,ycord,15,0,Math.PI*2,false);
			//	ctx.font = "10px TimesNewRoman";
			//	ctx.fillText(circlesid[i][j], xcord, ycord);
				xcord += 20;
			}

			if (circles[i][j] == true) {
				ctx.fillStyle = '#f23d3d';
				ctx.fill(ccord[i][j]);
			}
			else {
				ctx.fillStyle = '#9ACD32';
				ctx.fill(ccord[i][j]);
			}
		}
		ycord += 40;
	}

    // перемещение головы
    if (gotox > 0) {
    	headxp += 2;
    	gotox -= 2;
    }
    if (gotox < 0) {
    	headxp -= 2;
    	gotox += 2;
    }
    if (gotoy > 0) {
    	headyp += 2;
    	gotoy -=2;
    }
    if (gotoy < 0) {
    	headyp -= 2;
    	gotoy += 2;
    }
    
    ctx.drawImage(head, headxp, headyp, 50, 50);

    requestAnimationFrame(draw);
}

canv.addEventListener('mousedown', function(e) {
	debugger;
	if (gotox != 0 || gotoy != 0) return;
	for (var i = 0; i < fieldSize; i++) {
		for (var j = 0; j < fieldSize; j++) {
			if (ctx.isPointInPath(ccord[i][j], event.offsetX, event.offsetY) && !((headx == j)&&(heady == i)) && circles[i][j] == false) {
				circles[i][j] = true;
				var a = winCheck();
				if (a) {
					return;
				}
				else pathFind(heady, headx);
			}
		}
	}
});

canv.addEventListener('mousedown', function(e) {
	var x = e.offsetX;
	var y = e.offsetY;
	if (gameState > 0 && x >= 30 && x <= 385 && y >= 260 && y <= 310) {
		reloadGame();
	} 
});


function escapeCheck() {
	//Проверка на побег
	if (headx == 0) escapeLeft();
	if (heady == 0) escapeUp();
	if (headx == fieldSize-1) escapeRight();
	if (heady == fieldSize-1) escapeDown();
}

function winCheck() {
	if (circles[heady][headx-1] && circles[heady][headx+1]) 
	{
	    if (heady % 2 == 0) { //Если чётная строка
	    	if (circles[heady-1][headx-1] && circles[heady-1][headx] &&
	    		circles[heady+1][headx-1] && circles[heady+1][headx])
	    	{
	    		setTimeout(winScreen(), 3000);
	    		return(true);
	    	}
	    }
	    else {
	    	if (circles[heady-1][headx] && circles[heady-1][headx+1] &&
	    		circles[heady+1][headx] && circles[heady+1][headx+1])
	    	{
	    		setTimeout(winScreen(), 3000);
	    		return(true);
	    	}
	    }
	}
	return false;
}

function moveUpLeft() {
	if (((headx == 0)&&(heady%2==0))||(heady==0)) {
		return;
	}
	else {
		if ( heady % 2 == 0) {
			if (circles[heady-1][headx-1]) {
				return;
			};
			headx--;
			heady--;
		}
		else {
			if (circles[heady-1][headx]) {
				return;
			}
			heady--;
		}
		head = headLeft;
		gotoy -= 40;
		gotox -= 20;
	}
	escapeCheck();
}
function moveUpRight() {
	if (((headx == fieldSize-1)&&(heady%2!=0))||(heady==0)) {
		return;
	}
	else {
		if ( heady % 2 == 0) {
			if (circles[heady-1][headx]) {
				return;
			};
			heady--;
		}
		else {
			if (circles[heady-1][headx+1]) {
				return;
			}
			heady--;
			headx++;
		}
		head = headRight;
		gotoy -= 40;
		gotox += 20;
	}
	escapeCheck();
}
function moveDownLeft() {
	if (((headx == 0)&&(heady%2==0))||(heady==fieldSize-1)) {
		return;
	}
	else {
		if ( heady % 2 == 0) {
			if (circles[heady+1][headx-1]) {
				return;
			};
			headx--;
			heady++;
		}
		else {
			if (circles[heady+1][headx]) {
				return;
			}
			heady++;
		}
		head = headLeft;
		gotoy += 40;
		gotox -= 20;
	}
	escapeCheck();
}
function moveDownRight() {	
	if ( heady % 2 == 0) {
		if (circles[heady+1][headx]) {
			return;
		};
		heady++;
	}
	else {
		if (circles[heady+1][headx+1]) {
			return;
		}
		heady++;
		headx++;
	}
	head = headRight;
	gotoy += 40;
	gotox += 20;
	escapeCheck();
}

function moveLeft() {
	if (headx==0) {
		return;
	}
	else {
		if (circles[heady][headx-1]) {
			return;
		}
		headx--;
	}
	head = headLeft;
	gotox -= 40;
	escapeCheck();
}
function moveRight() {
	if (headx==fieldSize-1) {
		return;
	}
	else {
		if (circles[heady][headx+1]) {
			return;
		}
		headx++;
	}
	head = headRight;
	gotox += 40;
	escapeCheck();
}

function escapeLeft() {
	gotox -= 1000;
	setTimeout(loseScreen, 3000);
}
function escapeRight() {
	gotox += 1000;
	setTimeout(loseScreen, 3000);
}
function escapeUp() {
	gotoy -= 1000;
	setTimeout(loseScreen, 3000);
}
function escapeDown() {
	gotoy += 1000;
	setTimeout(loseScreen, 3000);
}

function loseScreen() {
	gameState = 1;
	mouseMoveListen();
};
function winScreen() {
	gameState = 2;
	mouseMoveListen();
}

function mouseMoveListen() {
	canv.addEventListener('mousemove', function checkHover(e) {
		x = e.offsetX;
		y = e.offsetY;
		if (x >= 30 && x <= 385 && y >= 260 && y < 310) {
			if (gameState == 0) {
				this.removeEventListener('mousemove', checkHover);
			}
			isHovered = true;
		}
		else {
			if (isHovered) {
				isHovered = false;
			}
		}
	});
}

function reloadGame() {
	headx = 5;
	heady = 5;

	headxp = 0;
	headxy = 0;

	gameState = 0;

	head = headRight;

	fieldSize = 11;
	circles = [];
	circlesid = [];
	cellsAmount = 0;
	adjMatrix = [];
	ccord = [];
	gotox = 0;
	gotoy = 0;
	banned = [];
	used = [];
	queue = [];
	goBanned = false;
	deadendCount = 0;
	isHovered = false;

	createField();
}
function adjMatrixGen() {
    // Генерация матрицы.
    // Страшно не лезьте
	 for (var i = 0; i < cellsAmount; i++) {
		adjMatrix[i] = [];
		for (var j = 0; j < cellsAmount; j++) {
			adjMatrix[i][j] = false;
		}
	}
	
	for (var i = 0; i < adjMatrix.length; i++) {
		if (i >= fieldSize && i < cellsAmount && (Math.floor((i)/11)%2 != 0)) {
			adjMatrix[i][1+(i-(fieldSize+1))] = true;
			adjMatrix[1+(i-(fieldSize+1))][i] = true;
			if (i % 11 != 10) {  
				adjMatrix[i][2+(i-(fieldSize+1))] = true;
				adjMatrix[2+(i-(fieldSize+1))][i] = true;
			}
		}
		if (i >= fieldSize && i < cellsAmount && (Math.floor((i)/11)%2 == 0)) {
			if (i % 11 != 0) {
				adjMatrix[i][(i-(fieldSize+1))] = true;
				adjMatrix[(i-(fieldSize+1))][i] = true;
			}
			adjMatrix[i][1+(i-(fieldSize+1))] = true;
			adjMatrix[1+(i-(fieldSize+1))][i] = true;
		}

        // Эти условия можно было впихнуть и сверху куда-нить, 
        // но там и так страшно.
		if ((i + 1) % 11 != 0) {
			adjMatrix[i][i+1] = true;
			adjMatrix[i+1][i] = true;
		}
		if (i % 11 != 0) {
			adjMatrix[i][i-1] = true;
			adjMatrix[i-1][i] = true;
		}
	}
}

function pathFind(y, x) {
	var id = circlesid[y][x];

	if (queue.length == 0) {
		checkRoute(id);
	}
	
	for (var i = 0; i < queue.length; i++) {
		if (circles[Math.floor(queue[i] / 11)][queue[i]%11] == true) {
			queue = [];
			checkRoute(id);
			break;
		}
	}
	var a = queue[0];
	queue.shift();
	selectDirection(circlesid[heady][headx], a);
	return;
	while (used.length > 5) {
		used.shift();
	}
	//selectDirection(id, a);
}

function selectDirection(headId, cellId) {
	var cellx;
	var celly; // 1 - нечётная, 2 - чётная
	var row;

	if (Math.floor(headId/11) == Math.floor(cellId/11)) { //Если в одном ряде
		if (cellId < headId) moveLeft();
		else moveRight();
		return;
	}

	for (var j = 0; j < fieldSize; j++) {
		if (circlesid[j].indexOf(cellId) != -1) {
			celly = j;
			cellx = circlesid[j].indexOf(cellId);
			row = Math.floor(celly%2);
		}
	}

	if (Math.floor(cellId/11) < Math.floor(headId/11)) { //Если клетка выше
		if(row % 2 == 1) { //Если нечётный ряд
			if (cellId + 12 == headId) moveUpLeft();
			else moveUpRight();
		}
		else {
			if (cellId + 11 == headId) moveUpLeft();
			else moveUpRight();
		}
	}
	else { //Если клетка ниже
		if(row % 2 == 1) { //Если нечётный ряд
			if (cellId - 11 == headId) moveDownRight();
			else moveDownLeft();
		}
		else {
			if (cellId - 11 == headId) moveDownLeft();
			else moveDownRight()
		}
	}
}

function checkWays(cellId) {
	var adjs = []; // Смежные открытые клетки (ids)
	var closest; // Ближайшая к любому краю кретка
	// -1: Попал в тупик
	// -2: Дошёл до края
	used.push(cellId);

	var dist = 1000; // Её расстояние до ближайшего края

	if (Math.floor(cellId / fieldSize) == 0 || Math.floor(cellId / fieldSize) == fieldSize-1
		|| cellId % 11 == 0 || cellId % 11 == 10) { // Если на краю
		return -2;
	} 

	for (var i = 0; i != -1; i++) { //Проверить смежные с текущей клетки
		i = adjMatrix[cellId].indexOf(true, i);
		if (i != -1) adjs.push(i);
		else i--;
	}

	for (var i = 0; i < adjs.length; i++) {
		var cellx, celly;
		for (var j = 0; j < fieldSize; j++) {
			if (circlesid[j].indexOf(adjs[i]) != -1) {
				celly = j;
				cellx = circlesid[j].indexOf(adjs[i]);
			}
		}

		if (circles[celly][cellx] == true || used.indexOf(adjs[i]) != -1 || banned.indexOf(adjs[i]) != -1) {
			adjs[i] = -1
			adjs.sort();
		}
	}

	for (var i = 0; i < 6; i++) {
		if (adjs[0] == -1) adjs.shift();
	}

	if (goBanned == true) {
		c = adjs[Math.floor(Math.random()*adjs.length)];
		return c;
	}

	for (var i = 0; i < adjs.length; i++) {
		var a = adjs[i] - circlesid[Math.floor(adjs[i]/11)][0];
		if (a < dist) {
			dist = a;
			closest = adjs[i];
		}
		a = circlesid[Math.floor(adjs[i]/11)][fieldSize - 1] - adjs[i];
		if (a < dist) {
			dist = a;
			closest = adjs[i];
		}
		a = Math.floor(adjs[i]/11);
		if (a < dist) {
			dist = a;
			closest = adjs[i];
		}
		a = (fieldSize-1)-Math.floor(adjs[i]/11);
		if (a < dist) {
			dist = a;
			closest = adjs[i];
		}
	}

	if  (adjs.length == 0) return -1;


	return closest;
}

function checkRoute(id) { //Проверить, не ведёт ли путь в тупик.
	used = [];
	var lqueue = [];

	if (deadendCount > 150) {
		goBanned=true;
		banned = [];
		used = [];
	}


	var a = checkWays(id);

	if ( goBanned == true) {
		queue.push(a);
		return;
	}

	while (a != -2 && a != -1) {
		lqueue.push(a);
		a = checkWays(a);
	}
    if (a == -2) { // Если маршрут доходит до края.
    	queue = lqueue;
    	return;
    }
    else if (a == -1 && goBanned == false) { // Если маршрут заходит в тупик.
    	deadendCount++;
    	banned.push(lqueue[lqueue.length-1]);
    	pathFind(heady, headx);
    	return;
    }
}