const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const message = document.querySelector('#message');
const codes = document.querySelector('#codes');
const stats = document.querySelector('#stats');
const stepsBody = document.querySelector('#steps');
const mode = document.querySelector('#mode');
const size = 10;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;

const points = [
    {x: 2, y: 5}, {x: 12, y: 2}, {x: 20, y: 18},
    {x: 30, y: 8}, {x: 36, y: 22}
];

function getCode(x, y, rect) {
    let code = 0;
    if (x < rect.xmin) code |= LEFT;
    if (x > rect.xmax) code |= RIGHT;
    if (y < rect.ymin) code |= TOP;
    if (y > rect.ymax) code |= BOTTOM;
    return code;
}

function codeText(code) {
    return code.toString(2).padStart(4, '0');
}

function pointText(x, y) {
    return '(' + x.toFixed(2) + ', ' + y.toFixed(2) + ')';
}

function clipLine(x1, y1, x2, y2, rect) {
    let code1 = getCode(x1, y1, rect);
    let code2 = getCode(x2, y2, rect);
    const steps = [];

    while (true) {
        let action = '';
        if ((code1 | code2) === 0) {
            action = 'ACCEPT';
            steps.push([pointText(x1, y1), codeText(code1), pointText(x2, y2), codeText(code2), action]);
            return {line: {x1, y1, x2, y2}, steps};
        }
        if ((code1 & code2) !== 0) {
            action = 'REJECT';
            steps.push([pointText(x1, y1), codeText(code1), pointText(x2, y2), codeText(code2), action]);
            return {line: null, steps};
        }

        const codeOut = code1 !== 0 ? code1 : code2;
        let x, y;
        if (codeOut & TOP) {
            y = rect.ymin;
            x = x1 + (y - y1) * (x2 - x1) / (y2 - y1);
            action = 'пересечение TOP';
        } else if (codeOut & BOTTOM) {
            y = rect.ymax;
            x = x1 + (y - y1) * (x2 - x1) / (y2 - y1);
            action = 'пересечение BOTTOM';
        } else if (codeOut & RIGHT) {
            x = rect.xmax;
            y = y1 + (x - x1) * (y2 - y1) / (x2 - x1);
            action = 'пересечение RIGHT';
        } else {
            x = rect.xmin;
            y = y1 + (x - x1) * (y2 - y1) / (x2 - x1);
            action = 'пересечение LEFT';
        }
        steps.push([pointText(x1, y1), codeText(code1), pointText(x2, y2), codeText(code2), action]);
        if (codeOut === code1) {
            x1 = x;
            y1 = y;
            code1 = getCode(x1, y1, rect);
        } else {
            x2 = x;
            y2 = y;
            code2 = getCode(x2, y2, rect);
        }
    }
}

function readRect() {
    return {
        xmin: document.querySelector('#xmin').valueAsNumber,
        ymin: document.querySelector('#ymin').valueAsNumber,
        xmax: document.querySelector('#xmax').valueAsNumber,
        ymax: document.querySelector('#ymax').valueAsNumber
    };
}

function validRect(rect) {
    return [rect.xmin, rect.ymin, rect.xmax, rect.ymax].every(Number.isInteger) &&
        rect.xmin >= 0 && rect.ymin >= 0 && rect.xmax < 40 && rect.ymax < 30 &&
        rect.xmin < rect.xmax && rect.ymin < rect.ymax;
}

function drawGrid(rect) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 40; x++) {
        ctx.beginPath();
        ctx.moveTo(x * size, 0);
        ctx.lineTo(x * size, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= 30; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * size);
        ctx.lineTo(canvas.width, y * size);
        ctx.stroke();
    }
    ctx.strokeStyle = 'black';
    ctx.strokeRect(rect.xmin * size, rect.ymin * size,
        (rect.xmax - rect.xmin) * size, (rect.ymax - rect.ymin) * size);
}

function drawLine(line, color, lineWidth) {
    if (line === null) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(line.x1 * size, line.y1 * size);
    ctx.lineTo(line.x2 * size, line.y2 * size);
    ctx.stroke();
}

function showSteps(steps) {
    stepsBody.replaceChildren();
    for (let i = 0; i < steps.length; i++) {
        const tr = document.createElement('tr');
        const values = [i, ...steps[i]];
        for (const value of values) {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        }
        stepsBody.appendChild(tr);
    }
}

function build() {
    const rect = readRect();
    if (!validRect(rect)) {
        message.textContent = 'Неверные границы окна';
        return;
    }
    const lines = [];
    if (mode.value === 'polyline') {
        for (let i = 0; i < points.length - 1; i++) {
            lines.push({x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y});
        }
    } else {
        const x1 = document.querySelector('#x1').valueAsNumber;
        const y1 = document.querySelector('#y1').valueAsNumber;
        const x2 = document.querySelector('#x2').valueAsNumber;
        const y2 = document.querySelector('#y2').valueAsNumber;
        if (![x1, y1, x2, y2].every(Number.isInteger) ||
            x1 < 0 || x1 > 39 || x2 < 0 || x2 > 39 ||
            y1 < 0 || y1 > 29 || y2 < 0 || y2 > 29) {
            message.textContent = 'Введите целые координаты в пределах сетки';
            return;
        }
        lines.push({x1, y1, x2, y2});
    }

    message.textContent = '';
    stats.textContent = '';
    drawGrid(rect);
    const allSteps = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        drawLine(line, '#aaa', 1);
        const result = clipLine(line.x1, line.y1, line.x2, line.y2, rect);
        drawLine(result.line, 'blue', 3);
        for (const step of result.steps) {
            const copy = step.slice();
            if (lines.length > 1) copy[4] = 'P' + i + ' - P' + (i + 1) + ': ' + copy[4];
            allSteps.push(copy);
        }
    }
    const first = lines[0];
    codes.textContent = 'A: ' + codeText(getCode(first.x1, first.y1, rect)) +
        ' B: ' + codeText(getCode(first.x2, first.y2, rect));
    showSteps(allSteps);
}

function experiment() {
    const rect = readRect();
    if (!validRect(rect)) {
        message.textContent = 'Неверные границы окна';
        return;
    }
    let seed = 12345;
    function random(limit) {
        seed = (seed * 16807) % 2147483647;
        return Math.floor(seed / 2147483647 * limit);
    }
    let inside = 0, clipped = 0, rejected = 0;
    drawGrid(rect);
    for (let i = 0; i < 100; i++) {
        const line = {x1: random(40), y1: random(30), x2: random(40), y2: random(30)};
        const result = clipLine(line.x1, line.y1, line.x2, line.y2, rect);
        if (result.line === null) rejected++;
        else if (result.steps.length === 1) inside++;
        else clipped++;
        drawLine(line, '#aaa', 1);
        drawLine(result.line, 'blue', 2);
    }
    message.textContent = '';
    codes.textContent = '';
    stats.textContent = 'Без изменений: ' + inside + ', отсечено: ' + clipped + ', отброшено: ' + rejected;
    showSteps([]);
}

document.querySelector('#build').addEventListener('click', build);
document.querySelector('#experiment').addEventListener('click', experiment);
mode.addEventListener('change', build);
build();
