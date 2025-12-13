function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");

  let state = "idle";
  let blocks = [];
  let keys = {};
  let lastTime = 0;
  let spawnTimer = 0;
  let spawnInterval = 900;
  let score = 0;

  let best = parseInt(localStorage.getItem("fb_best") || "0", 10);
  bestEl.textContent = "Best: " + best;

  const player = {
    w: 40,
    h: 18,
    x: (W - 40) / 2,
    y: H - 60,
    speed: 6,
  };

  function reset() {
    blocks = [];
    score = 0;
    spawnTimer = 0;
    spawnInterval = 900;
    player.x = (W - player.w) / 2;
    state = "idle";
    updateHud();
  }

  function start() {
    if (state === "running") return;
    state = "running";
    lastTime = performance.now();
    startBtn.style.display = "none";
    restartBtn.style.display = "none";
    requestAnimationFrame(loop);
  }

  function gameOver() {
    state = "gameover";
    restartBtn.style.display = "inline-block";

    if (score > best) {
      best = score;
      localStorage.setItem("fb_best", String(best));
      bestEl.textContent = "Best: " + best;
    }
  }

  function updateHud() {
    scoreEl.textContent = "Score: " + score;
  }

  function spawnBlock() {
    const w = 20 + Math.random() * 60;
    const h = 14 + Math.random() * 26;
    const x = Math.random() * (W - w);
    const speed = 1.5 + Math.random() * 1.5;
    blocks.push({ x, y: -h, w, h, speed });
  }

  function loop(ts) {
    if (state !== "running") return;
    const dt = ts - lastTime;
    lastTime = ts;

    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      spawnBlock();
      if (spawnInterval > 350) spawnInterval *= 0.985;
    }

    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed * (dt / 16);

      if (b.y > H) {
        blocks.splice(i, 1);
        score++;
        updateHud();
        continue;
      }

      if (
        player.x < b.x + b.w &&
        player.x + player.w > b.x &&
        player.y < b.y + b.h &&
        player.y + player.h > b.y
      ) {
        gameOver();
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#021021";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#0ea5a4";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = "#f97316";
    blocks.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));

    if (state === "running") requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
    if (e.key === " ") {
      e.preventDefault();
      if (state === "running") {
        state = "paused";
        startBtn.style.display = "inline-block";
        startBtn.textContent = "Resume";
      } else if (state === "paused") {
        state = "running";
        startBtn.style.display = "none";
        startBtn.textContent = "Start";
        lastTime = performance.now();
        requestAnimationFrame(loop);
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  });

  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const pauseBtn = document.getElementById("pauseBtn");

  if (leftBtn) {
    leftBtn.addEventListener("touchstart", () => (keys.left = true));
    leftBtn.addEventListener("touchend", () => (keys.left = false));
  }
  if (rightBtn) {
    rightBtn.addEventListener("touchstart", () => (keys.right = true));
    rightBtn.addEventListener("touchend", () => (keys.right = false));
  }
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      if (state === "running") {
        state = "paused";
        startBtn.style.display = "inline-block";
        startBtn.textContent = "Resume";
      }
    });
  }

  startBtn.addEventListener("click", () => {
    if (state !== "running") start();
  });
  restartBtn.addEventListener("click", () => {
    reset();
    start();
  });

  reset();
})();
