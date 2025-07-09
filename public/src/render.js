import { $, formatCurrency, translate } from './utils.js';
import { walletData, assetsData, recentTransactionsData } from './data.js';
import { renderPortfolioChart, renderIncomeExpensesChart, renderCategoryChart } from './charts.js';
import { settings } from './utils.js';

/* -------------------------------------------------------------------------- */
/* Dashboard summary cards                                                    */
/* -------------------------------------------------------------------------- */
export function renderSummaryCards() {
  const container = $('#summaryCards');
  container.innerHTML = '';

  const latestData   = walletData.portfolioHistory.at(-1);
  const monthlyData  = walletData.monthlyData.at(-1);

  const cards = [
    { title: translate('cards.totalBalance'),  value: formatCurrency(latestData.total),
      icon: 'wallet',       color: 'bg-gradient-to-r from-blue-500 to-blue-600',     change: '+5.2%' },
    { title: translate('cards.investments'),   value: formatCurrency(latestData.investments),
      icon: 'trending-up', color: 'bg-gradient-to-r from-green-500 to-green-600',   change: '+8.1%' },
    { title: translate('cards.savings'),       value: formatCurrency(latestData.savings),
      icon: 'piggy-bank',  color: 'bg-gradient-to-r from-purple-500 to-purple-600', change: '+0.6%' },
    { title: translate('cards.checking'),      value: formatCurrency(latestData.checking),
      icon: 'credit-card', color: 'bg-gradient-to-r from-orange-500 to-orange-600', change: '0.0%' },
    { title: translate('cards.monthlyIncome'), value: formatCurrency(monthlyData.income),
      icon: 'arrow-up',    color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',change:'+2.3%' },
    { title: translate('cards.monthlyExpenses'),value: formatCurrency(monthlyData.expenses),
      icon: 'arrow-down',  color: 'bg-gradient-to-r from-red-500 to-red-600',       change:'-3.5%' }
  ];

  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'bg-card dark:bg-cardDark rounded-2xl shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:scale-105';
    cardEl.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="${card.color} p-2 rounded-xl">
          <i data-lucide="${card.icon}" class="w-4 h-4 text-white"></i>
        </div>
        <span class="text-xs font-medium ${card.change.startsWith('+') ? 'text-success' : card.change.startsWith('-') ? 'text-danger' : 'text-gray-500'}">${card.change}</span>
      </div>
      <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">${card.title}</p>
      <p class="text-lg font-bold">${card.value}</p>
    `;
    container.appendChild(cardEl);
  });
}

/* -------------------------------------------------------------------------- */
/* Budget progress bars                                                       */
/* -------------------------------------------------------------------------- */
export function renderBudgetProgress() {
  const container = $('#budgetList');
  container.innerHTML = '';

  walletData.budgets.forEach(budget => {
    const progress  = (budget.spent / budget.budget) * 100;
    const remaining = budget.budget - budget.spent;

    const item = document.createElement('div');
    item.className = 'space-y-2';
    item.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium">${budget.category}</span>
        <span class="text-sm text-gray-600 dark:text-gray-400">${formatCurrency(budget.spent)} / ${formatCurrency(budget.budget)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${Math.min(progress,100)}%;background-color:${budget.color}"></div>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="${progress>90?'text-danger':progress>70?'text-warning':'text-success'}">${progress.toFixed(1)}% used</span>
        <span class="text-gray-500">${formatCurrency(remaining)} left</span>
      </div>
    `;
    container.appendChild(item);
  });
}

/* -------------------------------------------------------------------------- */
/* Recent transactions list (sidebar)                                         */
/* -------------------------------------------------------------------------- */
export function renderRecentTransactions() {
  const container = $('#transactionsList');
  container.innerHTML = '';

  recentTransactionsData.slice(0, 5).forEach(tx => {
    const txEl = document.createElement('div');
    txEl.className = 'flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';

    const iconColor = tx.type === 'income' ? 'text-success' :
                      tx.type === 'expense' ? 'text-danger' : 'text-primary';

    txEl.innerHTML = `
      <div class="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
        <i data-lucide="${tx.icon}" class="w-4 h-4 ${iconColor}"></i>
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
    container.appendChild(txEl);
  });
}

/* -------------------------------------------------------------------------- */
/* Financial goals progress bars                                              */
/* -------------------------------------------------------------------------- */
export function renderFinancialGoals() {
  const container = $('#goalsList');
  container.innerHTML = '';

  walletData.goals.forEach(goal => {
    const progress  = (goal.current / goal.target) * 100;
    const goalEl = document.createElement('div');
    goalEl.className = 'space-y-2';
    goalEl.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium">${goal.name}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">${new Date(goal.deadline).toLocaleDateString()}</span>
      </div>
      <div class="progress-bar w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div class="progress-fill h-full transition-all duration-500 ease-out" style="width:${progress}%;background-color:${goal.color}"></div>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-gray-600 dark:text-gray-400">${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}</span>
        <span class="font-medium ${progress>=100?'text-success':'text-primary'}">${progress.toFixed(1)}%</span>
      </div>
    `;
    container.appendChild(goalEl);
  });
}

/* -------------------------------------------------------------------------- */
/* Assets “portfolio cards”                                                   */
/* -------------------------------------------------------------------------- */
export function renderAssets() {
  const container = $('#assetsList');
  container.innerHTML = '';

  assetsData.forEach(asset => {
    const totalVal = asset.quantity * asset.priceUSD;
    const changeCl = asset.change >= 0 ? 'text-success' : 'text-danger';
    const changeIc = asset.change >= 0 ? 'trending-up' : 'trending-down';

    const card = document.createElement('div');
    card.className = 'bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all duration-200';
    card.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-semibold text-lg">${asset.name}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">${asset.type} • ${asset.sector}</p>
        </div>
        <div class="text-right">
          <p class="font-bold text-lg">${formatCurrency(totalVal)}</p>
          <div class="flex items-center gap-1 ${changeCl}">
            <i data-lucide="${changeIc}" class="w-3 h-3"></i>
            <span class="text-sm">${asset.change>=0?'+':''}${asset.change}%</span>
          </div>
        </div>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-600 dark:text-gray-400">${asset.quantity} × ${formatCurrency(asset.priceUSD)}</span>
        <span class="px-2 py-1 rounded-full text-xs font-medium ${
          asset.risk==='Low'   ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          asset.risk==='Medium'? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }">${asset.risk} Risk</span>
      </div>
    `;
    container.appendChild(card);
  });
}

/* -------------------------------------------------------------------------- */
/* All-transactions table                                                     */
/* -------------------------------------------------------------------------- */
export function renderAllTransactions() {
  const thead = $('#transactionsThead');
  const tbody = $('#transactionsBody');

  thead.innerHTML = `
    <tr>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${translate('table.date')}</th>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${translate('table.type')}</th>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${translate('table.category')}</th>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${translate('table.description')}</th>
      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">${translate('table.amount')}</th>
    </tr>
  `;

  tbody.innerHTML = '';
  recentTransactionsData.forEach(tx => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';

    const typeColor = tx.type === 'income' ? 'text-success bg-green-100 dark:bg-green-900' :
                      tx.type === 'expense'? 'text-danger bg-red-100 dark:bg-red-900' :
                                             'text-primary bg-blue-100 dark:bg-blue-900';

    row.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap text-sm">${new Date(tx.date).toLocaleDateString()}</td>
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="px-2 py-1 text-xs font-medium rounded-full ${typeColor}">${tx.type}</span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm capitalize">${tx.category}</td>
      <td class="px-4 py-3 text-sm">${tx.description}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium ${tx.type==='income'?'text-success':'text-danger'}">
        ${tx.type==='income'?'+':'-'}${formatCurrency(tx.amount)}
      </td>
    `;
    tbody.appendChild(row);
  });
}

/* -------------------------------------------------------------------------- */
/* Change section headings & buttons when language switches                   */
/* -------------------------------------------------------------------------- */
export function updateTranslations() {
  $('#title').textContent                  = translate('title');
  $('#subtitle').textContent               = translate('subtitle');
  $('#portfolioOverview').textContent      = translate('sections.portfolioOverview');
  $('#incomeExpenses').textContent         = translate('sections.incomeExpenses');
  $('#spendingByCategory').textContent     = translate('sections.spendingByCategory');
  $('#budgetProgress').textContent         = translate('sections.budgetProgress');
  $('#recentTransactions').textContent     = translate('sections.recentTransactions');
  $('#financialGoals').textContent         = translate('sections.financialGoals');
  $('#assetsPortfolio').textContent        = translate('sections.assetsPortfolio');
  $('#allTransactions').textContent        = translate('sections.allTransactions');

  $('#addIncome').textContent     = translate('actions.addIncome');
  $('#addExpense').textContent    = translate('actions.addExpense');
  $('#addInvestment').textContent = translate('actions.addInvestment');
  $('#setGoal').textContent       = translate('actions.setGoal');
}

/* -------------------------------------------------------------------------- */
/* Master render orchestrator                                                 */
/* -------------------------------------------------------------------------- */
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
