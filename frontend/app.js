const API_BASE = 'https://expense-tracker-java.anikasen2006.replit.app';

const CATEGORY_EMOJI = {
    'Food':          '🍔',
    'Transport':     '🚗',
    'Shopping':      '🛍️',
    'Health':        '💊',
    'Entertainment': '🎬',
    'Education':     '📚',
    'Utilities':     '💡',
    'Travel':        '✈️',
    'Other':         '📦',
};

let allExpenses = [];
let filteredExpenses = [];
let pendingDeleteId = null;

const api = {

    async fetchAll() {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('Failed to fetch expenses');
        return res.json();
    },

    async addExpense(data) {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw json;
        return json;
    },

    async deleteExpense(id) {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete expense');
        return res.json();
    },
};

function formatINR(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function isThisMonth(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const now  = new Date();
    return date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast--${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function setLoading(visible) {
    document.getElementById('loadingState').style.display = visible ? 'block' : 'none';
}

function updateStats(expenses) {
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    document.getElementById('totalAmount').textContent = formatINR(total);
    document.getElementById('totalCount').textContent  = `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`;

    const monthExpenses = expenses.filter(e => isThisMonth(e.date));
    const monthTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    document.getElementById('monthAmount').textContent = formatINR(monthTotal);
    document.getElementById('monthCount').textContent  = `${monthExpenses.length} this month`;

    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        document.getElementById('topCategory').textContent      = topCategory[0];
        document.getElementById('topCategoryAmount').textContent = formatINR(topCategory[1]);
    } else {
        document.getElementById('topCategory').textContent      = '—';
        document.getElementById('topCategoryAmount').textContent = '₹0.00';
    }

    updateCategoryBreakdown(categoryTotals, total);
}

function updateCategoryBreakdown(categoryTotals, grandTotal) {
    const container = document.getElementById('categoryBreakdown');
    const entries   = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    if (!entries.length) {
        container.innerHTML = '<div class="empty-breakdown">No data yet</div>';
        return;
    }

    container.innerHTML = entries.map(([cat, amount]) => {
        const pct = grandTotal ? (amount / grandTotal) * 100 : 0;
        return `
            <div class="breakdown-item">
                <div class="breakdown-row">
                    <span class="breakdown-name">${CATEGORY_EMOJI[cat] || '📦'} ${cat}</span>
                    <span class="breakdown-amount">${formatINR(amount)}</span>
                </div>
                <div class="breakdown-bar-track">
                    <div class="breakdown-bar-fill" style="width: ${pct.toFixed(1)}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function populateCategoryFilter(expenses) {
    const categories  = [...new Set(expenses.map(e => e.category))].sort();
    const filterEl    = document.getElementById('filterCategory');
    const currentVal  = filterEl.value;

    filterEl.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => `<option value="${c}"${c === currentVal ? ' selected' : ''}>${CATEGORY_EMOJI[c] || '📦'} ${c}</option>`).join('');
}

function renderExpenses(expenses) {
    const list     = document.getElementById('expenseList');
    const empty    = document.getElementById('emptyState');

    if (!expenses.length) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = expenses.map(expense => createCardHTML(expense)).join('');
}

function createCardHTML(expense) {
    const emoji  = CATEGORY_EMOJI[expense.category] || '📦';
    const catCls = expense.category.replace(/\s+/g, '');

    return `
        <div class="expense-card" data-id="${expense.id}" id="card-${expense.id}">
            <div class="card-icon">${emoji}</div>
            <div class="card-body">
                <div class="card-title">${escapeHTML(expense.title)}</div>
                <div class="card-meta">
                    <span class="dot dot--${catCls}"></span>
                    <span class="card-category">${escapeHTML(expense.category)}</span>
                    <span class="card-date">${formatDate(expense.date)}</span>
                </div>
            </div>
            <div class="card-right">
                <span class="card-amount">${formatINR(expense.amount)}</span>
                <button class="btn-delete" onclick="confirmDelete(${expense.id})" title="Delete expense">✕</button>
            </div>
        </div>
    `;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadExpenses() {
    setLoading(true);
    document.getElementById('emptyState').style.display = 'none';

    try {
        allExpenses = await api.fetchAll();
        applyFilter();
        updateStats(allExpenses);
        populateCategoryFilter(allExpenses);
    } catch (err) {
        console.error('Load error:', err);
        showToast('Could not connect to backend. Is Spring Boot running?', 'error');
        document.getElementById('emptyState').style.display = 'block';
    } finally {
        setLoading(false);
    }
}

function applyFilter() {
    const category  = document.getElementById('filterCategory').value;
    const clearBtn  = document.getElementById('clearFilter');

    filteredExpenses = category
        ? allExpenses.filter(e => e.category === category)
        : [...allExpenses];

    clearBtn.style.display = category ? 'inline-block' : 'none';
    renderExpenses(filteredExpenses);
}

function clearFieldErrors() {
    ['title', 'amount', 'category', 'date'].forEach(field => {
        document.getElementById(`${field}Error`).textContent = '';
        document.getElementById(field).classList.remove('field-input--error');
    });
}

function showFieldError(field, message) {
    document.getElementById(`${field}Error`).textContent = message;
    document.getElementById(field).style.borderColor = 'var(--red)';
}

function validateForm(title, amount, category, date) {
    let valid = true;

    if (!title.trim() || title.trim().length < 2) {
        showFieldError('title', 'Title must be at least 2 characters');
        valid = false;
    }
    if (!amount || parseFloat(amount) <= 0) {
        showFieldError('amount', 'Enter a valid amount greater than 0');
        valid = false;
    }
    if (!category) {
        showFieldError('category', 'Please select a category');
        valid = false;
    }
    if (!date) {
        showFieldError('date', 'Please select a date');
        valid = false;
    }

    return valid;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    clearFieldErrors();

    const title    = document.getElementById('title').value;
    const amount   = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date     = document.getElementById('date').value;

    if (!validateForm(title, amount, category, date)) return;

    const submitBtn      = document.getElementById('submitBtn');
    const formFeedback   = document.getElementById('formFeedback');

    submitBtn.disabled       = true;
    submitBtn.querySelector('.btn-text').textContent = 'Adding…';
    formFeedback.textContent = '';

    try {
        await api.addExpense({ title, amount: parseFloat(amount), category, date });

        document.getElementById('expenseForm').reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];

        formFeedback.textContent  = '✓ Expense added!';
        formFeedback.className    = 'form-feedback success';

        showToast('Expense added successfully ✓', 'success');

        await loadExpenses();

    } catch (err) {
        console.error('Add error:', err);

        if (typeof err === 'object' && !err.error) {
            Object.entries(err).forEach(([field, msg]) => {
                if (['title', 'amount', 'category', 'date'].includes(field)) {
                    showFieldError(field, msg);
                }
            });
        } else {
            formFeedback.textContent = err.error || 'Failed to add expense. Try again.';
            formFeedback.className   = 'form-feedback error';
        }

    } finally {
        submitBtn.disabled      = false;
        submitBtn.querySelector('.btn-text').textContent = 'Add Expense';
        setTimeout(() => { formFeedback.textContent = ''; }, 4000);
    }
}

function confirmDelete(id) {
    pendingDeleteId = id;
    document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
    pendingDeleteId = null;
    document.getElementById('modalOverlay').style.display = 'none';
}

async function handleDeleteConfirm() {
    if (!pendingDeleteId) return;

    const id   = pendingDeleteId;
    const card = document.getElementById(`card-${id}`);

    closeModal();

    if (card) card.classList.add('removing');

    try {
        await api.deleteExpense(id);
        showToast('Expense deleted', 'success');
        await loadExpenses();
    } catch (err) {
        console.error('Delete error:', err);
        if (card) card.classList.remove('removing');
        showToast('Failed to delete expense', 'error');
    }
}

function setCurrentDate() {
    const now = new Date();
    document.getElementById('currentDate').textContent =
        now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    document.getElementById('date').value = now.toISOString().split('T')[0];
}

document.getElementById('expenseForm').addEventListener('submit', handleFormSubmit);

document.getElementById('filterCategory').addEventListener('change', applyFilter);

document.getElementById('clearFilter').addEventListener('click', () => {
    document.getElementById('filterCategory').value = '';
    applyFilter();
});

document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('modalConfirm').addEventListener('click', handleDeleteConfirm);

document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

['title', 'amount', 'category', 'date'].forEach(id => {
    document.getElementById(id).addEventListener('focus', () => {
        document.getElementById(id).style.borderColor = '';
        document.getElementById(`${id}Error`).textContent = '';
    });
});

function init() {
    setCurrentDate();
    loadExpenses();
}

init();
