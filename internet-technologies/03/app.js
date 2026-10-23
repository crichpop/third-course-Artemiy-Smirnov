const API_URL = 'https://jsonplaceholder.typicode.com/users';

const state = {
  users: [],
  isLoading: false,
  error: null,
  filter: '',
  hasLoaded: false
};

const elements = {
  load: document.querySelector('#load-button'),
  refresh: document.querySelector('#refresh-button'),
  search: document.querySelector('#search'),
  status: document.querySelector('#status'),
  users: document.querySelector('#users'),
  statistics: document.querySelector('#statistics')
};

function getFilteredUsers(users, filter) {
  const query = filter.trim().toLowerCase();
  return users.filter(user =>
    [user.name, user.username, user.email].some(value =>
      value.toLowerCase().includes(query)
    )
  );
}

function createUserCard(user) {
  const card = document.createElement('article');
  card.className = 'card';
  const heading = document.createElement('h2');
  heading.textContent = user.name;
  const username = document.createElement('p');
  username.className = 'username';
  username.textContent = `@${user.username}`;
  const details = document.createElement('dl');

  for (const [label, value] of [
    ['Email', user.email],
    ['Город', user.address.city],
    ['Компания', user.company.name]
  ]) {
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = value;
    details.append(term, description);
  }

  card.append(heading, username, details);
  return card;
}

function renderUsers(users) {
  const fragment = document.createDocumentFragment();
  users.forEach(user => fragment.append(createUserCard(user)));
  elements.users.replaceChildren(fragment);
}

function render() {
  elements.load.disabled = state.isLoading;
  elements.refresh.disabled = state.isLoading || !state.hasLoaded;
  elements.users.setAttribute('aria-busy', String(state.isLoading));
  elements.status.classList.toggle('error', Boolean(state.error));
  elements.statistics.textContent = '';

  if (state.isLoading || state.error || !state.hasLoaded) {
    renderUsers([]);
    elements.status.textContent = state.isLoading
      ? 'Загрузка...'
      : state.error || 'Данные ещё не загружены. Нажмите «Загрузить».';
    return;
  }

  const filteredUsers = getFilteredUsers(state.users, state.filter);
  renderUsers(filteredUsers);
  elements.status.textContent = state.users.length === 0
    ? 'Сервер вернул пустой список пользователей.'
    : filteredUsers.length === 0
      ? 'Ничего не найдено. Измените поисковый запрос.'
      : 'Пользователи загружены.';

  const cities = new Set(state.users.map(user => user.address.city));
  elements.statistics.textContent = `Всего: ${state.users.length} · Показано: ${filteredUsers.length} · Уникальных городов: ${cities.size}`;
}

function isValidUser(user) {
  return user !== null && typeof user === 'object' &&
    [user.name, user.username, user.email, user.address?.city, user.company?.name]
      .every(value => typeof value === 'string');
}

async function loadUsers() {
  if (state.isLoading) return;
  state.isLoading = true;
  state.error = null;
  render();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Сервер вернул ошибку HTTP ${response.status}.`);
    }
    const users = await response.json();
    if (!Array.isArray(users) || !users.every(isValidUser)) {
      throw new Error('Сервер вернул данные неожиданного формата.');
    }
    state.users = users;
    state.hasLoaded = true;
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
    if (error.name === 'AbortError') {
      state.error = 'Сервер не ответил за 15 секунд. Повторите загрузку.';
    } else if (error instanceof TypeError) {
      state.error = 'Не удалось выполнить запрос. Проверьте подключение к сети и повторите загрузку.';
    } else if (error instanceof SyntaxError) {
      state.error = 'Ответ сервера не является корректным JSON. Повторите загрузку.';
    } else {
      state.error = `${error.message} Повторите загрузку.`;
    }
  } finally {
    clearTimeout(timeout);
    state.isLoading = false;
    render();
  }
}

elements.load.addEventListener('click', loadUsers);
elements.refresh.addEventListener('click', loadUsers);
elements.search.addEventListener('input', event => {
  state.filter = event.target.value;
  render();
});

render();
