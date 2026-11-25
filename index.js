const keys = {};
const PADDLE_SPEED = 360; 
let lastTime = null, online_network_instance = null;
const clamp = (value, min, max) => { 
	return Math.max(min, Math.min(max, value));
}
// could be just array
const game_mode = [{
	a: "locally",
	b: "online"
}];
let board, context, finish = false, paused = false;
let board_w = 900, board_h = 700;
let player_w = 10, player_h = 50;
var audio = new Audio('assets/beep.mp3');

let p1 = {
	x : 0,
	y : (board_h - player_h) / 2,
	width : player_w,
	height : player_h,
	velocity : 0,
	score : 0
}
let p2 = {
	x : board_w - 10,
	y : (board_h - player_h) / 2,
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
	velocity_x : 360,
	velocity_y : (Math.random() * 240 - 120)
}

// initial
function play_locally() {
	board = document.getElementById("board");
	board.height = board_h;
	board.width = board_w;
	context = board.getContext("2d");
	randomize_ball_velocity(ball);
	requestAnimationFrame(frame_update);
}

function play_online() {
	if (online_network_instance) return;
	online_network_instance = new PeerNetwork(
		"carlo-alberto-lobby",
		(data) => {
			console.log("Received from other player", data);
		},
		(status) => {
			console.log(status);
		}
	)
	online_network_instance.start();
}

// keys listen
document.addEventListener("keydown", (e) => {
	if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
	keys[e.key] = true;
});
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

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
	else if (selected.textContent.trim() === game_mode[0].b) {
		// hide the selector
		document.querySelector(".center").style.display = "none";
		
		const gm = document.getElementById("screen");
		gm.style.display = "flex";
		play_online();
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

function draw_ball(ball, ctx, color) {
	ctx.fillStyle = color;
	ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
}

function update_ball(ball, dt) {
	ball.x += ball.velocity_x * dt;
	ball.y += ball.velocity_y * dt;
}

function frame_update(current_time) {
	// recalculate for each new frame
	const dt = lastTime === null ? 0 : Math.min((current_time - lastTime) / 1000, 0.03);
	lastTime = current_time;
	context.clearRect(0, 0, board.width + 20, board.height);
	move_player(p1, p2, dt);
	// fix this velocity logic
	draw_round_rect(context, p1, 0, "white");
	draw_round_rect(context, p2, 0, "white");

	update_ball(ball, dt);
	if (ball.y < 0) { 
		ball.y = 0;
		ball.velocity_y = Math.abs(ball.velocity_y);
	} else if (ball.y + ball.height > board_h) {
		ball.y = board_h - ball.height;
		ball.velocity_y = -Math.abs(ball.velocity_y); // reverse
	}

	// collisions
	if (ball.velocity_x < 0 && detect_collision(ball, p1)) {
		ball.x = p1.x + p1.width;
		randomize_ball_velocity(ball, 1);
		audio.play().catch(() => {});
	} else if (ball.velocity_x > 0 && detect_collision(ball, p2)) {
		ball.x = p2.x - ball.width;
		randomize_ball_velocity(ball, -1);
		audio.play().catch(() => {});
	} 
	score_conditions(ball, p1, p2);
	draw_ball(ball, context, "white");

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
		y : (board_h - player_h) / 2,
		width : ball_w,
		height : ball_h,
	}
	p1 = {
		x : 0,
		y : (board_h - player_h) / 2,
		width : player_w,
		height : player_h,
		velocity : 0,
		score : p1.score
	}
	p2 = {
		x : board_w - 10,
		y : board_h / 2,
		width : player_w,
		height : player_h,
		velocity : 0,
		score : p2.score
	}
	randomize_ball_velocity(ball);
}

function detect_collision(a, b) {
	return a.x < b.x + b.width && // l
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y;
}
// some slop
function randomize_ball_velocity(ball, direction = Math.random() < 0.5 ? -1 : 1) {
	const speed = 300 + Math.random() * 250; // 300–550 px/s
	const angle = (Math.random() * 2 - 1) * 0.9; // varied angle, about ±52°

	ball.velocity_x = direction * speed * Math.cos(angle);
	ball.velocity_y = speed * Math.sin(angle);
}

function move_player(p1, p2, dt) {
	const p1_direction = (keys.w || keys.W ? -1 : 0) + (keys.s || keys.S ? 1 : 0);
	const p2_direction = (keys.ArrowUp ? -1 : 0) + (keys.ArrowDown ? 1 : 0);

	p1.velocity = p1_direction * PADDLE_SPEED;
	p2.velocity = p2_direction * PADDLE_SPEED;

	p1.y = clamp(p1.y + p1.velocity * dt, 0, board.height - p1.height);
	p2.y = clamp(p2.y + p2.velocity * dt, 0, board.height - p2.height);
}
