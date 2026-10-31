const W = 40;
const H = 30;
const CELL = 10;
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const shape = document.querySelector('#shape');
const stepInput = document.querySelector('#step');
const rowInput = document.querySelector('#row');
const message = document.querySelector('#message');
const results = document.querySelector('#results');

const shapes = {
    rectangle: [{x: 6, y: 5}, {x: 32, y: 5}, {x: 32, y: 24}, {x: 6, y: 24}],
    triangle: [{x: 20, y: 4}, {x: 35, y: 25}, {x: 5, y: 25}],
    convex: [{x: 16, y: 3}, {x: 32, y: 8}, {x: 35, y: 22}, {x: 18, y: 26}, {x: 5, y: 16}],
    concave: [{x: 5, y: 5}, {x: 32, y: 5}, {x: 32, y: 24}, {x: 21, y: 24},
        {x: 21, y: 13}, {x: 13, y: 13}, {x: 13, y: 24}, {x: 5, y: 24}],
    open: [{x: 6, y: 5}, {x: 32, y: 5}, {x: 32, y: 24}, {x: 6, y: 24}]
};
let points = shapes.concave;
let grid = [];
let floodOrder = [];
let scanCells = [];
let method = '';

function blankGrid() {
    const result = [];
    for (let y = 0; y < H; y++) {
        result.push(Array(W).fill(0));
    }
    return result;
}

function copyGrid(source) {
    const result = [];
    for (const row of source) result.push(row.slice());
    return result;
}

function linePixels(a, b, target) {
    let x = a.x;
    let y = a.y;
    const dx = Math.abs(b.x - x);
    const dy = Math.abs(b.y - y);
    const sx = x < b.x ? 1 : -1;
    const sy = y < b.y ? 1 : -1;
    let error = dx - dy;
    while (true) {
        target[y][x] = 1;
        if (x === b.x && y === b.y) break;
        const e2 = 2 * error;
        if (e2 > -dy) {
            error -= dy;
            x += sx;
        }
        if (e2 < dx) {
            error += dx;
            y += sy;
        }
    }
}

function makeGrid(polygon, open) {
    const result = blankGrid();
    for (let i = 0; i < polygon.length - 1; i++) {
        linePixels(polygon[i], polygon[i + 1], result);
    }
    if (!open) linePixels(polygon[polygon.length - 1], polygon[0], result);
    return result;
}

function floodFill(startX, startY, target) {
    if (startX < 0 || startX >= W || startY < 0 || startY >= H || target[startY][startX] !== 0) return [];
    const stack = [[startX, startY]];
    const order = [];
    target[startY][startX] = 2;
    while (stack.length > 0) {
        const pixel = stack.pop();
        const x = pixel[0];
        const y = pixel[1];
        order.push([x, y]);
        const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
        for (const next of neighbors) {
            const nx = next[0];
            const ny = next[1];
            if (nx >= 0 && nx < W && ny >= 0 && ny < H && target[ny][nx] === 0) {
                target[ny][nx] = 2;
                stack.push([nx, ny]);
            }
        }
    }
    return order;
}

function rowData(polygon, y) {
    const intersections = [];
    for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];
        if (a.y === b.y) continue;
        if (y >= Math.min(a.y, b.y) && y < Math.max(a.y, b.y)) {
            const x = a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y);
            intersections.push(x);
        }
    }
    intersections.sort((a, b) => a - b);
    const intervals = [];
    for (let i = 0; i + 1 < intersections.length; i += 2) {
        intervals.push([Math.ceil(intersections[i]), Math.floor(intersections[i + 1])]);
    }
    return {intersections, intervals};
}

function scanlineFill(polygon, target) {
    const filled = [];
    let checks = 0;
    for (let y = 0; y < H; y++) {
        checks += polygon.length;
        const row = rowData(polygon, y);
        for (const interval of row.intervals) {
            for (let x = Math.max(0, interval[0]); x <= Math.min(W - 1, interval[1]); x++) {
                if (target[y][x] === 0) {
                    target[y][x] = 2;
                    filled.push([x, y]);
                }
            }
        }
    }
    return {filled, checks};
}

function draw() {
    const shown = copyGrid(grid);
    const count = method === 'flood' ? Number(stepInput.value) : scanCells.length;
    const cells = method === 'flood' ? floodOrder : scanCells;
    for (let i = 0; i < count; i++) {
        shown[cells[i][1]][cells[i][0]] = 2;
    }
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            ctx.fillStyle = shown[y][x] === 1 ? 'black' : shown[y][x] === 2 ? '#999' : 'white';
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
        }
    }
    document.querySelector('#step-text').textContent = stepInput.value + ' / ' + floodOrder.length;
}

function showRow() {
    const y = rowInput.valueAsNumber;
    if (!Number.isInteger(y) || y < 0 || y >= H) {
        document.querySelector('#row-y').textContent = 'y от 0 до 29';
        document.querySelector('#row-xs').textContent = '';
        document.querySelector('#row-intervals').textContent = '';
        return;
    }
    const data = rowData(points, y);
    document.querySelector('#row-y').textContent = y;
    document.querySelector('#row-xs').textContent = data.intersections.map(x => x.toFixed(2)).join(', ');
    document.querySelector('#row-intervals').textContent = data.intervals.map(a => a[0] + '..' + a[1]).join(', ');
}

function reset() {
    points = shapes[shape.value];
    grid = makeGrid(points, shape.value === 'open');
    floodOrder = [];
    scanCells = [];
    method = '';
    stepInput.value = 0;
    stepInput.max = 0;
    document.querySelector('#scanline').disabled = shape.value === 'open';
    results.replaceChildren();
    message.textContent = '';
    showRow();
    draw();
}

canvas.addEventListener('click', event => {
    const box = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - box.left) / box.width * W);
    const y = Math.floor((event.clientY - box.top) / box.height * H);
    const copy = copyGrid(grid);
    floodOrder = floodFill(x, y, copy);
    method = 'flood';
    stepInput.max = floodOrder.length;
    stepInput.value = floodOrder.length;
    message.textContent = 'Flood Fill: ' + floodOrder.length + ' пикселей';
    draw();
});

document.querySelector('#scanline').addEventListener('click', () => {
    const copy = copyGrid(grid);
    scanCells = scanlineFill(points, copy).filled;
    method = 'scanline';
    message.textContent = 'Scanline Fill: ' + scanCells.length + ' пикселей';
    draw();
});

document.querySelector('#compare').addEventListener('click', () => {
    if (shape.value === 'open') return;
    const starts = {rectangle: [10, 10], triangle: [20, 15], convex: [20, 15], concave: [10, 10]};
    const seed = starts[shape.value];
    results.replaceChildren();
    for (const name of ['Flood Fill', 'Scanline Fill']) {
        const times = [];
        let count = 0;
        let steps = 0;
        for (let series = 0; series < 5; series++) {
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                const copy = copyGrid(grid);
                if (name === 'Flood Fill') {
                    const result = floodFill(seed[0], seed[1], copy);
                    count = result.length;
                    steps = result.length;
                } else {
                    const result = scanlineFill(points, copy);
                    count = result.filled.length;
                    steps = result.checks;
                }
            }
            times.push((performance.now() - start).toFixed(1));
        }
        const tr = document.createElement('tr');
        for (const value of [name, count, steps, times.join(', ')]) {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        }
        results.appendChild(tr);
    }
});

shape.addEventListener('change', reset);
document.querySelector('#clear').addEventListener('click', reset);
stepInput.addEventListener('input', draw);
rowInput.addEventListener('input', showRow);
reset();
