let cntval = 0;
let sumval = 0;
let midval = 0;
let minval = 0;
let maxval = 0;
let value = 0;

const buttonadd = document.querySelector('#add');
const buttondel = document.querySelector('#del');
const buttonreset = document.querySelector('#reset');
const vector = document.querySelector('#vct');
const cnt = document.querySelector('#cnt');
const sum = document.querySelector('#sum');
const mid = document.querySelector('#mid');
const min = document.querySelector('#min');
const max = document.querySelector('#max');
const numbers = []
const input = document.querySelector('#list');

function render() {
    vector.textContent = numbers;
    cnt.textContent = cntval;
    sum.textContent = sumval;
    mid.textContent = midval;
    min.textContent = minval;
    max.textContent = maxval;

}

buttonadd.addEventListener('click', () => {
    value = input.valueAsNumber;
    numbers.push(value);
    update(numbers);
});

buttondel.addEventListener('click', () => {
    numbers.pop();
    update(numbers);
    if (numbers.length === 0) {
        minval = 0;
        maxval = 0;
        render();
    }

})

buttonreset.addEventListener('click', () => {
    numbers.length = 0;
    update(numbers);
    maxval = 0;
    minval = 0;
    render();
})

function update(numbers) {
    cntval = 0;
    sumval = 0;
    minval = Infinity;
    maxval = -Infinity;
    for (let i = 0; i < numbers.length; i++) {
        cntval += 1;
        sumval += numbers[i];
        minval = Math.min(minval, numbers[i]);
        maxval = Math.max(maxval, numbers[i]);
    }
    if (cntval > 0) {
        midval = sumval / cntval;
    } else {
        midval = 0;
    }
    render();
}

render();