(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');

  let state = 'idle'; // idle, running, paused, gameover
  let keys = {};
  let blocks = [];
  let spawnTimer = 0;
  let spawnInterval = 900;
  let lastTime = 0;
  let score = 0;
  let best = parseInt(localStorage.getItem('fb_best')||'0',10);
  bestEl.textContent = 'Best: ' + best;

  const player = {w:40,h:18,x:(W-40)/2,y:H-60,speed:6};

  function reset(){
    blocks = [];
    spawnTimer = 0;
    spawnInterval = 900;
    score = 0;
    state = 'idle';
    player.x = (W-player.w)/2;
    updateHud();
  }

  function start(){
    if(state==='running') return;
    state = 'running';
    lastTime = performance.now();
    requestAnimationFrame(loop);
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
  }

  function gameOver(){
    state = 'gameover';
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    if(score>best){ best = score; localStorage.setItem('fb_best', String(best)); bestEl.textContent = 'Best: ' + best; }
  }

  function updateHud(){
    scoreEl.textContent = 'Score: ' + score;
  }

  function spawnBlock(){
    const bw = 20 + Math.random()*60;
    const bx = Math.random()*(W-bw);
    const bh = 14 + Math.random()*26;
    const speed = 1.4 + Math.random()*1.6 + Math.min(3, score/100);
    blocks.push({x:bx,y:-bh,w:bw,h:bh,spd:speed});
  }

  function loop(ts){
    if(state!=='running') return;
    const dt = ts - lastTime;
    lastTime = ts;

    // spawn
    spawnTimer += dt;
    if(spawnTimer > spawnInterval){
      spawnTimer = 0;
      spawnBlock();
      if(spawnInterval>350) spawnInterval *= 0.985; // speed up gradually
    }

    // input (keyboard + touch)
    if(keys['ArrowLeft']||keys['a']||keys['leftTouch']) player.x -= player.speed;
    if(keys['ArrowRight']||keys['d']||keys['rightTouch']) player.x += player.speed;
    // sensor tilt adds analog movement when enabled
    if(typeof sensorActive !== 'undefined' && sensorActive && Math.abs(sensorGamma) > 1){
      const factor = 0.08;
      player.x += sensorGamma * factor * (dt/16);
    }
    player.x = Math.max(0, Math.min(W-player.w, player.x));

    // update blocks
    for(let i=blocks.length-1;i>=0;i--){
      const b = blocks[i];
      b.y += b.spd * (dt/16);
      if(b.y > H){ blocks.splice(i,1); score += 1; updateHud(); }
      // collision
      if(player.x < b.x + b.w && player.x + player.w > b.x && player.y < b.y + b.h && player.y + player.h > b.y){
        gameOver();
      }
    }

    // render
    ctx.clearRect(0,0,W,H);
    // background subtle gradient
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#021021'); g.addColorStop(1,'#001016');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // player
    ctx.fillStyle = '#0ea5a4';
    roundRect(ctx, player.x, player.y, player.w, player.h, 4);

    // blocks
    ctx.fillStyle = '#f97316';
    for(const b of blocks){ roundRect(ctx, b.x, b.y, b.w, b.h, 3); }

    // score small overlay
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(6,6,110,28);
    ctx.fillStyle = '#e6eef8'; ctx.font = '14px system-ui,Segoe UI,Roboto'; ctx.fillText('Score: '+score, 12, 24);

    if(state==='running') requestAnimationFrame(loop);
  }

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
    ctx.fill();
  }

  // input handlers
  window.addEventListener('keydown',e=>{
    if(e.key === ' '){
      e.preventDefault();
      if(state==='running'){ state='paused'; startBtn.style.display='inline-block'; startBtn.textContent='Resume'; }
      else if(state==='paused'){ state='running'; startBtn.style.display='none'; startBtn.textContent='Start'; lastTime = performance.now(); requestAnimationFrame(loop); }
      return;
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup',e=>{ keys[e.key] = false; });

  // touch / mouse controls for mobile buttons
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  function bindButton(btn, keyName){
    if(!btn) return;
    btn.addEventListener('touchstart', e=>{ e.preventDefault(); keys[keyName] = true; }, {passive:false});
    btn.addEventListener('touchend', e=>{ e.preventDefault(); keys[keyName] = false; }, {passive:false});
    btn.addEventListener('mousedown', e=>{ e.preventDefault(); keys[keyName] = true; });
    window.addEventListener('mouseup', e=>{ keys[keyName] = false; });
  }
  bindButton(leftBtn, 'leftTouch');
  bindButton(rightBtn, 'rightTouch');

  if(pauseBtn){
    pauseBtn.addEventListener('click', ()=>{
      if(state==='running'){ state='paused'; startBtn.style.display='inline-block'; startBtn.textContent='Resume'; }
      else if(state==='paused'){ state='running'; startBtn.style.display='none'; startBtn.textContent='Start'; lastTime = performance.now(); requestAnimationFrame(loop); }
    });
  }

  // sensor button (tilt) and device orientation handling
  const sensorBtn = document.getElementById('sensorBtn');
  let sensorActive = false;
  let sensorGamma = 0;
  let sensorListener = null;

  function handleOrientation(e){
    sensorGamma = e.gamma || 0;
  }

  async function enableSensor(){
    if(sensorActive) return;
    if(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'){
      try{
        const resp = await DeviceOrientationEvent.requestPermission();
        if(resp !== 'granted') { alert('Разрешение на датчик не получено'); return; }
      }catch(err){ alert('Не удалось запросить разрешение'); return; }
    }
    sensorListener = handleOrientation;
    window.addEventListener('deviceorientation', sensorListener);
    sensorActive = true;
    if(sensorBtn) sensorBtn.textContent = 'Tilt: On';
  }

  function disableSensor(){
    if(!sensorActive) return;
    if(sensorListener) window.removeEventListener('deviceorientation', sensorListener);
    sensorListener = null;
    sensorActive = false;
    sensorGamma = 0;
    if(sensorBtn) sensorBtn.textContent = 'Tilt: Off';
  }

  if(sensorBtn){
    sensorBtn.addEventListener('click', ()=>{ if(!sensorActive) enableSensor(); else disableSensor(); });
  }

  startBtn.addEventListener('click', ()=>{ if(state==='idle' || state==='gameover'){ reset(); start(); } else if(state==='paused'){ state='running'; startBtn.style.display='none'; startBtn.textContent='Start'; lastTime = performance.now(); requestAnimationFrame(loop); } else { start(); } });
  restartBtn.addEventListener('click', ()=>{ reset(); start(); restartBtn.style.display='none'; });

  // init
  reset();
})();
