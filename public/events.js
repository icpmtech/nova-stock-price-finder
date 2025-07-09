/* src/events.js */
import { $, $$, settings, charts } from './utils.js';
import { renderAll } from './render.js';
import { getIconForCategory } from './helpers.js';
import {
  addTransaction as addTxToFirestore    // ⬅ NEW
} from './firebaseSync.js';

/* ------------------------------------------------------------------------ */
/* Register all UI event listeners                                         */
/* ------------------------------------------------------------------------ */
export function registerEventHandlers() {
  /* -------- Language switch ---------- */
  $('#languageSelect').addEventListener('change', e => {
    settings.currentLang = e.target.value;
    document.documentElement.lang = settings.currentLang;
    renderAll();
  });

  /* -------- Currency switch ---------- */
  $('#currencySelect').addEventListener('change', e => {
    settings.currentCurrency = e.target.value;
    renderAll();
  });

  /* -------- Dark-mode toggle --------- */
  $('#darkToggle').addEventListener('click', () => {
    settings.isDark = !settings.isDark;
    document.documentElement.classList.toggle('dark', settings.isDark);
    const icon = $('#darkToggle svg');
    icon.setAttribute('data-lucide', settings.isDark ? 'sun' : 'moon');
    lucide.createIcons();
  });

  /* -------- Quick-action buttons ----- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.quick-action-btn');
    if (!btn) return;
    showTransactionModal(btn.querySelector('span').id);
  });

  /* -------- Modal close -------------- */
  $('#closeModal').addEventListener('click', closeModal);
  $('#cancelTransaction').addEventListener('click', closeModal);
  $('#transactionModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  /* -------- Transaction form --------- */
  $('#transactionForm').addEventListener('submit', saveTransaction);

  /* -------- Search / filter ---------- */
  $('#searchTransactions').addEventListener('input', filterTransactions);
  $('#filterTransactions').addEventListener('change', filterTransactions);

  /* -------- Resize => chart.refresh --- */
  window.addEventListener('resize', () => {
    Object.values(charts).forEach(c => c.resize());
  });
}

/* ------------------------------------------------------------------------ */
/* Modal helpers                                                            */
/* ------------------------------------------------------------------------ */
function showTransactionModal(action) {
  const modal      = $('#transactionModal');
  const typeSelect = $('#transactionType');

  typeSelect.value =
    action === 'addIncome'     ? 'income'     :
    action === 'addExpense'    ? 'expense'    :
    action === 'addInvestment' ? 'investment' : 'expense';

  $('#transactionDate').value = new Date().toISOString().split('T')[0];
  modal.classList.remove('hidden');
}

function closeModal() {
  $('#transactionModal').classList.add('hidden');
}

/* ------------------------------------------------------------------------ */
/* Persist a new transaction to Firestore & local cache                     */
/* ------------------------------------------------------------------------ */
async function saveTransaction(e) {
  e.preventDefault();

  const formData = {
    type:        $('#transactionType').value,
    amount:      parseFloat($('#transactionAmount').value),
    category:    $('#transactionCategory').value,
    description: $('#transactionDescription').value,
    date:        $('#transactionDate').value
  };

  const tx = {
    ...formData,
    icon: getIconForCategory(formData.category)
  };

  await addTxToFirestore(tx);   // ⬅ writes to Firestore & re-renders
  closeModal();
  $('#transactionForm').reset();
}

/* ------------------------------------------------------------------------ */
/* Table search / filter                                                    */
/* ------------------------------------------------------------------------ */
function filterTransactions() {
  const term   = $('#searchTransactions').value.toLowerCase();
  const filter = $('#filterTransactions').value;

  Array.from($('#transactionsBody').rows).forEach(row => {
    const description = row.cells[3].textContent.toLowerCase();
    const type        = row.cells[1].textContent.toLowerCase();
    row.style.display =
      description.includes(term) && (filter === 'all' || type.includes(filter))
        ? ''
        : 'none';
  });
}
