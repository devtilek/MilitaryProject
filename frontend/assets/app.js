const API_BASE_URL =
  window.API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin);

const state = {
  token: localStorage.getItem('expenseToken'),
  user: JSON.parse(localStorage.getItem('expenseUser') || 'null'),
  categories: [],
  transactions: [],
  page: Number(localStorage.getItem('expensePage') || 1),
  limit: Number(localStorage.getItem('expenseLimit') || 10),
  search: localStorage.getItem('expenseSearch') || '',
  type: localStorage.getItem('expenseType') || '',
  method: localStorage.getItem('expenseMethod') || ''
};

const $ = (id) => document.getElementById(id);

const api = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

const money = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: state.user?.currency || 'KZT',
    maximumFractionDigits: 0
  }).format(amount || 0);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

const showMessage = (message) => {
  $('authMessage').textContent = message;
};

const setAuthMode = (mode) => {
  $('loginForm').classList.toggle('active-form', mode === 'login');
  $('registerForm').classList.toggle('active-form', mode === 'register');
  $('showLogin').classList.toggle('active', mode === 'login');
  $('showRegister').classList.toggle('active', mode === 'register');
  showMessage('');
};

const applyTheme = (theme) => {
  document.body.classList.toggle('dark', theme === 'dark');
  $('themeToggle').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  localStorage.setItem('expenseTheme', theme);
};

const saveSession = ({ token, user }) => {
  state.token = token;
  state.user = user;
  localStorage.setItem('expenseToken', token);
  localStorage.setItem('expenseUser', JSON.stringify(user));
  applyTheme(localStorage.getItem('expenseTheme') || user.preferredTheme || 'light');
};

const clearSession = () => {
  state.token = null;
  state.user = null;
  localStorage.removeItem('expenseToken');
  localStorage.removeItem('expenseUser');
};

const persistFilters = () => {
  localStorage.setItem('expensePage', String(state.page));
  localStorage.setItem('expenseLimit', String(state.limit));
  localStorage.setItem('expenseSearch', state.search);
  localStorage.setItem('expenseType', state.type);
  localStorage.setItem('expenseMethod', state.method);
};

const renderShell = async () => {
  const loggedIn = Boolean(state.token);
  $('authView').classList.toggle('hidden', loggedIn);
  $('dashboard').classList.toggle('hidden', !loggedIn);

  if (loggedIn) {
    await Promise.all([loadProfile(), loadCategories(), loadBudgets()]);
    await loadTransactions();
  }
};

const loadProfile = async () => {
  const profile = await api('/profile');
  state.user = profile.user;
  localStorage.setItem('expenseUser', JSON.stringify(profile.user));

  $('welcomeTitle').textContent = `Welcome, ${profile.user.name}`;
  $('balanceValue').textContent = money(profile.stats.balance);
  $('incomeValue').textContent = money(profile.stats.income);
  $('expenseValue').textContent = money(profile.stats.expenses);
  $('transactionCount').textContent = profile.stats.transactionCount;
  fillProfileTab(profile);
};

const loadCategories = async () => {
  state.categories = await api('/categories');
  renderCategoryChips();
  fillTransactionCategories();
  fillBudgetCategories();
};

const renderCategoryChips = () => {
  $('categoryList').innerHTML = state.categories
    .map(
      (category) =>
        `<span class="chip"><span class="swatch" style="background:${category.color}"></span>${escapeHtml(
          category.name
        )} · ${category.type}</span>`
    )
    .join('');
};

const fillTransactionCategories = () => {
  const currentType = $('transactionType').value;
  const options = state.categories
    .filter((category) => category.type === currentType)
    .map((category) => `<option value="${category._id}">${escapeHtml(category.name)}</option>`)
    .join('');
  $('transactionCategory').innerHTML = options;
};

const fillBudgetCategories = () => {
  const options = state.categories
    .filter((category) => category.type === 'expense')
    .map((category) => `<option value="${category._id}">${escapeHtml(category.name)}</option>`)
    .join('');
  $('budgetCategory').innerHTML = options;
};

const loadBudgets = async () => {
  const month = new Date().toISOString().slice(0, 7);
  const budgets = await api(`/budgets?month=${month}`);

  if (!budgets.length) {
    $('budgetList').innerHTML = '<p class="empty-state">No budgets for this month yet.</p>';
    return;
  }

  $('budgetList').innerHTML = budgets
    .map(
      (budget) => `
        <article class="budget-item">
          <strong>${escapeHtml(budget.category?.name || 'Category')} · ${money(budget.limit)}</strong>
          <span>${budget.month}, alert at ${budget.alertPercent}%</span>
        </article>
      `
    )
    .join('');
};

const buildQuery = () => {
  const params = new URLSearchParams({
    page: String(state.page),
    limit: String(state.limit)
  });
  if (state.search) params.set('search', state.search);
  if (state.type) params.set('type', state.type);
  if (state.method) params.set('paymentMethod', state.method);
  return params.toString();
};

const loadTransactions = async () => {
  const result = await api(`/resource?${buildQuery()}`);
  state.transactions = result.data;
  renderTransactions(result.data);
  $('pageInfo').textContent = `Page ${result.pagination.page} of ${Math.max(result.pagination.pages, 1)}`;
  $('prevPage').disabled = result.pagination.page <= 1;
  $('nextPage').disabled = result.pagination.page >= result.pagination.pages;
  await loadProfile();
};

const renderTransactions = (transactions) => {
  renderRecent(transactions);
  if (!transactions.length) {
    $('transactionList').innerHTML = '<p class="empty-state">No transactions match the current filters.</p>';
    return;
  }

  $('transactionList').innerHTML = transactions
    .map(
      (transaction) => `
        <article class="transaction-card">
          <div>
            <h4>${escapeHtml(transaction.title)}</h4>
            <p>${escapeHtml(transaction.note || 'No note')}</p>
            <div class="meta-row">
              <span class="badge">${new Date(transaction.date).toLocaleDateString()}</span>
              <span class="badge">${transaction.paymentMethod}</span>
              <span class="badge">${escapeHtml(transaction.category?.name || 'No category')}</span>
            </div>
          </div>
          <strong class="amount ${transaction.type}">
            ${transaction.type === 'income' ? '+' : '-'}${money(transaction.amount)}
          </strong>
          <div class="transaction-actions">
            <button class="secondary-btn compact" type="button" data-edit="${transaction._id}">Edit</button>
            <button class="danger-btn compact" type="button" data-delete="${transaction._id}">Delete</button>
          </div>
        </article>
      `
    )
    .join('');
};

const resetTransactionForm = () => {
  $('transactionId').value = '';
  $('transactionTitle').value = '';
  $('transactionAmount').value = '';
  $('transactionType').value = 'expense';
  $('transactionDate').valueAsDate = new Date();
  $('paymentMethod').value = 'card';
  $('transactionNote').value = '';
  fillTransactionCategories();
  $('transactionSubmit').textContent = 'Save transaction';
  $('transactionFormTitle').textContent = 'New transaction';
};

const transactionPayload = () => ({
  title: $('transactionTitle').value.trim(),
  amount: Number($('transactionAmount').value),
  type: $('transactionType').value,
  date: $('transactionDate').value,
  paymentMethod: $('paymentMethod').value,
  note: $('transactionNote').value.trim(),
  category: $('transactionCategory').value
});

const validateTransaction = (payload) => {
  if (payload.title.length < 2) return 'Title is required';
  if (!payload.amount || payload.amount <= 0) return 'Amount must be greater than zero';
  if (!payload.date) return 'Date is required';
  if (!payload.category) return 'Category is required';
  return '';
};

$('showLogin').addEventListener('click', () => setAuthMode('login'));
$('showRegister').addEventListener('click', () => setAuthMode('register'));

$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;

  if (!validateEmail(email)) return showMessage('Enter a valid email address');
  if (!password) return showMessage('Password is required');

  try {
    saveSession(await api('/login', { method: 'POST', body: JSON.stringify({ email, password }) }));
    await renderShell();
  } catch (error) {
    showMessage(error.message);
  }
});

$('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    name: $('registerName').value.trim(),
    email: $('registerEmail').value.trim(),
    password: $('registerPassword').value,
    currency: $('registerCurrency').value,
    monthlyIncomeGoal: Number($('registerIncomeGoal').value || 0)
  };

  if (payload.name.length < 2) return showMessage('Name is required');
  if (!validateEmail(payload.email)) return showMessage('Enter a valid email address');
  if (!validatePassword(payload.password)) {
    return showMessage('Password must be 8+ characters with uppercase, lowercase and number');
  }

  try {
    saveSession(await api('/register', { method: 'POST', body: JSON.stringify(payload) }));
    await renderShell();
  } catch (error) {
    showMessage(error.message);
  }
});

$('logoutButton').addEventListener('click', () => {
  clearSession();
  renderShell();
});

$('themeToggle').addEventListener('click', () => {
  applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark');
});

$('transactionType').addEventListener('change', fillTransactionCategories);
$('resetTransactionForm').addEventListener('click', resetTransactionForm);

$('categoryForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = $('categoryName').value.trim();
  if (name.length < 2) return;

  await api('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name,
      type: $('categoryType').value,
      color: $('categoryColor').value,
      description: `${name} category`
    })
  });

  $('categoryName').value = '';
  await loadCategories();
});

$('budgetForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!$('budgetMonth').value || !$('budgetCategory').value) return;

  await api('/budgets', {
    method: 'POST',
    body: JSON.stringify({
      month: $('budgetMonth').value,
      limit: Number($('budgetLimit').value),
      alertPercent: Number($('budgetAlert').value),
      category: $('budgetCategory').value,
      notes: 'Monthly planned expense limit'
    })
  });

  $('budgetLimit').value = '';
  await loadBudgets();
});

$('transactionForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = transactionPayload();
  const message = validateTransaction(payload);
  if (message) {
    alert(message);
    return;
  }

  const id = $('transactionId').value;
  await api(id ? `/resource/${id}` : '/resource', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(payload)
  });

  resetTransactionForm();
  document.getElementById('modalOverlay').classList.add('hidden');
  await loadTransactions();
});

$('transactionList').addEventListener('click', async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const transaction = state.transactions.find((item) => item._id === editId);
    if (!transaction) return;

    $('transactionId').value = transaction._id;
    $('transactionTitle').value = transaction.title;
    $('transactionAmount').value = transaction.amount;
    $('transactionType').value = transaction.type;
    fillTransactionCategories();
    $('transactionCategory').value = transaction.category._id;
    $('transactionDate').value = transaction.date.slice(0, 10);
    $('paymentMethod').value = transaction.paymentMethod;
    $('transactionNote').value = transaction.note || '';
    $('transactionSubmit').textContent = 'Update transaction';
    $('transactionFormTitle').textContent = 'Edit transaction';
  }

  if (deleteId && confirm('Delete this transaction?')) {
    await api(`/resource/${deleteId}`, { method: 'DELETE' });
    await loadTransactions();
  }
});

$('searchInput').addEventListener('input', async (event) => {
  state.search = event.target.value.trim();
  state.page = 1;
  persistFilters();
  await loadTransactions();
});

$('typeFilter').addEventListener('change', async (event) => {
  state.type = event.target.value;
  state.page = 1;
  persistFilters();
  await loadTransactions();
});

$('methodFilter').addEventListener('change', async (event) => {
  state.method = event.target.value;
  state.page = 1;
  persistFilters();
  await loadTransactions();
});

$('limitSelect').addEventListener('change', async (event) => {
  state.limit = Number(event.target.value);
  state.page = 1;
  persistFilters();
  await loadTransactions();
});

$('prevPage').addEventListener('click', async () => {
  state.page -= 1;
  persistFilters();
  await loadTransactions();
});

$('nextPage').addEventListener('click', async () => {
  state.page += 1;
  persistFilters();
  await loadTransactions();
});

document.addEventListener('DOMContentLoaded', () => {
  $('searchInput').value = state.search;
  $('typeFilter').value = state.type;
  $('methodFilter').value = state.method;
  $('limitSelect').value = String(state.limit);
  $('budgetMonth').value = new Date().toISOString().slice(0, 7);
  applyTheme(localStorage.getItem('expenseTheme') || 'light');
  resetTransactionForm();
  renderShell().catch((error) => {
    clearSession();
    showMessage(error.message);
    renderShell();
  });
});

// ── PROFILE TAB FILL ─────────────────────────────
const fillProfileTab = (profile) => {
  const u = profile.user;
  const s = profile.stats;
  const $ = (id) => document.getElementById(id);
  const initial = (u.name || 'A')[0].toUpperCase();
  if ($('avatarCircle')) $('avatarCircle').textContent = initial;
  if ($('profileName'))  $('profileName').textContent  = u.name  || '—';
  if ($('profileEmail')) $('profileEmail').textContent = u.email || '—';
  if ($('infoName'))     $('infoName').textContent     = u.name  || '—';
  if ($('infoEmail'))    $('infoEmail').textContent    = u.email || '—';
  if ($('infoCurrency')) $('infoCurrency').textContent = u.currency || '—';
  if ($('infoGoal'))     $('infoGoal').textContent     = u.monthlyIncomeGoal ? money(u.monthlyIncomeGoal) : '—';
  if ($('infoCount'))    $('infoCount').textContent    = s.transactionCount  || '0';
  if ($('pBalance'))     $('pBalance').textContent     = money(s.balance);
  if ($('pIncome'))      $('pIncome').textContent      = money(s.income);
  if ($('pExpense'))     $('pExpense').textContent      = money(s.expenses);
};

// ── RECENT TRANSACTIONS (overview tab) ───────────
const renderRecent = (transactions) => {
  const el = document.getElementById('recentList');
  if (!el) return;
  const latest = transactions.slice(0, 5);
  if (!latest.length) {
    el.innerHTML = '<p class="empty-state">No transactions yet. Add your first one!</p>';
    return;
  }
  el.innerHTML = latest.map(t => `
    <article class="transaction-card">
      <div>
        <h4>${escapeHtml(t.title)}</h4>
        <div class="meta-row">
          <span class="badge">${new Date(t.date).toLocaleDateString()}</span>
          <span class="badge">${escapeHtml(t.category?.name || '')}</span>
        </div>
      </div>
      <strong class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}${money(t.amount)}</strong>
      <div></div>
    </article>`).join('');
};



// ── TAB SWITCHING & MODAL ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('tab-' + tab);
      if (panel) panel.classList.add('active');
      const label = document.getElementById('tabLabel');
      if (label) label.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
    });
  });

  // View all → Transactions
  document.querySelectorAll('[data-tab="transactions"]').forEach(el => {
    el.addEventListener('click', () => {
      const navBtn = document.querySelector('.nav-item[data-tab="transactions"]');
      if (navBtn) navBtn.click();
    });
  });

  // Modal open/close
  const overlay = document.getElementById('modalOverlay');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  if (openBtn) openBtn.addEventListener('click', () => overlay.classList.remove('hidden'));
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
});