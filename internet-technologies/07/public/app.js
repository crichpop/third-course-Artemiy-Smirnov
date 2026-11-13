// ЛР7: books — текущая копия данных из SQLite для отображения страницы.
let books = [];
const form = document.querySelector('#book-form');
const list = document.querySelector('#book-list');
const message = document.querySelector('#message');
const refreshButton = document.querySelector('#refresh-button');

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
}

// fetch не отклоняет Promise при HTTP 400/404, поэтому проверяем response.ok.
async function request(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        let error = 'HTTP ' + response.status;
        try {
            const data = await response.json();
            error = data.error || error;
        } catch {
            // Ответ с ошибкой может не содержать JSON.
        }
        throw new Error(error);
    }
    // У DELETE 204 нет тела, которое можно передать в response.json().
    if (response.status === 204) return null;
    return response.json();
}

function render() {
    list.replaceChildren();
    if (books.length === 0) {
        const empty = document.createElement('li');
        empty.textContent = 'Список пуст';
        list.append(empty);
        return;
    }

    for (const book of books) {
        const item = document.createElement('li');
        item.className = 'book';
        const details = document.createElement('div');
        const title = document.createElement('span');
        title.className = 'book-title';
        title.textContent = book.title;
        const author = document.createElement('span');
        author.className = 'book-author';
        author.textContent = book.author;
        const status = document.createElement('span');
        status.className = 'book-status';
        status.textContent = book.available ? 'Доступна' : 'Недоступна';
        details.append(title, author, status);

        const actions = document.createElement('div');
        actions.className = 'book-actions';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'secondary';
        toggle.textContent = book.available ? 'Отметить недоступной' : 'Отметить доступной';
        toggle.setAttribute('aria-label', `${toggle.textContent}: ${book.title}`);
        toggle.addEventListener('click', () => changeAvailability(book));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'danger';
        remove.textContent = 'Удалить';
        remove.setAttribute('aria-label', `Удалить: ${book.title}`);
        remove.addEventListener('click', () => deleteBook(book));
        actions.append(toggle, remove);
        item.append(details, actions);
        list.append(item);
    }
}

async function refreshBooks() {
    showMessage('Загрузка...');
    refreshButton.disabled = true;
    try {
        books = await request('/api/books');
        render();
        showMessage(books.length > 0 ? 'Данные загружены' : '');
    } catch (error) {
        showMessage('Не удалось загрузить книги: ' + error.message, true);
    } finally {
        refreshButton.disabled = false;
    }
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    const title = document.querySelector('#book-title').value.trim();
    const author = document.querySelector('#book-author').value.trim();
    const available = document.querySelector('#book-available').checked;
    if (!title || !author) {
        showMessage('Введите название и автора', true);
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
        await request('/api/books', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title, author, available})
        });
        form.reset();
        await refreshBooks();
        if (!message.classList.contains('error')) showMessage('Книга добавлена');
    } catch (error) {
        showMessage('Не удалось добавить книгу: ' + error.message, true);
    } finally {
        submitButton.disabled = false;
    }
});

async function changeAvailability(book) {
    try {
        await request('/api/books/' + book.id, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({available: !book.available})
        });
        await refreshBooks();
        if (!message.classList.contains('error')) showMessage('Доступность изменена');
    } catch (error) {
        showMessage('Не удалось изменить книгу: ' + error.message, true);
    }
}

async function deleteBook(book) {
    if (!window.confirm(`Удалить книгу «${book.title}»?`)) return;
    try {
        await request('/api/books/' + book.id, {method: 'DELETE'});
        await refreshBooks();
        if (!message.classList.contains('error')) showMessage('Книга удалена');
    } catch (error) {
        showMessage('Не удалось удалить книгу: ' + error.message, true);
    }
}

refreshButton.addEventListener('click', refreshBooks);
refreshBooks();
