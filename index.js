/*
  - go into a direction with a random trajectory 
  - option for increasing speed for each new bounce from the paddle
  - insert the nickname and place below the score
*/
const keys = {};
let board, context, finish = false;
let width = 500;
let height = 500;
var audio = new Audio('../beep.mp3');

let pW = 10;
let pH = 50;
// click first
let p1 = {
	x : 0,
	y : height / 2,
	width : pW,
	height : pH,
	velocity : 0,
	score : 0
}
let p2 = {
	x : 490,
	y : height / 2,
	width : pW,
	height : pH,
	velocity : 0,
	score : 0
}
let bW = 10;
let bH = 10;
let ball = {
	x : width / 2,
	y : height / 2,
	width : bW,
	height : bH,
	velocity_x : 2,
	velocity_y : 1
}

window.onload = function() {
	board = document.getElementById("place");
	board.height = height;
	board.width = width;
	context = board.getContext("2d");
	// initial render
	context.fillStyle = "white";
	context.beginPath();
	context.roundRect(p1.x, p1.y, p1.width, p1.height, 0);
	context.fill();
	context.fillStyle = "white";
	context.beginPath();
	context.roundRect(p2.x, p2.y, p2.width, p2.height, 0);
	context.fill();

	document.addEventListener("keydown", (e) => {
		if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
		keys[e.key] = true;
	});
	document.addEventListener("keyup", (e) => { keys[e.key] = false; });
	move_player();
	requestAnimationFrame(frame_update);
}

function out_of_bounds(y) {
	return (y < 0 || y + pH > height);
}

function frame_update() {
	context.clearRect(0, 0, board.width + 20, board.height);
	move_player();
	// loop thingy
	context.fillStyle = "white";
	let _y1 = p1.y + p1.velocity;
	if (!out_of_bounds(_y1)) p1.y = _y1;
	context.beginPath();
	context.roundRect(p1.x, p1.y, p1.width, p1.height, 0);
	context.fill();
	let _y2 = p2.y + p2.velocity;
	if (!out_of_bounds(_y2)) p2.y = _y2;
	context.fillStyle = "white";
	context.beginPath();
	context.roundRect(p2.x, p2.y, p2.width, p2.height, 0);
	context.fill();

	context.fillStyle = "white";
	ball.x += ball.velocity_x;
	ball.y += ball.velocity_y;
	context.fillRect(ball.x, ball.y, ball.width, ball.height);
	if (ball.y <= 0 || ball.y + ball.height > height) ball.velocity_y *= -1;
	if (detect_collision(ball, p1)) {
		audio.play();
		if (ball.x <= p1.x + p1.width) ball.velocity_x *= -1;
		else if (ball.y <= p1.y) ball.velocity_y *= -1;
	}
	else if (detect_collision(ball, p2)) {
		audio.play();
		if (p2.x <= ball.x + ball.width) ball.velocity_x *= -1;
		else if (ball.y <= p2.y) ball.velocity_y *= -1;
	}

	if (ball.x < 0) {
		++p2.score; reset();
	}
	else if (ball.x + ball.width > width) {
		++p1.score; reset();
	}
	if (p1.score == 10 || p2.score == 10) {
		p1.score = 0;
		p2.score = 0;
	}

	context.font = "45px Iosevka";
	context.fillStyle = "grey";
	context.fillText(p1.score, width / 5, board.height / 4);
	context.fillText(p2.score, width * 4/5 - 45, board.height / 4);
	for (let i = 0; i < board.height; i += 25) {
		context.fillStyle = "grey";
		context.fillRect(board.width / 2 - 10, i, 5, 15);
	}
	requestAnimationFrame(frame_update);
}
// trajectory depends on who scored. p2 always starts first.
function reset() {
	ball = {
		x : width / 2,
		y : height / 2,
		width : bW,
		height : bH,
		velocity_x : (Math.random() > 0.5 ? 1 : -1) * 2,
		velocity_y : (Math.random() > 0.5 ? 1 : -1) * 2,
	}
	p1 = {
		x : 0,
		y : height / 2,
		width : pW,
		height : pH,
		velocity : 0,
		score : p1.score
	}
	p2 = {
		x : 490,
		y : height / 2,
		width : pW,
		height : pH,
		velocity : 0,
		score : p2.score
	}
}

function detect_collision(a, b) {
	return a.x < b.x + b.width && // l
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y;
}

function move_player() {
	if (keys.w || keys.W) p1.y = Math.max(0, p1.y - 5); // ?
	if (keys.s || keys.S) p1.y = Math.min(board.height - p1.height, p1.y + 5);
	if (keys.ArrowUp) p2.y = Math.max(0, p2.y - 5);
	if (keys.ArrowDown) p2.y = Math.min(board.height - p2.height, p2.y + 5);
}
