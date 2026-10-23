'use strict';
const WIDTH = 41;
const HEIGHT = 31;
const CELL = 20;
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const $ = selector => document.querySelector(selector);
const state = { circle: null, steps: [], selected: 0, highlight: true };

function symmetricPoints(cx, cy, x, y) {
  return [[cx+x,cy+y],[cx+y,cy+x],[cx-x,cy+y],[cx-y,cy+x],
    [cx+x,cy-y],[cx+y,cy-x],[cx-x,cy-y],[cx-y,cy-x]];
}
function putPixel(x, y, color = '#146779') {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}
function plot8(cx, cy, x, y, color) {
  symmetricPoints(cx, cy, x, y).forEach(([px, py]) => putPixel(px, py, color));
}

function midpointSteps(r) {
  let x = 0, y = r, d = 1 - r;
  const steps = [];
  while (x <= y) {
    const before = d;
    const variant = d < 0 ? 'E' : 'SE';
    const oldY = y;
    if (d < 0) {
      d += 2 * x + 3;
    } else {
      d += 2 * (x - y) + 5;
      y -= 1;
    }
    steps.push({ x, y: oldY, before, variant, after: d });
    x += 1;
  }
  return steps;
}
function circleMidpoint(cx, cy, r) {
  const steps = midpointSteps(r);
  steps.forEach(({x, y}) => plot8(cx, cy, x, y));
  return steps;
}
function formulaPoints(r) {
  const points = [];
  for (let x = 0; x <= r; x += 1) {
    const y = Math.round(Math.sqrt(r * r - x * x));
    if (x > y) break;
    points.push({x, y});
  }
  return points;
}
function circleFormula(cx, cy, r) {
  const points = formulaPoints(r);
  points.forEach(({x, y}) => plot8(cx, cy, x, y));
  return points;
}
function pixelSet(points) {
  const pixels = new Set();
  points.forEach(({x,y}) => symmetricPoints(0,0,x,y).forEach(p => pixels.add(p.join(','))));
  return pixels;
}
function validate(cx, cy, r) {
  if (![cx, cy, r].every(Number.isSafeInteger)) return 'Введите целые числа для cx, cy и r.';
  if (r <= 0) return 'Радиус должен быть больше нуля.';
  if (cx-r < 0 || cx+r >= WIDTH || cy-r < 0 || cy+r >= HEIGHT) {
    return 'Окружность выходит за границы: x должен быть от 0 до 40, y — от 0 до 30. Измените центр или радиус.';
  }
  return null;
}
function drawGrid() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#fbfdfe'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#e0e8ed'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x=0; x<=WIDTH; x++) {ctx.moveTo(x*CELL+.5,0);ctx.lineTo(x*CELL+.5,canvas.height);}
  for (let y=0; y<=HEIGHT; y++) {ctx.moveTo(0,y*CELL+.5);ctx.lineTo(canvas.width,y*CELL+.5);}
  ctx.stroke();
}
function draw() {
  drawGrid();
  if (!state.circle) return;
  const {cx,cy,r} = state.circle;
  if ($('#method').value === 'formula') circleFormula(cx,cy,r);
  else circleMidpoint(cx,cy,r);
  if (state.highlight) {
    const {x,y} = state.steps[state.selected];
    plot8(cx,cy,x,y,'#d88735');
    putPixel(cx+x,cy+y,'#7953b5');
  }
  ctx.strokeStyle='#8d9eaa'; ctx.beginPath();
  ctx.moveTo(cx*CELL+5,cy*CELL+10);ctx.lineTo(cx*CELL+15,cy*CELL+10);
  ctx.moveTo(cx*CELL+10,cy*CELL+5);ctx.lineTo(cx*CELL+10,cy*CELL+15);ctx.stroke();
}
function selectStep(index) {
  state.selected = index;
  $('#step').value = index;
  document.querySelectorAll('#steps tr').forEach((row,i) => row.classList.toggle('selected',i===index));
  $('#points').replaceChildren();
  if (!state.circle) {$('#step-info').textContent='Сначала постройте окружность.';draw();return;}
  const {x,y,before,variant} = state.steps[index];
  $('#step-info').textContent=`Шаг ${index}: (${x}, ${y}), d = ${before}, следующий переход ${variant}.`;
  symmetricPoints(state.circle.cx,state.circle.cy,x,y).forEach(([px,py])=>{
    const li=document.createElement('li');li.textContent=`(${px}, ${py})`;$('#points').append(li);
  });
  draw();
}
function buildTable() {
  $('#steps').replaceChildren();
  state.steps.forEach((s,i)=>{
    const tr=document.createElement('tr');
    [i,s.x,s.y,s.before,s.variant,s.after].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});
    tr.tabIndex=0;tr.setAttribute('aria-label',`Выбрать шаг ${i}`);
    tr.addEventListener('click',()=>selectStep(i));
    tr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectStep(i);}});
    $('#steps').append(tr);
  });
}
function build() {
  const raw=[$('#cx').value,$('#cy').value,$('#radius').value];
  const [cx,cy,r]=raw.map(Number);
  const error=raw.some(v=>v.trim()==='') ? 'Заполните все три поля.' : validate(cx,cy,r);
  $('#message').classList.toggle('error',Boolean(error));
  if(error){$('#message').textContent=error+' Предыдущий рисунок сохранён.';return;}
  state.circle={cx,cy,r};state.steps=midpointSteps(r);
  $('#step').disabled=false;$('#step').max=state.steps.length-1;
  buildTable();selectStep(0);
  $('#message').textContent=`Построено: центр (${cx}, ${cy}), r = ${r}. Базовых точек: ${state.steps.length}, уникальных пикселей: ${pixelSet(state.steps).size}.`;
}

function midpointPoints(r) {
  const points=[];let x=0,y=r,d=1-r;
  while(x<=y){points.push({x,y});if(d<0){d+=2*x+3;}else{d+=2*(x-y)+5;y--;}x++;}
  return points;
}
let benchmarkChecksum=0;
function timeSeries(fn,r,count) {
  let checksum=0;const start=performance.now();
  for(let i=0;i<count;i++){const points=fn(r);checksum+=points.length+points[points.length-1].y;}
  const elapsed=performance.now()-start;benchmarkChecksum+=checksum;return elapsed;
}
function summary(values){const sorted=[...values].sort((a,b)=>a-b);return {median:sorted[Math.floor(sorted.length/2)],min:sorted[0],max:sorted[sorted.length-1]};}
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
async function runBenchmark() {
  $('#benchmark').disabled=true;$('#comparison').replaceChildren();
  $('#bench-status').textContent='Измерение… 7 серий по 20 000 построений для каждого способа и радиуса.';
  const radii=[...new Set([1,5,8,10,state.circle?.r].filter(Boolean))].sort((a,b)=>a-b);
  const results=[];
  try {
    await pause();
    for(const r of radii){
      timeSeries(midpointPoints,r,3000);timeSeries(formulaPoints,r,3000);
      const mid=[],formula=[];
      for(let series=0;series<7;series++){
        await pause();
        if(series%2===0){mid.push(timeSeries(midpointPoints,r,20000));formula.push(timeSeries(formulaPoints,r,20000));}
        else{formula.push(timeSeries(formulaPoints,r,20000));mid.push(timeSeries(midpointPoints,r,20000));}
      }
      const a=midpointPoints(r),b=formulaPoints(r),setA=pixelSet(a),setB=pixelSet(b);
      const differences=[...setA].filter(p=>!setB.has(p)).length+[...setB].filter(p=>!setA.has(p)).length;
      const result={r,base:[a.length,b.length],pixels:[setA.size,setB.size],differences,midpoint:summary(mid),formula:summary(formula),series:{midpoint:mid,formula}};
      results.push(result);
      const timing=v=>`${v.median.toFixed(2)} [${v.min.toFixed(2)}–${v.max.toFixed(2)}]`;
      const row=document.createElement('tr');
      [r,result.base.join(' / '),result.pixels.join(' / '),differences,timing(result.midpoint),timing(result.formula)].forEach(value=>{const td=document.createElement('td');td.textContent=value;row.append(td);});
      $('#comparison').append(row);
    }
    $('#bench-status').textContent='Готово. Указано время серии из 20 000 построений: медиана и диапазон 7 серий после прогрева. Различия считаются по уникальным координатам пикселей.';
    return results;
  } finally {$('#benchmark').disabled=false;}
}
$('#controls').addEventListener('submit',e=>{e.preventDefault();build();});
$('#clear').addEventListener('click',()=>{
  state.circle=null;state.steps=[];state.selected=0;$('#steps').replaceChildren();$('#step').value=0;$('#step').max=0;$('#step').disabled=true;
  $('#message').classList.remove('error');$('#message').textContent='Canvas очищен. Введите параметры и нажмите «Построить».';selectStep(0);
});
$('#highlight').addEventListener('change',e=>{state.highlight=e.target.checked;draw();});
$('#step').addEventListener('input',e=>selectStep(Number(e.target.value)));
$('#benchmark').addEventListener('click',runBenchmark);
$('#method').addEventListener('change',draw);
 build();
