const keys = {};
// could be just array
const game_mode = [{
	a: "locally",
	b: "online"
}];
let board, context, finish = false, paused = false;
let board_w = 500, board_h = 500;
let player_w = 10, player_h = 50;
var audio = new Audio('beep.mp3');

let p1 = {
	x : 0,
	y : board_h / 2,
	width : player_w,
	height : player_h,
	velocity : 0,
	score : 0
}
let p2 = {
	x : 490,
	y : board_h / 2,
	width : player_w,
	height : player_h,
	velocity : 0,
	score : 0
}
let ball_w = 10, ball_h = 10;
let ball = {
	x : board_w / 2,
	y : board_h / 2,
	width : ball_w,
	height : ball_h,
	velocity_x : (Math.random() > 0.5 ? 1 : -1) * 2,
	velocity_y : (Math.random() * 6 - 3)
}

// initial
function play_locally() {
	board = document.getElementById("board");
	board.height = board_h;
	board.width = board_w;
	context = board.getContext("2d");
	// initial render
	draw_round_rect(context, p1, 0, "white");
	draw_round_rect(context, p2, 0, "white");

	// keys listen
	document.addEventListener("keydown", (e) => {
		if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
		keys[e.key] = true;
	});
	document.addEventListener("keyup", (e) => { keys[e.key] = false; });
	move_player(p1, p2);
	requestAnimationFrame(frame_update);
}

document.addEventListener('DOMContentLoaded', function() {
	const options = document.querySelectorAll('.either-option');
	load_selection();
	options.forEach(option => {
		option.addEventListener('click', handle_selection);
		option.addEventListener('keydown', function(event) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				handle_selection(event);
			}
		});
	});
});

function load_selection() {
	const options = document.querySelectorAll('.either-option');
	options[0].textContent = game_mode[0].a;
	options[1].textContent = game_mode[0].b;
}

function handle_selection(event) {
	const selected = event.currentTarget;

	document.querySelectorAll('.either-option').forEach(option => {
		option.setAttribute('aria-checked', 'false');
		option.classList.remove('selected');
	});

	selected.setAttribute('aria-checked', 'true');
	selected.classList.add('selected');
	console.log(selected.textContent.trim());

	if (selected.textContent.trim() === game_mode[0].a) {
		// hide the selector
		document.querySelector(".center").style.display = "none";
		
		const gm = document.getElementById("screen");
		gm.style.display = "flex";
		play_locally();
	}
}

/*function timer() {
	const page = document.querySelector("#general");
	const t = document.querySelector('.timer');
	const overlay = document.querySelector("#overlay");
	
	t.style.display = "flex";
	const INIT_VALUE = 3;
	let number = INIT_VALUE;

	document.body.classList.add('counting');
	page.inert = true;

	t.textContent = String(number);
	const interval = setInterval(() => {
		number -= 1;
		t.textContent = String(number);
		if (number <= 0) {
			clearInterval(interval); 
			document.body.classList.remove('counting');
			page.inert = false;
			overlay.style.display = 'none';
			paused = false;
		}
	}, 1000);
}*/

function out_of_bounds(y) {
	return (y < 0 || y + player_h > board_h);
}

function draw_round_rect(ctx, player, round_corner, color ) {
	ctx.fillStyle = color;
	ctx.fillRect(player.x, player.y, player.width, player.height);

	ctx.fillStyle = "#087f75";
	ctx.fillRect(player.x, player.y, 2, player.height);
	ctx.fillRect(player.x + player.width - 2, player.y, 2, player.height);
	
	ctx.fillStyle = "#c8fff5";
	ctx.fillRect(player.x + 3, player.y + 5, Math.max(1, player.width - 6), 5);
	ctx.fillRect(player.x + 3, player.y + player.height - 10, Math.max(1, player.width - 6), 5);
}

function ball_position(ball, ctx, color) {
	context.fillStyle = color;
	ball.x += ball.velocity_x;
	ball.y += ball.velocity_y;
	context.fillRect(ball.x, ball.y, ball.width, ball.height);
}

function frame_update() {
	context.clearRect(0, 0, board.width + 20, board.height);
	move_player(p1, p2);
	// fix this velocity logic
	let _y1 = p1.y + p1.velocity;
	if (!out_of_bounds(_y1)) p1.y = _y1;
	draw_round_rect(context, p1, 0, "white");
	let _y2 = p2.y + p2.velocity;
	if (!out_of_bounds(_y2)) p2.y = _y2;
	draw_round_rect(context, p2, 0, "white");

	ball_position(ball, context, "white");
	if (ball.y <= 0 || ball.y + ball.height > board_h) ball.velocity_y *= -1;
	if (ball.velocity_x < 0 && detect_collision(ball, p1)) {
		audio.play();
		if (ball.x <= p1.x + p1.width) ball.velocity_x *= -1;
		else if (ball.y <= p1.y) ball.velocity_y *= -1;
	}
	else if (ball.velocity_x > 0 && detect_collision(ball, p2)) {
		audio.play();
		if (p2.x <= ball.x + ball.width) ball.velocity_x *= -1;
		else if (ball.y <= p2.y) ball.velocity_y *= -1;
	}
	score_conditions(ball, p1, p2);

	// redraw scores and center line
	context.font = "45px Courier New";
	context.fillStyle = "grey";
	context.fillText(p1.score, board_w / 5, board.height / 4);
	context.fillText(p2.score, board_w * 4/5 - 45, board.height / 4);
	for (let i = 0; i < board.height; i += 25) {
		context.fillStyle = "grey";
		context.fillRect(board.width / 2 + 5, i, 5, 15);
	}
	requestAnimationFrame(frame_update);
}

function score_conditions(ball, p1, p2) {
	if (ball.x < 0) {
		console.log(ball.x);
		console.log(ball.x + ball.width);
		++p2.score; reset();
	}
	else if (ball.x + ball.width > board_w) {
		console.log(ball.x);
		console.log(ball.x + ball.width);
		++p1.score; reset();
	}
	// game over. update later. add some winning screen idk
	if (p1.score == 10 || p2.score == 10) {
		p1.score = 0; p2.score = 0; reset();
	}
}

// trajectory depends on who scored. p2 always starts first.
function reset() {
	ball = {
		x : board_w / 2,
		y : board_h / 2,
		width : ball_w,
		height : ball_h,
		velocity_x : (Math.random() > 0.5 ? 1 : -1) * 2,
		velocity_y : (Math.random() * 6 - 3), // holy angle
	}
	p1 = {
		x : 0,
		y : board_h / 2,
		width : player_w,
		height : player_h,
		velocity : 0,
		score : p1.score
	}
	p2 = {
		x : 490,
		y : board_h / 2,
		width : player_w,
		height : player_h,
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

function move_player(p1, p2) {
	if (keys.w || keys.W) p1.y = Math.max(0, p1.y - 5); // ?
	if (keys.s || keys.S) p1.y = Math.min(board.height - p1.height, p1.y + 5);
	if (keys.ArrowUp) p2.y = Math.max(0, p2.y - 5);
	if (keys.ArrowDown) p2.y = Math.min(board.height - p2.height, p2.y + 5);
}
