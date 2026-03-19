const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const W = canvas.width;
const H = canvas.height;

let state = 'idle';
let keys = {};

let blocks = [];
let bonuses = [];

let spawnTimer = 0;
let bonusTimer = 0;
let lastTime = 0;

let score = 0;
let best = Number(localStorage.getItem('best') || 0);

bestEl.textContent = "Best: " + best;

const player = {
  x: W / 2 - 20,
  y: H - 60,
  w: 40,
  h: 18,
  speed: 6,
  shield: false
};

// ---------- GAME LOGIC ----------

function reset() {
  blocks = [];
  bonuses = [];
  score = 0;
  player.x = W / 2 - 20;
  player.shield = false;
  updateHud();
  state = 'idle';
}

function start() {
  if (state === 'running') return;
  state = 'running';
  lastTime = performance.now();
  requestAnimationFrame(loop);
  startBtn.style.display = 'none';
  restartBtn.style.display = 'none';
}

function gameOver() {
  state = 'gameover';
  restartBtn.style.display = 'inline-block';

  if (score > best) {
    best = score;
    localStorage.setItem('best', best);
    bestEl.textContent = "Best: " + best;
  }
}

function updateHud() {
  scoreEl.textContent = "Score: " + score;
}

// ---------- SPAWN ----------

function spawnBlock() {
  const w = 20 + Math.random() * 60;
  const x = Math.random() * (W - w);
  const h = 20;

  blocks.push({
    x,
    y: -h,
    w,
    h,
    spd: 2 + Math.random() * 2
  });
}

function spawnBonus() {
  const size = 16;

  bonuses.push({
    x: Math.random() * (W - size),
    y: -size,
    w: size,
    h: size,
    type: Math.random() > 0.5 ? 'shield' : 'slow',
    spd: 2
  });
}

// ---------- LOOP ----------

function loop(ts) {
  if (state !== 'running') return;

  const dt = ts - lastTime;
  lastTime = ts;

  spawnTimer += dt;
  bonusTimer += dt;

  if (spawnTimer > 800) {
    spawnTimer = 0;
    spawnBlock();
  }

  if (bonusTimer > 6000) {
    bonusTimer = 0;
    spawnBonus();
  }

  // движение игрока
 if (keys['arrowleft'] || keys['a'] || touchLeft) player.x -= player.speed;
if (keys['arrowright'] || keys['d'] || touchRight) player.x += player.speed;

  player.x = Math.max(0, Math.min(W - player.w, player.x));

  // блоки
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    b.y += b.spd;

    if (b.y > H) {
      blocks.splice(i, 1);
      score++;
      updateHud();
    }

    if (collision(player, b)) {
      if (player.shield) {
        player.shield = false;
        blocks.splice(i, 1);
      } else {
        gameOver();
      }
    }
  }

  // бонусы
  for (let i = bonuses.length - 1; i >= 0; i--) {
    const bo = bonuses[i];
    bo.y += bo.spd;

    if (bo.y > H) bonuses.splice(i, 1);

    if (collision(player, bo)) {
      if (bo.type === 'shield') player.shield = true;
      if (bo.type === 'slow') {
        blocks.forEach(b => b.spd *= 0.5);
      }
      bonuses.splice(i, 1);
    }
  }

  draw();

  requestAnimationFrame(loop);
}

// ---------- DRAW ----------

function draw() {
  ctx.clearRect(0, 0, W, H);

  // игрок
  ctx.fillStyle = player.shield ? 'lime' : '#0ea5a4';
  ctx.fillRect(player.x, player.y, player.w, player.h);

let touchLeft = false;
let touchRight = false;

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const pauseBtn = document.getElementById('pauseBtn');

// удержание кнопок
leftBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  touchLeft = true;
}, { passive: false });

leftBtn.addEventListener('touchend', e => {
  e.preventDefault();
  touchLeft = false;
}, { passive: false });

rightBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  touchRight = true;
}, { passive: false });

rightBtn.addEventListener('touchend', e => {
  e.preventDefault();
  touchRight = false;
}, { passive: false });

// пауза
pauseBtn.addEventListener('click', () => {
  if (state === 'running') {
    state = 'paused';
    startBtn.style.display = 'inline-block';
    startBtn.textContent = "Resume";
  } else if (state === 'paused') {
    start();
  }
});

  // блоки
  ctx.fillStyle = 'red';
  blocks.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // бонусы
  bonuses.forEach(b => {
    ctx.fillStyle = b.type === 'shield' ? 'green' : 'blue';
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
}

// ---------- COLLISION ----------

function collision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ---------- INPUT ----------

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === ' ') {
    if (state === 'running') {
      state = 'paused';
      startBtn.style.display = 'inline-block';
      startBtn.textContent = "Resume";
    } else if (state === 'paused') {
      start();
    }
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// ---------- BUTTONS ----------

startBtn.onclick = () => {
  reset();
  start();
};

restartBtn.onclick = () => {
  reset();
  start();
};

// ---------- INIT ----------

reset();