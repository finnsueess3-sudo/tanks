const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;

const players = {};
const bullets = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Neuer Spieler
    players[socket.id] = {
        x: MAP_WIDTH / 2,
        y: MAP_HEIGHT / 2,
        type: 'soldier',
        angle: 0,
        hp: 100
    };

    // Spielerbewegung
    socket.on('move', (data) => {
        const p = players[socket.id];
        if(!p) return;

        let speed = 3;
        if(p.type === 'tank') speed = 1.5;
        if(p.type === 'plane') speed = 5;

        p.x += data.dx * speed;
        p.y += data.dy * speed;
        p.angle = data.angle;

        // Mapgrenzen
        p.x = Math.max(0, Math.min(MAP_WIDTH, p.x));
        p.y = Math.max(0, Math.min(MAP_HEIGHT, p.y));
    });

    // Spieler Typ wechseln
    socket.on('changeType', (type) => {
        if(players[socket.id]){
            players[socket.id].type = type;
        }
    });

    // Schüsse
    socket.on('shoot', (data) => {
        const p = players[socket.id];
        if(!p) return;

        bullets.push({
            x: p.x,
            y: p.y,
            dx: Math.cos(data.angle) * 10,
            dy: Math.sin(data.angle) * 10,
            owner: socket.id
        });
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

// Update Loop
setInterval(() => {
    // Bullets bewegen & Kollisionscheck
    bullets.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy;

        // Kollisionscheck
        for(let id in players){
            const p = players[id];
            if(id !== b.owner){
                const dist = Math.hypot(p.x - b.x, p.y - b.y);
                if(dist < 20){
                    p.hp -= 10;
                    bullets.splice(i,1);
                    break;
                }
            }
        }

        // Entfernen wenn außerhalb Map
        if(b.x < 0 || b.x > MAP_WIDTH || b.y < 0 || b.y > MAP_HEIGHT){
            bullets.splice(i,1);
        }
    });

    io.emit('gameState', {players, bullets});
}, 1000/60);

http.listen(3000, () => console.log('Server läuft auf Port 3000'));
