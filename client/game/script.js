const canvas = document.getElementById('canv')

const jsConfetti = new JSConfetti({ canvas })


const ws = new WebSocket('ws://localhost:3000');
const code = new URL(window.location.href).searchParams.get('code');
const timer = document.querySelector('.timer');
ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: "settings", code }));
});

ws.addEventListener('message', (data) => {
    data = JSON.parse(data.data);

    if(data.type == 'settings'){
        if(data.data == 'Game is full'){
            ws.close();
            h2.innerHTML = 'Game is full';
        }
        if(data.data.startsWith('Waiting')){
            h2.innerHTML = 'Waiting...';
        }
    }
    if(data.type == 'move'){
        my_sign = data.your_sign;
        turn = data.turn;
        h2.innerHTML = turn == my_sign ? `Your Move` : `${turn.toUpperCase()}'s Move`;
        updateTsy(data.tsy);
        if(data.status != 'Continue' && !data.status.startsWith('Waiting')){
            ws.close(1000, code);
            playing = false;
            if(my_sign.toUpperCase() == data.status[0]){
                h2.innerHTML = 'You Won!';
                jsConfetti.addConfetti({
                    confettiRadius: 4,
                    confettiNumber: 500,
                    confettiColors: ['#81c8ce', '#CE81C2', '#8192CE', '#CCCE81']
                  })
            } else {
                h2.innerHTML = data.status;
            }
            document.querySelector('a').style.display = 'block';
        }
        if(playing && turn == my_sign){
           timer.classList.add('time');
        } else {
            timer.classList.remove('time');
        }
    }
});

function sendWS(data){
    ws.send(JSON.stringify(data));
}
function updateTsy(newTsy){
    tsy = newTsy;
    drawBoard(tsy);
}

const boxes = Array.from(document.querySelectorAll('.box'));

let playing = true;
let my_sign = '';
let turn = 'x';
let tsy = '000000000';
const h2 = document.querySelector('h2');

boxes.forEach(box => {
    box.addEventListener('click', () => {
        if(playing && turn == my_sign){
            box.classList.replace('hover', 'taken');
            sendWS({ type: 'move', move: boxes.indexOf(box) });
        }
    });

    box.addEventListener('mouseenter', () => {
        if(playing && turn == my_sign){
            if(!box.classList.contains('taken')){
                box.classList.add('hover');
                box.innerHTML = `<div class='${turn} opacity'></div>`;
            }
        }
    })
    box.addEventListener('mouseleave', () => {
        if(playing && turn == my_sign){
            if(box.classList.contains('hover')){
                box.innerHTML = ``;
            }
        }
        box.classList.remove('hover');
    })
});

function drawBoard(tsy){
    boxes.forEach((box, index) => {
        if(tsy[index] != 0){
            box.classList.add('taken')
            box.innerHTML = `<div class=${tsy[index]}></div>`;
        }
    })
}
