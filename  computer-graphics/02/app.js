const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const x1Input = document.querySelector('#x1');
const y1Input = document.querySelector('#y1');
const x2Input = document.querySelector('#x2');
const y2Input = document.querySelector('#y2');
const algorithm = document.querySelector('#algorithm');
const big = document.querySelector('#big');
const message = document.querySelector('#message');
const pixels = document.querySelector('#pixels');
const tableBody = document.querySelector('#steps');
let scale = 10;

function putPixel(x, y) {
    ctx.fillRect(x * scale, y * scale, scale, scale);
}

function lineDDA(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const points = [];
    if (steps === 0) {
        points.push([x1, y1]);
        return points;
    }
    const xStep = dx / steps;
    const yStep = dy / steps;
    let x = x1;
    let y = y1;
    for (let i = 0; i <= steps; i++) {
        points.push([Math.round(x), Math.round(y)]);
        x += xStep;
        y += yStep;
    }
    return points;
}

function lineBresenham(x1, y1, x2, y2) {
    let x = x1;
    let y = y1;
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let error = dx - dy;
    const points = [];
    const records = [];
    let step = 0;
    while (true) {
        points.push([x, y]);
        const error2 = 2 * error;
        const record = [step, x, y, error, error2, 'нет', 'нет'];
        records.push(record);
        if (x === x2 && y === y2) {
            break;
        }
        if (error2 > -dy) {
            error -= dy;
            x += sx;
            record[5] = 'да';
        }
        if (error2 < dx) {
            error += dx;
            y += sy;
            record[6] = 'да';
        }
        step++;
    }
    return {points: points, records: records};
}

function showPoints(points) {
    let text = '';
    for (let i = 0; i < points.length; i++) {
        text += '(' + points[i][0] + ', ' + points[i][1] + ')\n';
    }
    return text;
}

function build() {
    const x1 = x1Input.valueAsNumber;
    const y1 = y1Input.valueAsNumber;
    const x2 = x2Input.valueAsNumber;
    const y2 = y2Input.valueAsNumber;
    if (![x1, y1, x2, y2].every(Number.isInteger)) {
        message.textContent = 'Введите целые числа';
        return;
    }
    if (x1 < 0 || x1 > 39 || x2 < 0 || x2 > 39 || y1 < 0 || y1 > 29 || y2 < 0 || y2 > 29) {
        message.textContent = 'x от 0 до 39, y от 0 до 29';
        return;
    }
    message.textContent = '';
    scale = big.checked ? 10 : 1;
    canvas.width = 40 * scale;
    canvas.height = 30 * scale;
    ctx.fillStyle = 'black';
    const result = lineBresenham(x1, y1, x2, y2);
    let points = result.points;
    if (algorithm.value === 'dda') {
        points = lineDDA(x1, y1, x2, y2);
    }
    for (let i = 0; i < points.length; i++) {
        putPixel(points[i][0], points[i][1]);
    }
    if (big.checked) {
        ctx.fillStyle = '#dddddd';
        for (let x = 0; x <= 40; x++) {
            ctx.fillRect(Math.min(x * scale, canvas.width - 1), 0, 1, canvas.height);
        }
        for (let y = 0; y <= 30; y++) {
            ctx.fillRect(0, Math.min(y * scale, canvas.height - 1), canvas.width, 1);
        }
    }
    pixels.textContent = showPoints(points);
    tableBody.replaceChildren();
    for (const record of result.records) {
        const row = document.createElement('tr');
        for (const value of record) {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        }
        tableBody.appendChild(row);
    }
}

function difference(first, second) {
    const result = [];
    for (const point of first) {
        let found = false;
        for (const other of second) {
            if (point[0] === other[0] && point[1] === other[1]) {
                found = true;
                break;
            }
        }
        if (!found) result.push(point);
    }
    return result;
}

function compare() {
    const examples = [
        ['Горизонтальный', 2, 5, 20, 5],
        ['Вертикальный', 7, 2, 7, 20],
        ['Пологий', 2, 2, 8, 5],
        ['Крутой', 3, 2, 7, 25],
        ['Обратный', 20, 8, 2, 3],
        ['Снизу вверх', 5, 20, 15, 2],
        ['Точка', 10, 10, 10, 10]
    ];
    let text = '';
    for (const example of examples) {
        const dda = lineDDA(example[1], example[2], example[3], example[4]);
        const bres = lineBresenham(example[1], example[2], example[3], example[4]).points;
        const onlyDda = difference(dda, bres);
        const onlyBres = difference(bres, dda);
        text += example[0] + ': (' + example[1] + ', ' + example[2] + ') -> (' + example[3] + ', ' + example[4] + ')\n';
        if (onlyDda.length === 0 && onlyBres.length === 0) {
            text += 'Пиксели совпали\n\n';
        } else {
            text += 'Только ЦДА:\n' + showPoints(onlyDda);
            text += 'Только Брезенхем:\n' + showPoints(onlyBres) + '\n';
        }
    }
    document.querySelector('#compare').textContent = text;
}

function test() {
    const lines = [];
    for (let i = 0; i < 10000; i++) {
        lines.push([Math.floor(Math.random() * 40), Math.floor(Math.random() * 30),
            Math.floor(Math.random() * 40), Math.floor(Math.random() * 30)]);
    }
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 40;
    testCanvas.height = 30;
    const testCtx = testCanvas.getContext('2d');
    let text = '';
    let ddaSum = 0;
    let bresSum = 0;
    for (let run = 0; run < 5; run++) {
        const times = [];
        for (let alg = 0; alg < 2; alg++) {
            testCtx.clearRect(0, 0, 40, 30);
            const start = performance.now();
            for (const line of lines) {
                let points;
                if (alg === 0) {
                    points = lineDDA(line[0], line[1], line[2], line[3]);
                } else {
                    points = lineBresenham(line[0], line[1], line[2], line[3]).points;
                }
                for (const point of points) {
                    testCtx.fillRect(point[0], point[1], 1, 1);
                }
            }
            times.push(performance.now() - start);
        }
        ddaSum += times[0];
        bresSum += times[1];
        text += 'Запуск ' + (run + 1) + ': ЦДА ' + times[0].toFixed(2) + ' мс, Брезенхем ' + times[1].toFixed(2) + ' мс\n';
    }
    text += 'Среднее: ЦДА ' + (ddaSum / 5).toFixed(2) + ' мс, Брезенхем ' + (bresSum / 5).toFixed(2) + ' мс\n';
    text += 'Это время этих реализаций вместе с рисованием и созданием массивов. Брезенхем ещё сохраняет шаги таблицы.';
    document.querySelector('#time').textContent = text;
}

document.querySelector('#build').addEventListener('click', build);
document.querySelector('#test').addEventListener('click', test);
algorithm.addEventListener('change', build);
big.addEventListener('change', build);
build();
compare();
