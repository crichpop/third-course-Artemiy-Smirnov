const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

const books = [
    {id: 1, title: 'Мастер и Маргарита', author: 'Михаил Булгаков', available: true},
    {id: 2, title: 'Капитанская дочка', author: 'Александр Пушкин', available: true},
    {id: 3, title: 'Преступление и наказание', author: 'Фёдор Достоевский', available: false},
    {id: 4, title: 'Евгений Онегин', author: 'Александр Пушкин', available: false},
    {id: 5, title: 'Отцы и дети', author: 'Иван Тургенев', available: true},
    {id: 6, title: 'Война и мир', author: 'Лев Толстой', available: true}
];
let nextId = 7;

app.get('/api/books', (req, res) => {
    let result = books;
    if (req.query.author) result = result.filter(book => book.author.toLowerCase().includes(String(req.query.author).toLowerCase()));
    if (req.query.available !== undefined) {
        if (req.query.available !== 'true' && req.query.available !== 'false') return res.status(400).json({error: 'available must be true or false'});
        result = result.filter(book => book.available === (req.query.available === 'true'));
    }
    res.json(result);
});
app.get('/api/books/:id', (req, res) => {
    const book = books.find(item => item.id === Number(req.params.id));
    if (!book) return res.status(404).json({error: 'Not found'});
    res.json(book);
});
app.post('/api/books', (req, res) => {
    const {title, author, available} = req.body || {};
    if (typeof title !== 'string' || !title.trim() || typeof author !== 'string' || !author.trim() || typeof available !== 'boolean') {
        return res.status(400).json({error: 'title, author and available are required'});
    }
    const book = {id: nextId++, title: title.trim(), author: author.trim(), available};
    books.push(book);
    res.status(201).json(book);
});
app.get('/api/info', (req, res) => {
    res.json({name: 'Books API', version: 1, items: books.length});
});
app.use((req, res) => res.status(404).json({error: 'Route not found'}));
app.listen(PORT, () => console.log('Сервер запущен на порту ' + PORT));
