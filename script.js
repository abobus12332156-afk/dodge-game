// Falling Blocks — стабильная версия без сенсоров

const canvas = document.getElementById("game");
function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
const ctx = canvas.getContext("2d");

function CW() { return canvas.width / (window.devicePixelRatio || 1); }
function CH() { return canvas.height / (window.devicePixelRatio || 1); }

const startBtn = document.getElementById("startBtn"); const restartBtn = document.getElementById("restartBtn"); const scoreEl = document.getElementById("score"); const bestEl = document.getElementById("best");

let blocks = []; let running = false; let lastTime = 0; let spawnTimer = 0; let spawnDelay = 900; let score = 0;

const best = Number(localStorage.getItem("best_score") || 0); bestEl.textContent = "Best: " + best;

const player = { w: 40, h: 16, x: W / 2 - 20, y: H - 70, speed: 6, left: false, right: false, };

function reset() { blocks = []; score = 0; spawnDelay = 900; spawnTimer = 0; player.x = W / 2 - player.w / 2; updateHud(); }

function updateHud() { scoreEl.textContent = "Score: " + score; }

function spawnBlock() { const w = 20 + Math.random() * 50; const h = 16 + Math.random() * 24; const x = Math.random() * (W - w); const speed = 2 + Math.random() * 2; blocks.push({ x, y: -h, w, h, speed }); }

function loop(ts) { if (!running) return;

const dt = ts - lastTime; lastTime = ts;

spawnTimer += dt; if (spawnTimer > spawnDelay) { spawnTimer = 0; spawnBlock(); if (spawnDelay > 350) spawnDelay *= 0.97; }

if (player.left) player.x -= player.speed; if (player.right) player.x += player.speed; player.x = Math.max(0, Math.min(W - player.w, player.x));

for (let i = blocks.length - 1; i >= 0; i--) { const b = blocks[i]; b.y += b.speed * (dt / 16);

if (b.y > H) {
  blocks.splice(i, 1);
  score++;
  updateHud();
  continue;
}

const pad = 6;

if (
  player.x + pad < b.x + b.w - pad &&
  player.x + player.w - pad > b.x + pad &&
  player.y + pad < b.y + b.h - pad &&
  player.y + player.h - pad > b.y + pad
) {
  gameOver();
}

ctx.clearRect(0, 0, W, H);

ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);

ctx.fillStyle = "#22d3ee"; ctx.fillRect(player.x, player.y, player.w, player.h);

ctx.fillStyle = "#fb923c"; blocks.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

requestAnimationFrame(loop); }

function start() { reset(); running = true; lastTime = performance.now(); startBtn.style.display = "none"; restartBtn.style.display = "none"; requestAnimationFrame(loop); }

function gameOver() { running = false; restartBtn.style.display = "inline-block";

const bestNow = Number(localStorage.getItem("best_score") || 0); if (score > bestNow) { localStorage.setItem("best_score", score); bestEl.textContent = "Best: " + score; } }

window.addEventListener("keydown", e => { if (e.key === "ArrowLeft" || e.key === "a") player.left = true; if (e.key === "ArrowRight" || e.key === "d") player.right = true; });

window.addEventListener("keyup", e => { if (e.key === "ArrowLeft" || e.key === "a") player.left = false; if (e.key === "ArrowRight" || e.key === "d") player.right = false; });

const leftBtn = document.getElementById("leftBtn"); const rightBtn = document.getElementById("rightBtn");

leftBtn?.addEventListener("touchstart", () => player.left = true); leftBtn?.addEventListener("touchend", () => player.left = false); rightBtn?.addEventListener("touchstart", () => player.right = true); rightBtn?.addEventListener("touchend", () => player.right = false);

startBtn.addEventListener("click", start); restartBtn.addEventListener("click", start);
