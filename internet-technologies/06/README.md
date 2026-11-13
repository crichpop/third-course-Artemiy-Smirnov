```bash
cd internet-technologies/06
npm install
npm start
```

Порт 3000. При первом запуске создаются `data.db` и таблица `books`:

| Поле | Тип |
|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `title` | `TEXT NOT NULL` |
| `author` | `TEXT NOT NULL` |
| `available` | `INTEGER NOT NULL DEFAULT 1` |

## Маршруты

| Метод | URL | SQL | Успех | Ошибки |
|---|---|---|---:|---|
| GET | `/api/books` | SELECT, WHERE для `available` | 200 | 400 |
| GET | `/api/books/:id` | SELECT | 200 | 404 |
| POST | `/api/books` | INSERT | 201 | 400 |
| PATCH | `/api/books/:id` | UPDATE | 200 | 400, 404 |
| DELETE | `/api/books/:id` | DELETE | 204 | 404 |

Неизвестный маршрут — 404; ошибка сервера — 500.

```bash
curl -X POST http://localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title":"Мастер и Маргарита","author":"Михаил Булгаков","available":true}'
curl -X PATCH http://localhost:3000/api/books/1 -H 'Content-Type: application/json' -d '{"available":false}'
```

Фильтры: `?available=true|false` (SQL `WHERE available = ?`) и `?author=Булгаков` (поиск по части имени без учёта регистра); допускается совместное использование. Значения клиента в SQL передаются параметрами.

POST требует непустые строки `title`, `author` и логическое `available`. PATCH проверяет тип и непустоту каждого переданного поля. Некорректные значения и JSON — 400.

Проверка сохранения: POST создал книгу; GET вернул её до остановки сервера и после повторного запуска. Также проверены PATCH, DELETE и требуемые ответы 400/404.
