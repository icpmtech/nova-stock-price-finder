import { $, formatCurrency, translate } from './utils.js';
import {
  walletData,
  budgets as budgetsCache,
  goals   as goalsCache,
  assetsData,
  recentTransactionsData
} from './data.js';

import {
  renderPortfolioChart,
  renderIncomeExpensesChart,
  renderCategoryChart
} from './charts.js';

export function renderSummaryCards() {
  const wrap = $('#summaryCards');
  wrap.innerHTML = '';

  const monthBuckets = {};
  recentTransactionsData.forEach(tx => {
    const key = tx.date?.slice(0, 7);
    (monthBuckets[key] ??= { income: 0, expense: 0, investment: 0 })[tx.type] += tx.amount;
  });

  const now     = new Date();
  const curKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

  const cur  = monthBuckets[curKey]  ?? { income: 0, expense: 0, investment: 0 };
  const prev = monthBuckets[prevKey] ?? { income: 0, expense: 0, investment: 0 };

  const cum = recentTransactionsData.reduce(
    (acc, tx) => {
      acc[tx.type] += tx.amount;
      acc.net       = acc.income - acc.expense + acc.investment;
      return acc;
    },
    { income: 0, expense: 0, investment: 0, net: 0 }
  );

  const pct = (now, before) => (before ? ((now - before) / before) * 100 : 0);
  const fmt = v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
  const cls = v => (v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-gray-500');

  const cards = [
    {
      title: 'Net Balance',
      value: formatCurrency(cum.net),
      icon: 'wallet',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: pct(cum.net, cum.net - (cur.income - cur.expense + cur.investment))
    },
    {
      title: 'Investments (all time)',
      value: formatCurrency(cum.investment),
      icon: 'trending-up',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      change: pct(cur.investment, prev.investment)
    },
    {
      title: 'Income (this month)',
      value: formatCurrency(cur.income),
      icon: 'arrow-up',
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      change: pct(cur.income, prev.income)
    },
    {
      title: 'Expenses (this month)',
      value: formatCurrency(cur.expense),
      icon: 'arrow-down',
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      change: pct(cur.expense, prev.expense)
    },
    {
      title: 'Income Δ vs last month',
      value: fmt(pct(cur.income, prev.income)),
      icon: 'activity',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      rawChange: pct(cur.income, prev.income)
    },
    {
      title: 'Expense Δ vs last month',
      value: fmt(pct(cur.expense, prev.expense)),
      icon: 'trending-down',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      rawChange: pct(cur.expense, prev.expense)
    }
  ];

  cards.forEach(card => {
    const changeVal = card.rawChange ?? card.change;
    const el = document.createElement('div');
    el.className =
      'bg-card dark:bg-cardDark rounded-2xl shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:scale-105';
    el.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="${card.color} p-2 rounded-xl">
          <i data-lucide="${card.icon}" class="w-4 h-4 text-white"></i>
        </div>
        <span class="text-xs font-medium ${cls(changeVal)}">${fmt(changeVal)}</span>
      </div>
      <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">${card.title}</p>
      <p class="text-lg font-bold">${card.value}</p>
    `;
    wrap.appendChild(el);
  });
}

export function renderBudgetProgress() {
  const wrap = $('#budgetList');
  wrap.innerHTML = '';

  const list = walletData.budgets ?? budgetsCache ?? [];
  if (!list.length) return;

  const monthKey = new Date().toISOString().slice(0, 7);

  list.forEach(budget => {
    const spent = recentTransactionsData
      .filter(
        tx =>
          tx.type === 'expense' &&
          tx.date.startsWith(monthKey) &&
          (tx.category === budget.category ||
            tx.category === budget.category.toLowerCase().replace(/ & | /g, ''))
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const pct = (spent / budget.budget) * 100;
    const left = budget.budget - spent;

    const bar = document.createElement('div');
    bar.className = 'space-y-2';
    bar.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium">${budget.category}</span>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          ${formatCurrency(spent)} / ${formatCurrency(budget.budget)}
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill"
             style="width:${Math.min(pct, 100)}%;background-color:${budget.color}"></div>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="${pct > 90 ? 'text-danger' : pct > 70 ? 'text-warning' : 'text-success'}">
          ${pct.toFixed(1)}% used
        </span>
        <span class="text-gray-500">${formatCurrency(left)} left</span>
      </div>
    `;
    wrap.appendChild(bar);
  });
}

export function renderFinancialGoals() {
  const wrap = $('#goalsList');
  wrap.innerHTML = '';

  const list = walletData.goals ?? goalsCache ?? [];
  if (!list.length) return;

  const slug = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  list.forEach(goal => {
    const contrib = recentTransactionsData
      .filter(tx => tx.type === 'investment' && slug(tx.category) === slug(goal.name))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const current = (goal.current || 0) + contrib;
    const pct = (current / goal.target) * 100;

    const row = document.createElement('div');
    row.className = 'space-y-2';
    row.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium">${goal.name}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          ${new Date(goal.deadline).toLocaleDateString()}
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div class="h-full transition-all duration-500"
             style="width:${Math.min(pct, 100)}%;background-color:${goal.color}"></div>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-gray-600 dark:text-gray-400">
          ${formatCurrency(current)} / ${formatCurrency(goal.target)}
        </span>
        <span class="font-medium ${pct >= 100 ? 'text-success' : 'text-primary'}">
          ${pct.toFixed(1)}%
        </span>
      </div>
    `;
    wrap.appendChild(row);
  });
}

export function renderRecentTransactions() {
  const wrap = $('#transactionsList');
  wrap.innerHTML = '';

  recentTransactionsData.slice(0, 5).forEach(tx => {
    const iconC =
      tx.type === 'income'
        ? 'text-success'
        : tx.type === 'expense'
        ? 'text-danger'
        : 'text-primary';
    const el = document.createElement('div');
    el.className =
      'flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
    el.innerHTML = `
      <div class="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
        <i data-lucide="${tx.icon}" class="w-4 h-4 ${iconC}"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">${tx.description}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">${new Date(tx.date).toLocaleDateString()}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-medium ${tx.type === 'income' ? 'text-success' : 'text-danger'}">
          ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">${tx.category}</p>
      </div>
    `;
    wrap.appendChild(el);
  });
}

export function renderAssets() {
  const wrap = $('#assetsList');
  wrap.innerHTML = '';

  assetsData.forEach(asset => {
    const total = asset.quantity * asset.priceUSD;
    const chCls = asset.change >= 0 ? 'text-success' : 'text-danger';
    const chIco = asset.change >= 0 ? 'trending-up' : 'trending-down';

    const card = document.createElement('div');
    card.className =
      'relative bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all duration-200';
    card.innerHTML = `
      <button class="edit-asset-btn absolute top-2 right-2 p-1 bg-primary/10 rounded-full" data-id="${asset.id}">
        <i data-lucide="pencil" class="w-4 h-4 text-primary"></i>
      </button>

      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-semibold text-lg">${asset.name}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">${asset.type} • ${asset.sector}</p>
        </div>
        <div class="text-right">
          <p class="font-bold text-lg">${formatCurrency(total)}</p>
          <div class="flex items-center gap-1 ${chCls}">
            <i data-lucide="${chIco}" class="w-3 h-3"></i>
            <span class="text-sm">${asset.change >= 0 ? '+' : ''}${asset.change}%</span>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-600 dark:text-gray-400">${asset.quantity} × ${formatCurrency(
          asset.priceUSD
        )}</span>
        <span class="px-2 py-1 rounded-full text-xs font-medium ${
          asset.risk === 'Low'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : asset.risk === 'Medium'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }">${asset.risk} Risk</span>
      </div>
    `;
    wrap.appendChild(card);
  });
}

export function renderAllTransactions() {
  const thead = $('#transactionsThead');
  const tbody = $('#transactionsBody');

  thead.innerHTML = `
    <tr>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
       <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th> 
    </tr>
  `;

  tbody.innerHTML = '';
  recentTransactionsData.forEach(tx => {
    const row = document.createElement('tr');
    row.dataset.id = tx.id;
    row.className =
      'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer';

    const typeCls =
      tx.type === 'income'
        ? 'text-success bg-green-100 dark:bg-green-900'
        : tx.type === 'expense'
        ? 'text-danger bg-red-100 dark:bg-red-900'
        : 'text-primary bg-blue-100 dark:bg-blue-900';

    row.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap text-sm">${new Date(
        tx.date
      ).toLocaleDateString()}</td>
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="px-2 py-1 text-xs font-medium rounded-full ${typeCls}">${tx.type}</span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm capitalize">${tx.category}</td>
      <td class="px-4 py-3 text-sm">${tx.description}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium ${
        tx.type === 'income' ? 'text-success' : 'text-danger'
      }">
        ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
      </td>
      <td class="px-4 py-3 text-right">
      <button class="delete-tx-btn text-red-500 hover:text-red-700" data-id="${tx.id}" title="Eliminar">
        <i data-lucide="trash" class="w-4 h-4"></i>
      </button>
  </td>
    `;
    tbody.appendChild(row);
  });
}

export function updateTranslations() {
  $('#title').textContent = translate('title');
  $('#subtitle').textContent = translate('subtitle');
  $('#portfolioOverview').textContent = translate('sections.portfolioOverview');
  $('#incomeExpenses').textContent = translate('sections.incomeExpenses');
  $('#spendingByCategory').textContent = translate('sections.spendingByCategory');
  $('#budgetProgress').textContent = translate('sections.budgetProgress');
  $('#recentTransactions').textContent = translate('sections.recentTransactions');
  $('#financialGoals').textContent = translate('sections.financialGoals');
  $('#assetsPortfolio').textContent = translate('sections.assetsPortfolio');
  $('#allTransactions').textContent = translate('sections.allTransactions');

  $('#addIncome').textContent = translate('actions.addIncome');
  $('#addExpense').textContent = translate('actions.addExpense');
  $('#addInvestment').textContent = translate('actions.addInvestment');
  $('#setGoal').textContent = translate('actions.setGoal');
}

export function renderAll() {
  renderSummaryCards();
  renderPortfolioChart($('#portfolioChart').getContext('2d'));
  renderIncomeExpensesChart($('#incomeExpensesChart').getContext('2d'));
  renderCategoryChart($('#categoryChart').getContext('2d'));
  renderBudgetProgress();
  renderRecentTransactions();
  renderFinancialGoals();
  renderAssets();
  renderAllTransactions();
  updateTranslations();
  lucide.createIcons();
}
