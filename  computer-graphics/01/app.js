const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

const x1Input = document.querySelector('#x1');
const y1Input = document.querySelector('#y1');
const x2Input = document.querySelector('#x2');
const y2Input = document.querySelector('#y2');

const buildButton = document.querySelector('#build');
const message = document.querySelector('#message');
const tableBody = document.querySelector('#steps');

const columns = 40;
const rows = 30;
const scale = 10;

canvas.width = columns * scale;
canvas.height = rows * scale;

function drawGrid() {
    ctx.fillStyle = '#dddddd';

    for (let x = 0; x <= columns; x += 1) {
        const canvasX = Math.min(x * scale, canvas.width - 1);
        ctx.fillRect(canvasX, 0, 1, canvas.height);
    }

    for (let y = 0; y <= rows; y += 1) {
        const canvasY = Math.min(y * scale, canvas.height - 1);
        ctx.fillRect(0, canvasY, canvas.width, 1);
    }
}

function putPixel(x, y, color = 'black') {
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, scale, scale);
}


function lineDDA(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const records = [];

    if (steps === 0) {
        putPixel(x1, y1);

        records.push({
            step: 0,
            x: x1,
            y: y1,
            pixelX: x1,
            pixelY: y1
        });

        return records;
    }

    const xStep = dx / steps;
    const yStep = dy / steps;

    let x = x1;
    let y = y1;

    for (let i = 0; i <= steps; i += 1) {
        const pixelX = Math.round(x);
        const pixelY = Math.round(y);

        putPixel(pixelX, pixelY);

        records.push({
            step: i,
            x: x,
            y: y,
            pixelX: pixelX,
            pixelY: pixelY
        });

        x += xStep;
        y += yStep;
    }

    return records;
}

function showSteps(records) {
    tableBody.replaceChildren();

    for (const record of records) {
        const row = document.createElement('tr');

        const values = [
            record.step,
            record.x.toFixed(3),
            record.y.toFixed(3),
            record.pixelX,
            record.pixelY
        ];

        for (const value of values) {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        }

        tableBody.appendChild(row);
    }
}

function build() {
    const x1 = x1Input.valueAsNumber;
    const y1 = y1Input.valueAsNumber;
    const x2 = x2Input.valueAsNumber;
    const y2 = y2Input.valueAsNumber;

    const coordinates = [x1, y1, x2, y2];

    if (!coordinates.every(Number.isInteger)) {
        message.textContent = 'Заполните все поля целыми числами.';
        return;
    }

    if (
        x1 < 0 || x1 >= columns ||
        x2 < 0 || x2 >= columns ||
        y1 < 0 || y1 >= rows ||
        y2 < 0 || y2 >= rows
    ) {
        message.textContent = 'Допустимые координаты: x от 0 до 39, y от 0 до 29.';
        return;
    }

    message.textContent = '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    const records = lineDDA(x1, y1, x2, y2);
    showSteps(records);
}

buildButton.addEventListener('click', build);

build();