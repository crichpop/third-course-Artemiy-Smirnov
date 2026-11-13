const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const exampleInput = document.querySelector('#example');
const stageInput = document.querySelector('#stage');
const message = document.querySelector('#message');
const steps = document.querySelector('#steps');
const SCALE = 10;

// ЛР6: готовые примеры включают все обязательные случаи, в том числе невыпуклый контур.
const examples = {
    concave: [{x: 4, y: 3}, {x: 36, y: 3}, {x: 36, y: 27}, {x: 25, y: 27},
        {x: 25, y: 13}, {x: 16, y: 13}, {x: 16, y: 27}, {x: 4, y: 27}],
    inside: [{x: 12, y: 9}, {x: 25, y: 9}, {x: 25, y: 20}, {x: 12, y: 20}],
    outside: [{x: 1, y: 9}, {x: 5, y: 9}, {x: 5, y: 20}, {x: 1, y: 20}],
    one: [{x: 4, y: 10}, {x: 20, y: 10}, {x: 20, y: 19}, {x: 4, y: 19}],
    two: [{x: 4, y: 10}, {x: 36, y: 10}, {x: 36, y: 19}, {x: 4, y: 19}],
    four: [{x: 4, y: 3}, {x: 36, y: 3}, {x: 36, y: 27}, {x: 4, y: 27}],
    vertex: [{x: 10, y: 10}, {x: 22, y: 9}, {x: 22, y: 19}],
    edge: [{x: 10, y: 10}, {x: 23, y: 10}, {x: 23, y: 20}, {x: 10, y: 20}]
};

function intersectVertical(a, b, xBoundary) {
    const t = (xBoundary - a.x) / (b.x - a.x);
    return {x: xBoundary, y: a.y + t * (b.y - a.y)};
}

function intersectHorizontal(a, b, yBoundary) {
    const t = (yBoundary - a.y) / (b.y - a.y);
    return {x: a.x + t * (b.x - a.x), y: yBoundary};
}

// Для каждого замкнутого ребра применяются четыре перехода inside/outside.
function clipAgainstBoundary(polygon, isInside, getIntersection) {
    const output = [];
    if (polygon.length === 0) return output;
    let s = polygon[polygon.length - 1];
    for (const p of polygon) {
        const sInside = isInside(s);
        const pInside = isInside(p);
        if (sInside && pInside) {
            output.push(p);
        } else if (sInside && !pInside) {
            output.push(getIntersection(s, p));
        } else if (!sInside && pInside) {
            output.push(getIntersection(s, p));
            output.push(p);
        }
        s = p;
    }
    return output;
}

function clipPolygon(polygon, rect) {
    const stages = [polygon];
    stages.push(clipAgainstBoundary(stages[0], p => p.x >= rect.xmin,
        (a, b) => intersectVertical(a, b, rect.xmin)));
    stages.push(clipAgainstBoundary(stages[1], p => p.x <= rect.xmax,
        (a, b) => intersectVertical(a, b, rect.xmax)));
    stages.push(clipAgainstBoundary(stages[2], p => p.y >= rect.ymin,
        (a, b) => intersectHorizontal(a, b, rect.ymin)));
    stages.push(clipAgainstBoundary(stages[3], p => p.y <= rect.ymax,
        (a, b) => intersectHorizontal(a, b, rect.ymax)));
    return stages;
}

function drawPolygon(points, color, width) {
    if (points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x * SCALE, points[0].y * SCALE);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x * SCALE, points[i].y * SCALE);
    if (points.length > 2) ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x * SCALE, p.y * SCALE, 3, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

let currentStages = [];
let currentRect;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += SCALE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += SCALE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    drawPolygon(currentStages[0], '#999', 2);
    ctx.strokeStyle = '#c24545';
    ctx.lineWidth = 2;
    ctx.strokeRect(currentRect.xmin * SCALE, currentRect.ymin * SCALE,
        (currentRect.xmax - currentRect.xmin) * SCALE,
        (currentRect.ymax - currentRect.ymin) * SCALE);
    drawPolygon(currentStages[Number(stageInput.value)], '#245fd2', 3);
}

function showStages() {
    steps.replaceChildren();
    const names = ['Исходный', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'];
    currentStages.forEach((polygon, i) => {
        const tr = document.createElement('tr');
        const values = [names[i], polygon.length,
            polygon.length ? polygon.map(p => `(${Number(p.x.toFixed(2))}; ${Number(p.y.toFixed(2))})`).join(', ') : '∅'];
        for (const value of values) {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        }
        steps.appendChild(tr);
    });
}

function build() {
    const rect = {
        xmin: document.querySelector('#xmin').valueAsNumber,
        xmax: document.querySelector('#xmax').valueAsNumber,
        ymin: document.querySelector('#ymin').valueAsNumber,
        ymax: document.querySelector('#ymax').valueAsNumber
    };
    if (!Object.values(rect).every(Number.isFinite) || rect.xmin >= rect.xmax || rect.ymin >= rect.ymax) {
        message.textContent = 'Нужно указать числа с xmin < xmax и ymin < ymax.';
        return;
    }
    message.textContent = '';
    currentRect = rect;
    currentStages = clipPolygon(examples[exampleInput.value], rect);
    showStages();
    draw();
}

document.querySelector('#build').addEventListener('click', build);
exampleInput.addEventListener('change', build);
stageInput.addEventListener('change', draw);
build();
