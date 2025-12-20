const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

let blocks=[], particles=[], lastTime=0, state='idle', score=0, shake=0;

// Игрок
const player = {x:0, y:0, w:40, h:18, speed:6, vx:0, vy:0, alive:true};

function randomSpawnPlayer(){
    const side = Math.floor(Math.random()*4);
    switch(side){
        case 0: player.x=-player.w; player.y=H/2; player.vx=4; player.vy=0; break;
        case 1: player.x=W; player.y=H/2; player.vx=-4; player.vy=0; break;
        case 2: player.x=-player.w; player.y=-player.h; player.vx=3; player.vy=2; break;
        case 3: player.x=W; player.y=-player.h; player.vx=-3; player.vy=2; break;
    }
    player.alive = true;
}

function spawnBlock(){
    const bw = 20 + Math.random()*60;
    const bh = 14 + Math.random()*26;
    const bx = Math.random()*(W-bw);
    const by = -bh;
    const spd = 1.5 + Math.random()*2;
    blocks.push({x:bx, y:by, w:bw, h:bh, spd});
}

function createParticle(x,y,color){
    for(let i=0;i<12;i++){
        particles.push({
            x,y,
            vx:(Math.random()-0.5)*4,
            vy:(Math.random()-0.5)*4,
            life:300+Math.random()*200,
            color
        });
    }
}

function hitPlayer(){
    shake = 15;
    player.alive=false;
    createParticle(player.x+player.w/2,player.y+player.h/2,'#f97316');
}

// Кнопка старта
const startBtn = document.getElementById('startBtn');
startBtn.addEventListener('click', ()=>{
    if(state==='idle' || !player.alive){
        randomSpawnPlayer();
        blocks=[];
        particles=[];
        score=0;
        state='running';
        lastTime = performance.now();
        requestAnimationFrame(loop);
    }
});

function loop(ts){
    const dt = ts - lastTime;
    lastTime = ts;
    ctx.clearRect(0,0,W,H);

    // shake
    ctx.save();
    if(shake>0){
        ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake);
        shake *= 0.85;
    }

    // фон пульсирующий
    const t = performance.now()/500;
    const grad = ctx.createLinearGradient(0,0,0,H);
    const c = Math.floor(10+Math.sin(t)*10);
    grad.addColorStop(0,`rgb(${0+c},${16+c},${33+c})`);
    grad.addColorStop(1,`rgb(${0+c},${16+c},${22+c})`);
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,W,H);

    // игрок
    if(player.alive){
        player.x += player.vx;
        player.y += player.vy;
        if(player.vx>0 && player.x >= W/2-player.w/2) player.vx=0;
        if(player.vx<0 && player.x <= W/2-player.w/2) player.vx=0;
        if(player.vy>0 && player.y >= H-60) player.vy=0;
        if(player.vy<0 && player.y <= H-60) player.vy=0;

        ctx.fillStyle='#0ea5a4';
        ctx.fillRect(player.x,player.y,player.w,player.h);
    }

    // блоки
    if(Math.random()<0.02) spawnBlock();
    ctx.fillStyle='#f97316';
    for(let i=blocks.length-1;i>=0;i--){
        const b = blocks[i];
        b.y += b.spd*(dt/16);
        ctx.fillRect(b.x,b.y,b.w,b.h);
        if(player.alive &&
           player.x < b.x+b.w && player.x+player.w > b.x &&
           player.y < b.y+b.h && player.y+player.h > b.y){
               hitPlayer();
           }
        if(b.y>H) blocks.splice(i,1);
    }

    // частицы
    for(let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= dt;
        if(p.life<=0){ particles.splice(i,1); continue; }
        ctx.fillStyle=p.color;
        ctx.globalAlpha = Math.min(1,p.life/400);
        ctx.fillRect(p.x,p.y,3,3);
        ctx.globalAlpha=1;
    }

    ctx.restore();

    if(state==='running') requestAnimationFrame(loop);
}
