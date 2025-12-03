const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

let players={}, bullets=[], playerId=null;
let move={dx:0,dy:0}, aim={angle:0};
let leftTouch=null,rightTouch=null;

// Map & Sprites
const mapImg = new Image(); mapImg.src='assets/map.png';
const sprites = {
    soldier: new Image(), tank: new Image(), plane: new Image()
};
sprites.soldier.src='assets/soldier.png';
sprites.tank.src='assets/tank.png';
sprites.plane.src='assets/plane.png';
const SPRITE_SIZE={w:64,h:64};

// Joystick Touch
const leftJoy=document.getElementById('leftJoystick');
const rightJoy=document.getElementById('rightJoystick');

leftJoy.addEventListener('touchstart', e=>{leftTouch=e.touches[0];});
leftJoy.addEventListener('touchmove', e=>{
  if(!leftTouch)return;
  const t=e.touches[0];
  move.dx=Math.max(-1,Math.min(1,(t.clientX-leftTouch.clientX)/50));
  move.dy=Math.max(-1,Math.min(1,(t.clientY-leftTouch.clientY)/50));
});
leftJoy.addEventListener('touchend', e=>{move.dx=0;move.dy=0;leftTouch=null;});

rightJoy.addEventListener('touchstart', e=>{rightTouch=e.touches[0];});
rightJoy.addEventListener('touchmove', e=>{
  if(!rightTouch || !playerId) return;
  const t=e.touches[0];
  aim.angle=Math.atan2(t.clientY-canvas.height/2,t.clientX-canvas.width/2);
});
rightJoy.addEventListener('touchend', e=>{rightTouch=null;});

function shoot(){ if(playerId) socket.emit('shoot',{angle:aim.angle}); }

// Server State
socket.on('gameState', data=>{
  players=data.players;
  bullets=data.bullets;
  if(!playerId) playerId=Object.keys(players)[0];
  const p=players[playerId];
  if(p) document.getElementById('hud').innerText="HP:"+Math.max(0,p.hp);
});

// Game Loop
function loop(){
  if(playerId) socket.emit('move',{dx:move.dx,dy:move.dy,angle:aim.angle});
  draw();
  requestAnimationFrame(loop);
}
loop();

// Draw
function draw(){
  const p=players[playerId];
  if(!p) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const offsetX=p.x-canvas.width/2;
  const offsetY=p.y-canvas.height/2;

  // Map
  ctx.drawImage(mapImg,-offsetX,-offsetY);

  // Spieler
  for(let id in players){
    const pl=players[id];
    const x=pl.x-offsetX,y=pl.y-offsetY;
    ctx.save(); ctx.translate(x,y); ctx.rotate(pl.angle);
    const img=sprites[pl.type];
    ctx.drawImage(img,-SPRITE_SIZE.w/2,-SPRITE_SIZE.h/2,SPRITE_SIZE.w,SPRITE_SIZE.h);
    ctx.restore();
  }

  // Bullets
  ctx.fillStyle="yellow";
  bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x-offsetX,b.y-offsetY,5,0,Math.PI*2);
    ctx.fill();
  });
}
