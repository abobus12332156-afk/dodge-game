(() => {
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const bestEl = document.getElementById('best');
const startBtn = document.getElementById('startBtn');

let state = 'idle', keys = {}, blocks = [], bonuses = [], spawnTimer = 0, spawnInterval = 900, lastTime = 0;
let score = 0, lives = 3, invuln = 0, shake = 0, slowTime = 0, best = parseInt(localStorage.getItem('db_best')||'0',10);
bestEl.textContent = 'Best: ' + best;

const player = {w:40,h:18,x:(W-40)/2,y:H-60,speed:6};
let combo = 0;

function reset(){
    blocks=[]; bonuses=[]; spawnTimer=0; spawnInterval=900; score=0; lives=3; invuln=0; slowTime=0; combo=0;
    state='idle'; player.x=(W-player.w)/2; updateHud();
}

function start(){state='running'; lastTime=performance.now(); startBtn.style.display='none'; requestAnimationFrame(loop);}

function gameOver(){
    state='gameover';
    startBtn.style.display='inline-block'; startBtn.textContent='Restart';
    if(score>best){ best=score; localStorage.setItem('db_best',best); bestEl.textContent='Best: '+best; }
}

function updateHud(){scoreEl.textContent='Score: '+score+' | Combo: '+combo; livesEl.textContent='Lives: '+lives;}

function spawnBlock(){ 
    const bw = 20 + Math.random()*60, bx = Math.random()*(W-bw), bh = 14 + Math.random()*26;
    const speed = 1.5 + Math.random()*1.8 + Math.min(3, score/120);
    blocks.push({x:bx,y:-bh,w:bw,h:bh,spd:speed});
}

function spawnBonus(){ 
    const type = Math.random()<0.5?'shield':'slow'; 
    bonuses.push({x:Math.random()*(W-24),y:-24,s:24,type});
}

function hit(){
    if(invuln>0) return;
    lives--; invuln=1200; shake=12; combo=0; updateHud();
    player.y -= 10; // толчок
    if(lives<=0) gameOver();
}

const particles = [];
function createParticle(x,y,color){
    for(let i=0;i<8;i++){
        particles.push({
            x, y,
            vx: (Math.random()-0.5)*2,
            vy: (Math.random()-0.5)*2,
            life: 300 + Math.random()*200,
            color
        });
    }
}

function loop(ts){
    if(state!=='running') return;
    const dt = ts-lastTime; lastTime=ts;
    spawnTimer += dt;

    if(spawnTimer>spawnInterval){
        spawnTimer=0; spawnBlock();
        if(Math.random()<0.2) spawnBonus();
        if(spawnInterval>320) spawnInterval *=0.985;
    }

    if(keys['ArrowLeft']||keys['a']) player.x-=player.speed;
    if(keys['ArrowRight']||keys['d']) player.x+=player.speed;
    player.x = Math.max(0, Math.min(W-player.w, player.x));

    const timeFactor = slowTime>0?0.4:1;

    for(let i=blocks.length-1;i>=0;i--){
        const b = blocks[i];
        b.y += b.spd*timeFactor*(dt/16);
        if(b.y>H){ blocks.splice(i,1); score++; combo++; updateHud(); }
        if(invuln<=0 && player.x < b.x+b.w && player.x+player.w>b.x && player.y<b.y+b.h && player.y+player.h>b.y){
            blocks.splice(i,1); hit(); createParticle(player.x+player.w/2, player.y+player.h/2, '#f97316'); 
        }
    }

    for(let i=bonuses.length-1;i>=0;i--){
        const bo=bonuses[i]; bo.y+=2*(dt/16);
        if(bo.y>H) bonuses.splice(i,1);
        if(player.x<bo.x+bo.s && player.x+player.w>bo.x && player.y<bo.y+bo.s && player.y+player.h>bo.y){
            if(bo.type==='shield') lives++;
            if(bo.type==='slow') slowTime=4000;
            createParticle(bo.x+bo.s/2, bo.y+bo.s/2, bo.type==='shield'?'#22c55e':'#38bdf8');
            bonuses.splice(i,1); updateHud();
        }
    }

    invuln -= dt; if(invuln<0) invuln=0;
    slowTime -= dt; shake*=0.85;

    // render
    ctx.save();
    if(shake>0) ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake);
    
    // фон
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, '#021021');
    grad.addColorStop(1, '#001016');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // red warning если блок близко
    let danger = 0;
    blocks.forEach(b=>{
        const dy = b.y - player.y;
        if(dy>0 && dy<100) danger = Math.max(danger, 1-(dy/100));
    });
    if(danger>0){
        ctx.fillStyle = `rgba(255,0,0,${danger*0.15})`;
        ctx.fillRect(0,0,W,H);
    }

    // игрок
    ctx.fillStyle = invuln>0?'#7dd3fc':'#0ea5a4';
    roundRect(ctx, player.x, player.y, player.w, player.h, 4);

    // блоки
    ctx.fillStyle = '#f97316';
    blocks.forEach(b=>roundRect(ctx,b.x,b.y,b.w,b.h,3));

    // бонусы
    bonuses.forEach(b=>{
        ctx.fillStyle = b.type==='shield'?'#22c55e':'#38bdf8';
        ctx.beginPath(); ctx.arc(b.x+b.s/2,b.y+b.s/2,b.s/2,0,Math.PI*2); ctx.fill();
    });

    // particles
    for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];
        p.x+=p.vx; p.y+=p.vy; p.life-=dt;
        if(p.life<=0){particles.splice(i,1); continue;}
        ctx.fillStyle=p.color; ctx.globalAlpha=Math.min(1,p.life/400);
        ctx.fillRect(p.x,p.y,3,3); ctx.globalAlpha=1;
    }

    // overlay
    if(state==='paused'){ overlay('PAUSED'); }

    ctx.restore();
    requestAnimationFrame(loop);
}

function overlay(text){
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.font='bold 32px system-ui'; ctx.textAlign='center';
    ctx.fillText(text,W/2,H/2);
}

function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill();}

window.addEventListener('keydown',e=>{
    if(e.key===' '){ e.preventDefault(); 
        if(state==='running'){state='paused'; startBtn.style.display='inline-block'; startBtn.textContent='Resume';}
        else if(state==='paused'){state='running'; startBtn.style.display='none'; lastTime=performance.now(); requestAnimationFrame(loop);}
    }
    keys[e.key]=true;
});
window.addEventListener('keyup',e=>keys[e.key]=false);
startBtn.onclick=()=>{ reset(); start(); };

reset();
})();}
