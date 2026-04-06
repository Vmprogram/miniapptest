const API = '/api/miniapp';
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let userId = null;

async function api(method, path, body) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function loadUser() {
    const data = await api('GET', '/user');
    userId = data.id;
    document.getElementById('balance').textContent = data.balance;
    document.getElementById('profile-balance').textContent = data.balance;
    document.getElementById('profile-sub').textContent = data.sub_name || 'Нет';
    document.getElementById('profile-expires').textContent = data.sub_expires || 'Нет';
    document.getElementById('main').classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
}

async function loadTasks() {
    const tasks = await api('GET', '/tasks');
    const list = document.getElementById('tasks-list');
    list.innerHTML = tasks.map(t => `
        <div class="task-item">
            <div class="type">${t.type}</div>
            <div>${t.target_link.substring(0, 40)}...</div>
            <div>Кол-во: ${t.quantity} | Время: ${t.deadline_minutes || '-'} мин</div>
            <div class="status">${t.status}</div>
        </div>
    `).join('') || '<p>Нет задач</p>';
}

async function loadAutoTasks() {
    const tasks = await api('GET', '/auto-tasks');
    const list = document.getElementById('auto-tasks-list');
    list.innerHTML = tasks.map(t => `
        <div class="task-item">
            <div class="type">${t.type}</div>
            <div>Кол-во: ${t.quantity} ± ${t.deviation}</div>
            <div class="status">${t.is_active ? 'Активна' : 'Неактивна'}</div>
        </div>
    `).join('') || '';
}

async function loadSubs() {
    const subs = await api('GET', '/subs');
    const list = document.getElementById('subs-list');
    list.innerHTML = subs.map(s => `
        <div class="sub-item">
            <div>
                <div>${s.name}</div>
                <div class="price">${s.price_per_month} USDT/мес</div>
                <div>Лимит: ${s.daily_limit}/день</div>
            </div>
            <button class="btn-buy" onclick="buySub('${s.id}')">Купить</button>
        </div>
    `).join('') || '<p>Нет подписок</p>';
}

async function buySub(id) {
    try {
        await api('POST', '/buy-sub', { sub_id: id });
        tg.showAlert('Подписка активирована!');
        loadUser();
    } catch (e) {
        tg.showAlert('Ошибка: ' + e.message);
    }
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        type: document.getElementById('task-type').value,
        link: document.getElementById('task-link').value,
        qty: parseInt(document.getElementById('task-qty').value),
        deadline: parseInt(document.getElementById('task-deadline').value)
    };
    try {
        await api('POST', '/task', data);
        tg.showAlert('Задача создана!');
        e.target.reset();
        loadTasks();
    } catch (e) {
        tg.showAlert('Ошибка: ' + e.message);
    }
});

document.getElementById('auto-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        type: document.getElementById('auto-task-type').value,
        link: document.getElementById('auto-task-link').value,
        qty: parseInt(document.getElementById('auto-task-qty').value),
        deviation: parseInt(document.getElementById('auto-task-deviation').value),
        deadline: parseInt(document.getElementById('auto-task-deadline').value)
    };
    try {
        await api('POST', '/auto-task', data);
        tg.showAlert('Автозадача создана!');
        e.target.reset();
        loadAutoTasks();
    } catch (e) {
        tg.showAlert('Ошибка: ' + e.message);
    }
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
});

async function init() {
    const initData = tg.initDataUnsafe;
    if (initData && initData.user) {
        userId = initData.user.id;
    }
    await loadUser();
    await loadTasks();
    await loadSubs();
    await loadAutoTasks();
}

init();