/* -------------------------------------------------------------------------- */
/*  events.js – all DOM listeners & modal logic                               */
/* -------------------------------------------------------------------------- */
import { $, $$, settings, charts,formatCurrency } from './utils.js';
import { renderAll } from './render.js';
import { recentTransactionsData, assetsData } from './data.js';
import { getIconForCategory } from './helpers.js';
import {
  addTransaction as addTxToFirestore,
  updateTransaction as updateTxInFirestore,
  deleteTransaction as deleteTxFromFirestore,
  saveAsset
} from './firebaseSync.js';
import { applyLanguage } from './i18n.js';
import { applyCurrency } from './helpers.js';

document.getElementById('languageSelect').addEventListener('change', (e) => {
  const lang = e.target.value;
  applyLanguage(lang);
  localStorage.setItem('wallet360_language', lang);
});

document.getElementById('currencySelect').addEventListener('change', (e) => {
  const currency = e.target.value;
  applyCurrency(currency);
  localStorage.setItem('wallet360_currency', currency);
});
let editingTx = null;
let editingAsset = null;

/* -------------------------------------------------------------------------- */
/*  Attach every event listener once (called from main.js)                    */
/* -------------------------------------------------------------------------- */
export function registerEventHandlers() {
  /* ───── Language & Currency select ───── */
  $('#languageSelect').addEventListener('change', e => {
    settings.currentLang = e.target.value;
    document.documentElement.lang = settings.currentLang;
    renderAll();
  });
  $('#currencySelect').addEventListener('change', e => {
    settings.currentCurrency = e.target.value;
    renderAll();
  });

  /* ───── Dark-mode toggle ───── */
  $('#darkToggle').addEventListener('click', () => {
    settings.isDark = !settings.isDark;
    document.documentElement.classList.toggle('dark', settings.isDark);
    $('#darkToggle svg').setAttribute('data-lucide', settings.isDark ? 'sun' : 'moon');
    lucide.createIcons();
  });

  /* ───── Quick-action buttons (add tx) ───── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.quick-action-btn');
    if (btn) showTransactionModal(btn.querySelector('span').id);
  });

  /* ───── Row-click → edit transaction ───── */
document.addEventListener('click', e => {
  const deleteBtn = e.target.closest('.delete-tx-btn');
  if (deleteBtn) {
    e.stopPropagation();
    const txId = deleteBtn.dataset.id;
    if (txId) showDeleteConfirmation(txId);
    return;
  }

  const row = e.target.closest('tr[data-id]');
  if (row && row.closest('#transactionsBody')) {
    const tx = recentTransactionsData.find(t => t.id == row.dataset.id);
    if (tx) showTransactionModal('edit', tx);
  }
});


  /* ───── Edit asset button on each card ───── */
  $('#assetsList').addEventListener('click', e => {
    const btn = e.target.closest('.edit-asset-btn');
    if (!btn) return;
    const asset = assetsData.find(a => a.id == btn.dataset.id);
    if (asset) showAssetModal(asset);
  });

  /* ───── Transaction modal: close / cancel ───── */
  $('#closeModal').addEventListener('click', closeTxModal);
  $('#cancelTransaction').addEventListener('click', closeTxModal);
  $('#transactionModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTxModal();
  });

  /* ───── Asset modal: close / cancel ───── */
  $('#closeAssetModal').addEventListener('click', closeAssetModal);
  $('#cancelAsset').addEventListener('click', closeAssetModal);
  $('#assetModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAssetModal();
  });

  /* ───── Delete confirmation modal ───── */
  $('#confirmDelete').addEventListener('click', confirmDeleteTransaction);
  $('#cancelDelete').addEventListener('click', closeDeleteModal);
  $('#deleteModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDeleteModal();
  });

  /* ───── Form submits ───── */
  $('#transactionForm').addEventListener('submit', saveTransaction);
  $('#assetForm').addEventListener('submit', saveAssetForm);

  /* ───── Search / filter ───── */
  $('#searchTransactions').addEventListener('input', filterTransactions);
  $('#filterTransactions').addEventListener('change', filterTransactions);

  /* ───── Window resize → refresh charts ───── */
  window.addEventListener('resize', () => {
    Object.values(charts).forEach(c => c.resize());
  });
}

/* ========================================================================== */
/*  Transaction modal helpers                                                 */
/* ========================================================================== */
import { t } from './i18n.js';

export function showTransactionModal(action, tx = null) {
  const m     = $('#transactionModal');
  const title = $('#modalTitle');
  const tSel  = $('#transactionType');

  if (tx) {
    editingTx = tx;
    // usa a chave traduzível
    title.textContent = t('modal.editTransaction');
    tSel.value = tx.type;
    $('#transactionAmount').value      = tx.amount;
    $('#transactionCategory').value    = tx.category;
    $('#transactionDescription').value = tx.description;
    $('#transactionDate').value        = tx.date;
  } else {
    editingTx = null;
    title.textContent = t('modal.addTransaction');
    $('#transactionForm').reset();
    tSel.value =
      action === 'addIncome'  ? 'income' :
      action === 'addExpense' ? 'expense' :
                                'investment';
    $('#transactionDate').value = new Date().toISOString().split('T')[0];
  }

  m.classList.remove('hidden');
}

function closeTxModal() {
  $('#transactionModal').classList.add('hidden');
  editingTx = null;
}

async function saveTransaction(e) {
  e.preventDefault();
  showLoading();

  const formData = {
    type: $('#transactionType').value,
    amount: parseFloat($('#transactionAmount').value),
    category: $('#transactionCategory').value,
    description: $('#transactionDescription').value,
    date: $('#transactionDate').value
  };

  try {
    if (editingTx) {
      const updated = { ...editingTx, ...formData, icon: getIconForCategory(formData.category) };
      await updateTxInFirestore(updated);
    } else {
      const newTx = { ...formData, icon: getIconForCategory(formData.category) };
      await addTxToFirestore(newTx);
    }
    closeTxModal();
    $('#transactionForm').reset();
    renderAll();
  } catch (err) {
    console.error('Erro ao guardar transação:', err);
  } finally {
    hideLoading();
  }
}


/* ========================================================================== */
/*  Delete transaction functionality                                          */
/* ========================================================================== */
let deletingTxId = null;

function showDeleteConfirmation(txId) {
  const tx = recentTransactionsData.find(t => t.id == txId);
  if (!tx) return;

  deletingTxId = txId;
  $('#deleteTransactionDescription').textContent = tx.description;
  $('#deleteTransactionAmount').textContent = `${tx.amount} ${settings.currentCurrency}`;
  $('#deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
  $('#deleteModal').classList.add('hidden');
  deletingTxId = null;
}

async function confirmDeleteTransaction() {
  if (!deletingTxId) return;
  showLoading();

  try {
    await deleteTxFromFirestore(deletingTxId);

    const idx = recentTransactionsData.findIndex(t => t.id === deletingTxId);
    if (idx > -1) recentTransactionsData.splice(idx, 1);

    closeDeleteModal();
    renderAll();
  } catch (error) {
    console.error('Erro ao eliminar transação:', error);
  } finally {
    hideLoading();
  }
}

function showLoading() {
  $('#loadingOverlay')?.classList.remove('hidden');
}
function hideLoading() {
  $('#loadingOverlay')?.classList.add('hidden');
}

/* ========================================================================== */
/*  Asset modal helpers                                                       */
/* ========================================================================== */
function showAssetModal(asset = null) {
  const m = $('#assetModal');
  editingAsset = asset;
  $('#assetModalTitle').textContent = asset ? 'Edit Asset' : 'Add Asset';

  if (asset) {
    $('#assetName').value   = asset.name;
    $('#assetType').value   = asset.type;
    $('#assetSector').value = asset.sector;
    $('#assetQty').value    = asset.quantity;
    $('#assetPrice').value  = asset.priceUSD;
    $('#assetRisk').value   = asset.risk;
  } else {
    $('#assetForm').reset();
  }
  m.classList.remove('hidden');
}
function closeAssetModal() {
  $('#assetModal').classList.add('hidden');
  editingAsset = null;
}

async function saveAssetForm(e) {
  e.preventDefault();
  showLoading();

  const form = {
    name: $('#assetName').value.trim(),
    type: $('#assetType').value,
    sector: $('#assetSector').value.trim(),
    quantity: parseFloat($('#assetQty').value),
    priceUSD: parseFloat($('#assetPrice').value),
    risk: $('#assetRisk').value,
    change: 0
  };

  try {
    if (editingAsset) {
      await saveAsset({ ...editingAsset, ...form });
    } else {
      await saveAsset(form);
    }
    closeAssetModal();
    renderAll();
  } catch (err) {
    console.error('Erro ao guardar ativo:', err);
  } finally {
    hideLoading();
  }
}


/* ========================================================================== */
/*  Simple search / filter for transactions table                             */
/* ========================================================================== */
function filterTransactions(){
  const search=document.getElementById('searchTransactions').value.trim().toLowerCase();
  const filterSelect=document.getElementById('filterTransactions');
  const filterKey=filterSelect.value;
  const filterText=filterKey==='all'
    ? null
    : filterSelect.options[filterSelect.selectedIndex].text.trim().toLowerCase();
  document.querySelectorAll('#transactionsBody tr').forEach(row=>{
    const desc=row.cells[3].textContent.trim().toLowerCase();
    const typeText=row.cells[1].textContent.trim().toLowerCase();
    const matchesSearch=desc.includes(search);
    const matchesFilter=filterKey==='all'
      ? true
      : typeText===filterText;
    row.style.display=(matchesSearch&&matchesFilter)?'':'none';
  });
}


