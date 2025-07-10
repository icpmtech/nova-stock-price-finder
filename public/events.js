
/* -------------------------------------------------------------------------- */
/*  events.js – all DOM listeners & modal logic                               */
/* -------------------------------------------------------------------------- */
import { $, $$, settings, charts } from './utils.js';
import { renderAll } from './render.js';
import { recentTransactionsData, assetsData } from './data.js';
import { getIconForCategory } from './helpers.js';
import {
  addTransaction as addTxToFirestore,
  updateTransaction as updateTxInFirestore,
  saveAsset
} from './firebaseSync.js';

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
  $('#transactionsBody').addEventListener('click', e => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const tx = recentTransactionsData.find(t => t.id == row.dataset.id);
    if (tx) showTransactionModal('edit', tx);
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
function showTransactionModal(action, tx = null) {
  const m = $('#transactionModal');
  const title = $('#modalTitle');
  const tSel = $('#transactionType');

  if (tx) {
    editingTx = tx;
    title.textContent = 'Edit Transaction';
    tSel.value = tx.type;
    $('#transactionAmount').value = tx.amount;
    $('#transactionCategory').value = tx.category;
    $('#transactionDescription').value = tx.description;
    $('#transactionDate').value = tx.date;
  } else {
    editingTx = null;
    title.textContent = 'Add Transaction';
    $('#transactionForm').reset();
    tSel.value =
      action === 'addIncome' ? 'income' :
      action === 'addExpense' ? 'expense' : 'investment';
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
  const formData = {
    type: $('#transactionType').value,
    amount: parseFloat($('#transactionAmount').value),
    category: $('#transactionCategory').value,
    description: $('#transactionDescription').value,
    date: $('#transactionDate').value
  };

  if (editingTx) {
    const updated = { ...editingTx, ...formData, icon: getIconForCategory(formData.category) };
    await updateTxInFirestore(updated);
  } else {
    const newTx = { ...formData, icon: getIconForCategory(formData.category) };
    await addTxToFirestore(newTx);
  }
  closeTxModal();
  $('#transactionForm').reset();
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
  const form = {
    name: $('#assetName').value.trim(),
    type: $('#assetType').value,
    sector: $('#assetSector').value.trim(),
    quantity: parseFloat($('#assetQty').value),
    priceUSD: parseFloat($('#assetPrice').value),
    risk: $('#assetRisk').value,
    change: 0
  };

  if (editingAsset) {
    await saveAsset({ ...editingAsset, ...form });
  } else {
    await saveAsset(form);
  }
  closeAssetModal();
}

/* ========================================================================== */
/*  Simple search / filter for transactions table                             */
/* ========================================================================== */
function filterTransactions() {
  const search = $('#searchTransactions').value.toLowerCase();
  const filter = $('#filterTransactions').value;

  $$('#transactionsBody tr').forEach(row => {
    const desc = row.cells[3].textContent.toLowerCase();
    const type = row.cells[1].textContent.toLowerCase();
    row.style.display =
      desc.includes(search) && (filter === 'all' || type.includes(filter)) ? '' : 'none';
  });
}
