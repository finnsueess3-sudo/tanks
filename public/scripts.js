const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let players = {};
let bullets = [];
let playerId = null;

const keys = {ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false};

document.addEventListener('keydown', (e) => { if(keys[e.key] !== undefined) keys[e.key] = true; });
document.addEventListener('keyup', (e) => { if(keys[e.key] !== undefined) keys[e.key] = false; });

function changeType(type){
    socket.emit('changeType', type);
}

function shoot(){
    const p = players[playerId];
    if(!p) return;
    socket.emit('shoot', {angle: p.angle});
}

// Update Loop
function gameLoop(){
    if(!playerId) return requestAnimationFrame(gameLoop);

    const p = players[playerId];
    if(!p) return requestAnimationFrame(gameLoop);

    // Bewegung
    let dx=0, dy=0;
    if(keys.ArrowUp) dy -= 1;
    if(keys.ArrowDown) dy += 1;
    if(keys.ArrowLeft) dx -= 1;
    if(keys.ArrowRight) dx += 1;

    let angle = Math.atan2(dy, dx);
    socket.emit('move', {dx, dy, angle});

    draw();
    requestAnimationFrame(gameLoop);
}

socket.on('gameState', (data)=>{
    players = data.players;
    bullets = data.bullets;
    if(!playerId) playerId = Object.keys(players)[0];

    // HUD Update
    const p = players[playerId];
    if(p) document.getElementById('hp').innerText = "HP: "+Math.max(0,p.hp);
});

function draw(){
    const p = players[playerId];
    if(!p) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    const offsetX = p.x - canvas.width/2;
    const offsetY = p.y - canvas.height/2;

    // Map Hintergrund
    ctx.fillStyle="#444";
    ctx.fillRect(-offsetX, -offsetY, 2000, 2000);

    // Spieler
    for(let id in players){
        const pl = players[id];
        let x = pl.x - offsetX;
        let y = pl.y - offsetY;

        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(pl.angle);
        if(pl.type === 'soldier'){
            ctx.fillStyle="green";
            ctx.fillRect(-10,-10,20,20);
        } else if(pl.type === 'tank'){
            ctx.fillStyle="gray";
            ctx.fillRect(-20,-10,40,20);
        } else if(pl.type === 'plane'){
            ctx.fillStyle="red";
            ctx.beginPath();
            ctx.moveTo(-15,-10);
            ctx.lineTo(15,0);
            ctx.lineTo(-15,10);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    // Bullets
    ctx.fillStyle="yellow";
    bullets.forEach(b=>{
        ctx.beginPath();
        ctx.arc(b.x - offsetX, b.y - offsetY, 5, 0, Math.PI*2);
        ctx.fill();
    });
}

gameLoop();
