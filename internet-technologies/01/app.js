let value = 0;

const button1 = document.querySelector('#up');
const button2 = document.querySelector('#down');
const button3 = document.querySelector('#reset');
const output = document.querySelector('#value');
const tx = document.querySelector('#text');

button1.addEventListener('click', () => {
    value += 1;
    output.textContent = value;
    if (value > 0) {
        tx.textContent = "UP";
    } else if (value < 0) {
        tx.textContent = "DOWN";
    } else {
        tx.textContent = "0";
    }
});

button2.addEventListener('click', () => {
    value -= 1;
    output.textContent = value;
    if (value > 0) {
        tx.textContent = "UP";
    } else if (value < 0) {
        tx.textContent = "DOWN";
    } else {
        tx.textContent = "0";
    }
})

button3.addEventListener('click', () => {
    value = 0;
    output.textContent = value;
    if (value > 0) {
        tx.textContent = "UP";
    } else if (value < 0) {
        tx.textContent = "DOWN";
    } else {
        tx.textContent = "0";
    }
})