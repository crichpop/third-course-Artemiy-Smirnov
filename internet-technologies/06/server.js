const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, 'data.db'));
app.use(express.json());

// ЛР6: данные книг теперь сохраняются в таблице SQLite.
db.prepare(`
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        available INTEGER NOT NULL DEFAULT 1
    )
`).run();

function asBook(row) {
    return {...row, available: Boolean(row.available)};
}

function validId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

app.get('/api/books', (req, res) => {
    const {author, available} = req.query;
    if (author !== undefined && (typeof author !== 'string' || !author.trim())) {
        return res.status(400).json({error: 'author must be a nonempty string'});
    }
    if (available !== undefined && available !== 'true' && available !== 'false') {
        return res.status(400).json({error: 'available must be true or false'});
    }

    // ЛР6: available фильтруется через WHERE. Сравнение автора остаётся
    // в JavaScript, поскольку SQLite LOWER() не меняет регистр кириллицы.
    const conditions = [];
    const params = [];
    if (available !== undefined) {
        conditions.push('available = ?');
        params.push(available === 'true' ? 1 : 0);
    }
    const sql = 'SELECT id, title, author, available FROM books' +
        (conditions.length ? ' WHERE ' + conditions.join(' AND ') : '') + ' ORDER BY id';
    let books = db.prepare(sql).all(...params).map(asBook);
    if (author !== undefined) {
        books = books.filter(book => book.author.toLowerCase().includes(author.trim().toLowerCase()));
    }
    res.json(books);
});

app.get('/api/books/:id', (req, res) => {
    const id = validId(req.params.id);
    const book = id === null ? undefined : db.prepare(
        'SELECT id, title, author, available FROM books WHERE id = ?'
    ).get(id);
    if (!book) return res.status(404).json({error: 'Not found'});
    res.json(asBook(book));
});

app.post('/api/books', (req, res) => {
    const {title, author, available} = req.body || {};
    if (typeof title !== 'string' || !title.trim() ||
        typeof author !== 'string' || !author.trim() || typeof available !== 'boolean') {
        return res.status(400).json({error: 'title, author and available are required'});
    }
    const result = db.prepare(
        'INSERT INTO books (title, author, available) VALUES (?, ?, ?)'
    ).run(title.trim(), author.trim(), available ? 1 : 0);
    const book = db.prepare('SELECT id, title, author, available FROM books WHERE id = ?')
        .get(result.lastInsertRowid);
    res.status(201).json(asBook(book));
});

app.patch('/api/books/:id', (req, res) => {
    const id = validId(req.params.id);
    const current = id === null ? undefined : db.prepare(
        'SELECT id, title, author, available FROM books WHERE id = ?'
    ).get(id);
    if (!current) return res.status(404).json({error: 'Not found'});

    const {title, author, available} = req.body || {};
    if ((title !== undefined && (typeof title !== 'string' || !title.trim())) ||
        (author !== undefined && (typeof author !== 'string' || !author.trim())) ||
        (available !== undefined && typeof available !== 'boolean')) {
        return res.status(400).json({error: 'Invalid book fields'});
    }
    const nextTitle = title === undefined ? current.title : title.trim();
    const nextAuthor = author === undefined ? current.author : author.trim();
    const nextAvailable = available === undefined ? current.available : (available ? 1 : 0);
    db.prepare('UPDATE books SET title = ?, author = ?, available = ? WHERE id = ?')
        .run(nextTitle, nextAuthor, nextAvailable, id);
    const updated = db.prepare('SELECT id, title, author, available FROM books WHERE id = ?').get(id);
    res.json(asBook(updated));
});

app.delete('/api/books/:id', (req, res) => {
    const id = validId(req.params.id);
    const result = id === null ? {changes: 0} : db.prepare('DELETE FROM books WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({error: 'Not found'});
    res.status(204).end();
});

app.use((req, res) => res.status(404).json({error: 'Route not found'}));
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({error: 'Invalid JSON'});
    }
    console.error(err);
    res.status(500).json({error: 'Internal server error'});
});

app.listen(PORT, () => console.log('Сервер запущен на порту ' + PORT));
