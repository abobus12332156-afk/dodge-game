<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Dodge Blocks - Фонк-версия</title>
<style>
body{margin:0; display:flex; justify-content:center; align-items:center; background:#021021; height:100vh; overflow:hidden;}
canvas{border:2px solid #0ea5a4; border-radius:4px; background:#021021;}
</style>
</head>
<body>
<canvas id="game" width="400" height="600"></canvas>
<button id="autoStart" style="display:none"></button>

<script>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const player = {x:W/2-20, y:H-60, w:40, h:18, speed:6};
let blocks=[], lastTime=0, state='idle', score=0;

const audio = new Audio('vooce.mp3'); // вставь путь к треку
audio.loop = true;

const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
const dataArray = new Uint8Array(analyser.frequencyBinCount);
const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

// невидимая кнопка
const autoStartBtn = document.getElementById('autoStart');
autoStartBtn.onclick = () => {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    audio.play().catch(()=>console.log('audio blocked'));
    state='running';
    lastTime = performance.now();
    requestAnimationFrame(loop);
};

// имитация клика сразу
autoStartBtn.click();

function spawnBlock(){
    const bw = 20 + Math.random()*60;
    const bx = Math.random()*(W-bw);
    blocks.push({x:bx,y:-30,w:bw,h:20,spd:2+Math.random()*2});
}

function loop(ts){
    if(state!=='running') return;
    const dt = ts - lastTime;
    lastTime = ts;

    analyser.getByteFrequencyData(dataArray);
    const bass = dataArray.slice(0,10).reduce((a,b)=>a+b,0)/10;

    if(bass>80) spawnBlock();

    ctx.clearRect(0,0,W,H);

    // фон
    ctx.fillStyle='#021021';
    ctx.fillRect(0,0,W,H);

    // красное мерцание по басу
    if(bass>80){
        ctx.fillStyle=`rgba(255,0,0,${Math.min(0.3,(bass-80)/80)})`;
        ctx.fillRect(0,0,W,H);
    }

    // игрок
    ctx.fillStyle='#0ea5a4';
    ctx.fillRect(player.x,player.y,player.w,player.h);

    // блоки
    ctx.fillStyle='#f97316';
    for(let i=blocks.length-1;i>=0;i--){
        const b = blocks[i];
        b.y += b.spd*(dt/16);
        ctx.fillRect(b.x,b.y,b.w,b.h);
        if(b.y>H) blocks.splice(i,1);
    }

    requestAnimationFrame(loop);
}
</script>
</body>
</html>
