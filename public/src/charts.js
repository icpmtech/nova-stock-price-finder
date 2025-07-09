import { charts, destroyChart, formatCurrency } from './utils.js';
import { walletData, exchangeRates } from './data.js';
import { settings } from './utils.js';

/* -------------------------------------------------------------------------- */
/* Portfolio history line-chart                                               */
/* -------------------------------------------------------------------------- */
export function renderPortfolioChart(ctx) {
  destroyChart('portfolio');

  charts.portfolio = new Chart(ctx, {
    type: 'line',
    data: {
      labels: walletData.portfolioHistory.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Total Portfolio',
          data: walletData.portfolioHistory.map(d => d.total * exchangeRates[settings.currentCurrency]),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Investments',
          data: walletData.portfolioHistory.map(d => d.investments * exchangeRates[settings.currentCurrency]),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Savings',
          data: walletData.portfolioHistory.map(d => d.savings * exchangeRates[settings.currentCurrency]),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.1)',
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

/* -------------------------------------------------------------------------- */
/* Monthly income vs expenses bar-chart                                       */
/* -------------------------------------------------------------------------- */
export function renderIncomeExpensesChart(ctx) {
  destroyChart('incomeExpenses');

  charts.incomeExpenses = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: walletData.monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Income',
          data: walletData.monthlyData.map(d => d.income * exchangeRates[settings.currentCurrency]),
          backgroundColor: 'rgba(16,185,129,0.8)',
          borderColor: '#10b981',
          borderWidth: 1
        },
        {
          label: 'Expenses',
          data: walletData.monthlyData.map(d => d.expenses * exchangeRates[settings.currentCurrency]),
          backgroundColor: 'rgba(239,68,68,0.8)',
          borderColor: '#ef4444',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => formatCurrency(v) } } }
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Spending-by-category doughnut-chart                                        */
/* -------------------------------------------------------------------------- */
export function renderCategoryChart(ctx) {
  destroyChart('category');

  const categories = Object.keys(walletData.spendingCategories);
  const values = categories.map(cat => walletData.spendingCategories[cat] * exchangeRates[settings.currentCurrency]);

  charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: values,
        backgroundColor: [
          '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4',
          '#84cc16', '#ec4899', '#6366f1', '#10b981'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
      }
    }
  });
}
