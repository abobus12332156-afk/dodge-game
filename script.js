// Улучшенная версия: Game Over экран + бонусы + экран паузы (function(){ const canvas = document.getElementById('game'); const ctx = canvas.getContext('2d'); const W = canvas.width, H = canvas.height;

alert("JS ЗАГРУЗИЛСЯ");

const scoreEl = document.getElementById('score'); const bestEl = document.getElementById('best'); const startBtn = document.getElementById('startBtn'); const restartBtn = document.getElementById('restartBtn');

let state = 'idle'; // idle, running, paused, gameover let keys = {}; let blocks = []; let bonuses = []; let spawnTimer = 0; let bonusTimer = 0; let spawnInterval = 900; let lastTime = 0; let score = 0; let slowTime = 0;

let best = parseInt(localStorage.getItem('fb_best')||'0',10); bestEl.textContent = 'Best: ' + best;

const player = { w:40, h:18, x:(W-40)/2, y:H-60, speed:6, shield:false };

function reset(){ blocks = []; bonuses = []; spawnTimer = 0; bonusTimer = 0; spawnInterval = 900; score = 0; slowTime = 0; player.shield = false; state = 'idle'; player.x = (W-player.w)/2; updateHud(); }

function start(){ if(state==='running') return; state = 'running'; lastTime = performance.now(); requestAnimationFrame(loop); startBtn.style.display = 'none'; restartBtn.style.display = 'none'; }

function gameOver(){ state = 'gameover'; restartBtn.style.display = 'inline-block'; if(score > best){ best = score; localStorage.setItem('fb_best', String(best)); bestEl.textContent = 'Best: ' + best; } }

function updateHud(){ scoreEl.textContent = 'Score: ' + score; }

function spawnBlock(){ const bw = 20 + Math.random()60; const bx = Math.random()(W-bw); const bh = 14 + Math.random()*26; const speed = 1.4 + Math.random()*1.6 + Math.min(3, score/100); blocks.push({x:bx,y:-bh,w:bw,h:bh,spd:speed}); }

function spawnBonus(){ const type = Math.random() < 0.5 ? 'slow' : 'shield'; const size = 16; const x = Math.random()*(W-size); bonuses.push({x, y:-size, w:size, h:size, type, spd:1.5}); }

function loop(ts){ if(state!=='running') return; const dt = ts - lastTime; lastTime = ts;

spawnTimer += dt;
bonusTimer += dt;

if(spawnTimer > spawnInterval){
  spawnTimer = 0;
  spawnBlock();
  if(spawnInterval > 350) spawnInterval *= 0.985;
}

if(bonusTimer > 7000){
  bonusTimer = 0;
  spawnBonus();
}

const speedFactor = slowTime > 0 ? 0.4 : 1;

if(keys['ArrowLeft']||keys['a']||keys['leftTouch']) player.x -= player.speed;
if(keys['ArrowRight']||keys['d']||keys['rightTouch']) player.x += player.speed;
player.x = Math.max(0, Math.min(W-player.w, player.x));

for(let i=blocks.length-1;i>=0;i--){
  const b = blocks[i];
  b.y += b.spd * (dt/16) * speedFactor;
  if(b.y > H){ blocks.splice(i,1); score++; updateHud(); }
  if(player.x < b.x + b.w && player.x + player.w > b.x && player.y < b.y + b.h && player.y + player.h > b.y){
    if(player.shield){ player.shield = false; blocks.splice(i,1); }
    else gameOver();
  }
}

for(let i=bonuses.length-1;i>=0;i--){
  const bo = bonuses[i];
  bo.y += bo.spd * (dt/16);
  if(bo.y > H) bonuses.splice(i,1);
  if(player.x < bo.x + bo.w && player.x + player.w > bo.x && player.y < bo.y + bo.h && player.y + player.h > bo.y){
    if(bo.type==='slow') slowTime = 4000;
    if(bo.type==='shield') player.shield = true;
    bonuses.splice(i,1);
  }
}

if(slowTime > 0) slowTime -= dt;

ctx.clearRect(0,0,W,H);
ctx.fillStyle = '#021021'; ctx.fillRect(0,0,W,H);

ctx.fillStyle = player.shield ? '#22c55e' : '#0ea5a4';
ctx.fillRect(player.x, player.y, player.w, player.h);

ctx.fillStyle = '#f97316';
for(const b of blocks) ctx.fillRect(b.x,b.y,b.w,b.h);

for(const bo of bonuses){
  ctx.fillStyle = bo.type==='slow' ? '#38bdf8' : '#22c55e';
  ctx.fillRect(bo.x,bo.y,bo.w,bo.h);
}

if(state==='running') requestAnimationFrame(loop);

}

window.addEventListener('keydown',e=>{ if(e.key===' '){ if(state==='running'){ state='paused'; startBtn.style.display='inline-block'; startBtn.textContent='Resume'; } else if(state==='paused'){ state='running'; startBtn.style.display='none'; lastTime=performance.now(); requestAnimationFrame(loop); } } keys[e.key]=true; }); window.addEventListener('keyup',e=>keys[e.key]=false);

const leftBtn=document.getElementById('leftBtn'); const rightBtn=document.getElementById('rightBtn'); function bind(btn,key){ if(!btn)return; btn.addEventListener('touchstart',e=>{e.preventDefault();keys[key]=true;},{passive:false}); btn.addEventListener('touchend',e=>{e.preventDefault();keys[key]=false;},{passive:false}); } bind(leftBtn,'leftTouch'); bind(rightBtn,'rightTouch');

startBtn.addEventListener('click',()=>{ if(state!=='running'){ reset(); start(); }}); restartBtn.addEventListener('click',()=>{ reset(); start(); });

reset(); })();
