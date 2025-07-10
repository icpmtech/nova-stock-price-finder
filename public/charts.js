/* -------------------------------------------------------------------------- */
/*  charts.js – dynamic Chart.js builders driven by transactions              */
/* -------------------------------------------------------------------------- */
import { charts, destroyChart, formatCurrency } from './utils.js';
import { recentTransactionsData, exchangeRates } from './data.js';
import { settings } from './utils.js';
import { walletData } from './data.js';
/* helper: YYYY-MM key ------------------------------------------------------ */
const monthKey = d => d.slice(0, 7);   // "2025-07"

/* ========================================================================== */
/* 1. Portfolio line chart  – Net Balance, Investments, Expenses             */
/* ========================================================================== */
export function renderPortfolioChart(ctx) {
  if (!recentTransactionsData.length) return;
  destroyChart('portfolio');

  const sorted = [...recentTransactionsData]
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels    = [];
  const netVals   = [];
  const investVals= [];
  const expVals   = [];

  let net   = 0;
  let invest= 0;
  let exp   = 0;

  sorted.forEach(tx => {
    if (tx.type === 'income')      net +=  tx.amount;
    else if (tx.type === 'expense'){ net -= tx.amount; exp += tx.amount; }
    else if (tx.type === 'investment') {
      net += tx.amount; invest += tx.amount;
    }

    labels.push(new Date(tx.date).toLocaleDateString());
    netVals.push(   net    * exchangeRates[settings.currentCurrency]);
    investVals.push(invest * exchangeRates[settings.currentCurrency]);
    expVals.push(   exp    * exchangeRates[settings.currentCurrency]);
  });

  charts.portfolio = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Net Balance',
          data: netVals,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Investments',
          data: investVals,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: expVals,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } } },
      scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
    }
  });
}

/* ======================================================================= */
/* 2. Monthly Income vs Expenses bar chart (continuous timeline)           */
/* ======================================================================= */
export function renderIncomeExpensesChart(ctx) {
  if (!recentTransactionsData.length) return;
  destroyChart('incomeExpenses');

  /* ---------- 1. Bucket by YYYY-MM ------------------------------------ */
  const bucket = {};
  recentTransactionsData.forEach(tx => {
    const key = tx.date?.slice(0, 7);                  // "2025-07"
    bucket[key] ??= { income: 0, expense: 0, investment: 0 };
    bucket[key][tx.type] += tx.amount;
  });

  /* ---------- 2. Build continuous month list -------------------------- */
  const allKeys = Object.keys(bucket).sort();         // ASC
  const months  = [];
  if (allKeys.length) {
    const [y0, m0] = allKeys[0].split('-').map(Number);
    const [y1, m1] = allKeys.at(-1).split('-').map(Number);
    const start = new Date(y0, m0 - 1, 1);
    const end   = new Date(y1, m1 - 1, 1);

    for (let d = start; d <= end; d.setMonth(d.getMonth() + 1)) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(k);
      bucket[k] ??= { income: 0, expense: 0, investment: 0 }; // ensure zero bucket
    }
  }

  /* ---------- 3. Prepare datasets ------------------------------------- */
  const income = months.map(k => bucket[k].income  * exchangeRates[settings.currentCurrency]);
  const exp    = months.map(k => bucket[k].expense * exchangeRates[settings.currentCurrency]);

  /* ---------- 4. Build chart ------------------------------------------ */
  charts.incomeExpenses = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(k => k.slice(5)),           // "07","08",…
      datasets: [
        { label: 'Income',   data: income, backgroundColor: 'rgba(16,185,129,0.8)', borderColor: '#10b981', borderWidth: 1 },
        { label: 'Expenses', data: exp,    backgroundColor: 'rgba(239,68,68,0.8)', borderColor: '#ef4444', borderWidth: 1 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => formatCurrency(v) } } }
    }
  });
}


/* ========================================================================== */
/* 3. Spending-by-Category doughnut (all-time, all categories)                */
/* ========================================================================== */
export function renderCategoryChart(ctx) {
  if (!recentTransactionsData.length && !walletData.spendingCategories) return;
  destroyChart('category');

  /* ----- start with every known category (value 0) ---------------------- */
  const catTotals = { ...(walletData.spendingCategories ?? {}) };
  Object.keys(catTotals).forEach(k => catTotals[k] = 0);     // reset to 0

  /* ----- accumulate every expense transaction --------------------------- */
  recentTransactionsData
    .filter(tx => tx.type === 'expense')
    .forEach(tx => { catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount; });

  /* ----- include categories that appeared only in transactions ---------- */
  const cats   = Object.keys(catTotals);
  const values = cats.map(c => catTotals[c] * exchangeRates[settings.currentCurrency]);

  if (!cats.length) return;   // nothing to draw

  charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: cats,
      datasets: [{
        data: values,
        backgroundColor: [
          '#ef4444','#f59e0b','#8b5cf6','#06b6d4',
          '#84cc16','#ec4899','#6366f1','#10b981',
          '#a855f7','#14b8a6','#f87171','#eab308'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${formatCurrency(ctx.raw)}` } }
      }
    }
  });
}

