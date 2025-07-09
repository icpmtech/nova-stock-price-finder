import { $, $$, settings } from './utils.js';
import { renderAll } from './render.js';
import { recentTransactionsData } from './data.js';
import { getIconForCategory } from './helpers.js';

/* -------------------------------------------------------------------------- */
/* Register all UI event listeners                                            */
/* -------------------------------------------------------------------------- */
export function registerEventHandlers() {
  /* ---------------- Language ---------------- */
  $('#languageSelect').addEventListener('change', e => {
    settings.currentLang = e.target.value;
    document.documentElement.lang = settings.currentLang;
    renderAll();
  });

  /* ---------------- Currency ---------------- */
  $('#currencySelect').addEventListener('change', e => {
    settings.currentCurrency = e.target.value;
    renderAll();
  });

  /* ---------------- Dark mode toggle -------- */
  $('#darkToggle').addEventListener('click', () => {
    settings.isDark = !settings.isDark;
    document.documentElement.classList.toggle('dark', settings.isDark);
    const icon = $('#darkToggle svg');
    icon.setAttribute('data-lucide', settings.isDark ? 'sun' : 'moon');
    lucide.createIcons();
  });

  /* ---------------- Quick-action buttons ---- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.quick-action-btn');
    if (!btn) return;
    const action = btn.querySelector('span').id;
    showTransactionModal(action);
  });

  /* ---------------- Modal close ------------- */
  $('#closeModal').addEventListener('click', closeModal);
  $('#cancelTransaction').addEventListener('click', closeModal);
  $('#transactionModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

  /* ---------------- Transaction form -------- */
  $('#transactionForm').addEventListener('submit', saveTransaction);

  /* ---------------- Search/filter ----------- */
  $('#searchTransactions').addEventListener('input', filterTransactions);
  $('#filterTransactions').addEventListener('change', filterTransactions);

  /* ---------------- Window resize ----------- */
  window.addEventListener('resize', () => { Object.values(charts).forEach(c => c.resize()); });
}

/* -------------------------------------------------------------------------- */
/* Modal helpers                                                              */
/* -------------------------------------------------------------------------- */
function showTransactionModal(action) {
  const modal = $('#transactionModal');
  const typeSelect = $('#transactionType');

  if      (action === 'addIncome')     typeSelect.value = 'income';
  else if (action === 'addExpense')    typeSelect.value = 'expense';
  else if (action === 'addInvestment') typeSelect.value = 'investment';

  $('#transactionDate').value = new Date().toISOString().split('T')[0];
  modal.classList.remove('hidden');
}

function closeModal() {
  $('#transactionModal').classList.add('hidden');
}

/* -------------------------------------------------------------------------- */
/* Save a new transaction (mock)                                              */
/* -------------------------------------------------------------------------- */
function saveTransaction(e) {
  e.preventDefault();
  const formData = {
    type:       $('#transactionType').value,
    amount:     parseFloat($('#transactionAmount').value),
    category:   $('#transactionCategory').value,
    description:$('#transactionDescription').value,
    date:       $('#transactionDate').value
  };

  const newTx = { id: Date.now(), ...formData, icon: getIconForCategory(formData.category) };
  recentTransactionsData.unshift(newTx);

  renderAll();              // re-renders everything that depends on transactions
  closeModal();
  $('#transactionForm').reset();
}

/* -------------------------------------------------------------------------- */
/* Table search / filter                                                      */
/* -------------------------------------------------------------------------- */
function filterTransactions() {
  const term   = $('#searchTransactions').value.toLowerCase();
  const filter = $('#filterTransactions').value;

  Array.from($('#transactionsBody').rows).forEach(row => {
    const description = row.cells[3].textContent.toLowerCase();
    const type        = row.cells[1].textContent.toLowerCase();
    const matches = description.includes(term) && (filter === 'all' || type.includes(filter));
    row.style.display = matches ? '' : 'none';
  });
}
