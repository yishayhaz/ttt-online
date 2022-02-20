const express = require('express');
const app = express();
const server = require('http').Server(app);
const ws = require('ws');

const wss = new ws.Server({ server });
const game = {}

wss.on('connection', ws => {
    ws.on('close', (ws, data) => {
        delete game[data.toString()];
    })
    ws.on('message', data => {
        data = JSON.parse(data.toString());

        if(data.type == 'settings'){
            ws.id = data.code;
            if(game[data.code]){
                if(game[data.code].players.length == 1){
                    var theOtherSign = game[data.code].players[0][1] == 'x' ? 'c' : 'x';
                    game[data.code].players.push([ws, theOtherSign]);
                    game[data.code].status = 'Continue';
                    game[data.code].players.forEach(player => {
                        player[0].send(JSON.stringify({
                            type: 'move',
                            your_sign: player[1],
                            turn: game[data.code].turn,
                            tsy: game[data.code].tsy,
                            status: game[ws.id].status
                        }));
                    })
                } else {
                    ws.send(JSON.stringify({ type: 'settings', data: 'Game is full' }));
                }
            } else {
                game[data.code] = {
                    tsy: '000000000',
                    status: 'waiting',
                    turn: ['x', 'c'][Math.floor(Math.random() * 2)],
                    players: [[ws, ['x', 'c'][Math.floor(Math.random() * 2)]]],
                }
                ws.send(JSON.stringify({ type: 'settings', data: 'Waiting for player b..' }));
            }
        }

        else if(data.type == 'move'){
            game[ws.id].tsy = updateTsy(game[ws.id].tsy, data.move, game[ws.id].turn);
            game[ws.id].status = checkWin(game[ws.id].tsy, game[ws.id].turn);
            game[ws.id].turn = game[ws.id].turn == 'x' ? 'c' : 'x';
            game[ws.id].players.forEach(player => {
                if(player[1] == game[ws.id].turn){
                    player[0].send(JSON.stringify({
                        type: 'move',
                        your_sign: player[1],
                        turn: game[ws.id].turn,
                        tsy: game[ws.id].tsy,
                        status: game[ws.id].status,
                    }));
                } else {
                    player[0].send(JSON.stringify({
                        type: 'move',
                        your_sign: player[1],
                        turn: game[ws.id].turn,
                        tsy: game[ws.id].tsy,
                        status: game[ws.id].status,
                    }));
                }
            })
        } 
    });
});

function updateTsy(tsy, index, turn){
    if(tsy[index] != 0) return tsy;
    if(index > 8) return tsy;

    return tsy.substring(0, index) + turn + tsy.substring(index + 1);
}

function checkWin(tsy, turn){
    let win = false;
    if(tsy[0] == turn && tsy[1] == turn && tsy[2] == turn) win = true;
    if(tsy[3] == turn && tsy[4] == turn && tsy[5] == turn) win = true;
    if(tsy[6] == turn && tsy[7] == turn && tsy[8] == turn) win = true;
    if(tsy[0] == turn && tsy[3] == turn && tsy[6] == turn) win = true;
    if(tsy[1] == turn && tsy[4] == turn && tsy[7] == turn) win = true;
    if(tsy[2] == turn && tsy[5] == turn && tsy[8] == turn) win = true;
    if(tsy[0] == turn && tsy[4] == turn && tsy[8] == turn) win = true;
    if(tsy[2] == turn && tsy[4] == turn && tsy[6] == turn) win = true;

    if(!tsy.includes(0) && !win) return 'Draw';
    return win ? turn.toUpperCase() + ' Won' : 'Continue';
}

app.get('/', (req, res) => {
    var gameToSend = {};
    for(var key in game){
        gameToSend[key] = {
            tsy: game[key].tsy,
            status: game[key].status,
            turn: game[key].turn,
            players: game[key].players.length
        }
    }
    res.send(gameToSend)
})

server.listen(3000, () => console.log('Server started'));