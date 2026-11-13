// ЛР7: исходные вершины не изменяются при повторном применении параметров.
let polygon = [{x: 2, y: 1}, {x: 6, y: 1}, {x: 7, y: 4}, {x: 3, y: 5}];
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const message = document.querySelector('#message');
const verticesTable = document.querySelector('#vertices');
const matrixTable = document.querySelector('#matrix');
const SCALE = 30;
const ORIGIN_X = 340;
const ORIGIN_Y = 150;

function translation(tx, ty) {
    return [[1, 0, tx], [0, 1, ty], [0, 0, 1]];
}

function scaling(sx, sy) {
    return [[sx, 0, 0], [0, sy, 0], [0, 0, 1]];
}

function rotation(degrees) {
    const angle = degrees * Math.PI / 180;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}

function multiplyMatrices(a, b) {
    const result = Array.from({length: 3}, () => [0, 0, 0]);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) result[i][j] += a[i][k] * b[k][j];
        }
    }
    return result;
}

function transformPoint(matrix, point) {
    return {
        x: matrix[0][0] * point.x + matrix[0][1] * point.y + matrix[0][2],
        y: matrix[1][0] * point.x + matrix[1][1] * point.y + matrix[1][2]
    };
}

function aroundCenter(matrix, cx, cy) {
    return multiplyMatrices(translation(cx, cy),
        multiplyMatrices(matrix, translation(-cx, -cy)));
}

function makeMatrix(tx, ty, sx, sy, degrees, cx, cy, order) {
    const scale = aroundCenter(scaling(sx, sy), cx, cy);
    const rotate = aroundCenter(rotation(degrees), cx, cy);
    const move = translation(tx, ty);
    // Векторы-столбцы: справа стоит операция, выполняемая первой.
    if (order === 'A') return multiplyMatrices(move, multiplyMatrices(rotate, scale));
    return multiplyMatrices(rotate, multiplyMatrices(move, scale));
}

function screenPoint(point) {
    return {x: ORIGIN_X + point.x * SCALE, y: ORIGIN_Y + point.y * SCALE};
}

function drawPolygon(points, color) {
    ctx.beginPath();
    const first = screenPoint(points[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i++) {
        const p = screenPoint(points[i]);
        ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    for (const point of points) {
        const p = screenPoint(point);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

function draw(transformed, center) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    for (let x = ORIGIN_X % SCALE; x < canvas.width; x += SCALE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = ORIGIN_Y % SCALE; y < canvas.height; y += SCALE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.strokeStyle = '#888';
    ctx.beginPath(); ctx.moveTo(ORIGIN_X, 0); ctx.lineTo(ORIGIN_X, canvas.height);
    ctx.moveTo(0, ORIGIN_Y); ctx.lineTo(canvas.width, ORIGIN_Y); ctx.stroke();
    drawPolygon(polygon, '#777');
    drawPolygon(transformed, '#245fd2');
    const c = screenPoint(center);
    ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#c24545'; ctx.fill();
}

function displayNumber(value) {
    return Number(value.toFixed(3)).toString();
}

function showResults(matrix, transformed) {
    matrixTable.replaceChildren();
    for (const row of matrix) {
        const tr = document.createElement('tr');
        for (const value of row) {
            const td = document.createElement('td');
            td.textContent = displayNumber(value);
            tr.append(td);
        }
        matrixTable.append(tr);
    }
    verticesTable.replaceChildren();
    for (let i = 0; i < polygon.length; i++) {
        const tr = document.createElement('tr');
        const values = ['P' + i, polygon[i].x, polygon[i].y,
            displayNumber(transformed[i].x), displayNumber(transformed[i].y)];
        for (const value of values) {
            const td = document.createElement('td');
            td.textContent = value;
            tr.append(td);
        }
        verticesTable.append(tr);
    }
}

function apply() {
    const ids = ['tx', 'ty', 'sx', 'sy', 'angle', 'cx', 'cy'];
    const values = ids.map(id => document.querySelector('#' + id).valueAsNumber);
    if (!values.every(Number.isFinite)) {
        message.textContent = 'Введите числовые параметры.';
        return;
    }
    message.textContent = '';
    const [tx, ty, sx, sy, angle, cx, cy] = values;
    const matrix = makeMatrix(tx, ty, sx, sy, angle, cx, cy,
        document.querySelector('#order').value);
    const transformed = polygon.map(point => transformPoint(matrix, point));
    draw(transformed, {x: cx, y: cy});
    showResults(matrix, transformed);
}

function reset() {
    const defaults = {tx: 0, ty: 0, sx: 1, sy: 1, angle: 0, cx: 0, cy: 0};
    for (const [id, value] of Object.entries(defaults)) document.querySelector('#' + id).value = value;
    document.querySelector('#order').value = 'A';
    apply();
}

function setPoints() {
    const rows = document.querySelector('#points').value.trim().split('\n');
    const parts = rows.map(row => row.split(','));
    if (parts.length < 4 || parts.some(pair => pair.length !== 2 || pair.some(value => !value.trim()))) {
        message.textContent = 'Введите не менее четырёх вершин в формате x,y.';
        return;
    }
    const next = parts.map(pair => pair.map(Number));
    if (next.some(pair => !pair.every(Number.isFinite))) {
        message.textContent = 'Введите не менее четырёх вершин в формате x,y.';
        return;
    }
    polygon = next.map(([x, y]) => ({x, y}));
    apply();
}

document.querySelector('#apply').addEventListener('click', apply);
document.querySelector('#reset').addEventListener('click', reset);
document.querySelector('#set-points').addEventListener('click', setPoints);
apply();
