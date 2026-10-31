const url = 'https://jsonplaceholder.typicode.com/posts';
const state = {posts: [], filter: '', editingId: null, loading: false, saving: false, error: ''};
const form = document.querySelector('#form');
const title = document.querySelector('#title');
const body = document.querySelector('#body');
const search = document.querySelector('#search');
const status = document.querySelector('#status');
const posts = document.querySelector('#posts');
const save = document.querySelector('#save');
const cancel = document.querySelector('#cancel');
const load = document.querySelector('#load');

function getFilteredPosts(items, filter) {
    const text = filter.toLowerCase();
    return items.filter(post => (post.title + post.body).toLowerCase().includes(text));
}

function renderPosts(items) {
    posts.replaceChildren();
    for (const post of items) {
        const div = document.createElement('div');
        const heading = document.createElement('h3');
        const paragraph = document.createElement('p');
        const edit = document.createElement('button');
        const remove = document.createElement('button');
        heading.textContent = post.id + '. ' + post.title;
        paragraph.textContent = post.body;
        edit.textContent = 'Редактировать';
        remove.textContent = 'Удалить';
        edit.disabled = state.saving;
        remove.disabled = state.saving;
        edit.addEventListener('click', () => {
            state.editingId = post.id;
            title.value = post.title;
            body.value = post.body;
            render();
        });
        remove.addEventListener('click', () => deletePost(post.id));
        div.append(heading, paragraph, edit, remove);
        posts.append(div);
    }
}

function render() {
    status.textContent = state.error || (state.loading ? 'Загрузка...' : state.saving ? 'Сохранение...' : '');
    save.disabled = state.saving || state.loading;
    load.disabled = state.saving || state.loading;
    cancel.hidden = state.editingId === null;
    save.textContent = state.editingId === null ? 'Сохранить' : 'Сохранить изменения';
    renderPosts(getFilteredPosts(state.posts, state.filter));
}

function resetForm() {
    form.reset();
    state.editingId = null;
    render();
}

async function loadPosts() {
    if (state.loading || state.saving) return;
    state.loading = true;
    state.error = '';
    render();
    try {
        const response = await fetch(url + '?_limit=10', {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        state.posts = await response.json();
    } catch (error) {
        state.error = 'Ошибка загрузки: ' + error.message;
    } finally {
        state.loading = false;
        render();
    }
}

async function createPost(data) {
    const response = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...data, userId: 1})});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
}

async function updatePost(id, data) {
    const response = await fetch(url + '/' + id, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
}

async function deletePost(id) {
    if (state.saving) return;
    state.saving = true;
    state.error = '';
    render();
    try {
        const response = await fetch(url + '/' + id, {method: 'DELETE'});
        if (!response.ok) throw new Error('HTTP ' + response.status);
        state.posts = state.posts.filter(post => post.id !== id);
        if (state.editingId === id) resetForm();
    } catch (error) {
        state.error = 'Ошибка удаления: ' + error.message;
    } finally {
        state.saving = false;
        render();
    }
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state.saving || state.loading) return;
    const data = {title: title.value.trim(), body: body.value.trim()};
    if (!data.title || !data.body) {
        state.error = 'Заполните оба поля';
        render();
        return;
    }
    state.saving = true;
    state.error = '';
    render();
    try {
        if (state.editingId === null) {
            const post = await createPost(data);
            state.posts.unshift(post);
        } else {
            const id = state.editingId;
            const post = await updatePost(id, data);
            state.posts = state.posts.map(item => item.id === id ? {...item, ...post} : item);
        }
        resetForm();
    } catch (error) {
        state.error = 'Ошибка сохранения: ' + error.message;
    } finally {
        state.saving = false;
        render();
    }
});

cancel.addEventListener('click', resetForm);
load.addEventListener('click', loadPosts);
search.addEventListener('input', () => {
    state.filter = search.value;
    render();
});
loadPosts();
