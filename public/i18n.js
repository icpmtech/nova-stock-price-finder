export const i18n = {
  en: {
    title: 'Wallet 360',
    subtitle: 'Complete Financial Dashboard',
    cards: {
      totalBalance: 'Total Balance',
      investments: 'Investments',
      savings: 'Savings',
      checking: 'Checking',
      monthlyIncome: 'Monthly Income',
      monthlyExpenses: 'Monthly Expenses'
    },
    sections: {
      portfolioOverview: 'Portfolio Overview',
      incomeExpenses: 'Income vs Expenses',
      spendingByCategory: 'Spending by Category',
      budgetProgress: 'Budget Progress',
      recentTransactions: 'Recent Transactions',
      financialGoals: 'Financial Goals',
      assetsPortfolio: 'Assets Portfolio',
      allTransactions: 'All Transactions'
    },
    actions: {
      addIncome: 'Add Income',
      addExpense: 'Add Expense',
      addInvestment: 'Add Investment',
      setGoal: 'Set Goal'
    },
    table: {
      date: 'Date',
      type: 'Type',
      category: 'Category',
      description: 'Description',
      amount: 'Amount'
    }
  },
  pt: {
    title: 'Carteira 360',
    subtitle: 'Painel Financeiro Completo',
    cards: {
      totalBalance: 'Saldo Total',
      investments: 'Investimentos',
      savings: 'Poupança',
      checking: 'Conta Corrente',
      monthlyIncome: 'Renda Mensal',
      monthlyExpenses: 'Despesas Mensais'
    },
    sections: {
      portfolioOverview: 'Visão Geral do Portfólio',
      incomeExpenses: 'Receitas vs Despesas',
      spendingByCategory: 'Gastos por Categoria',
      budgetProgress: 'Progresso do Orçamento',
      recentTransactions: 'Transações Recentes',
      financialGoals: 'Metas Financeiras',
      assetsPortfolio: 'Portfólio de Ativos',
      allTransactions: 'Todas as Transações'
    },
    actions: {
      addIncome: 'Adicionar Receita',
      addExpense: 'Adicionar Despesa',
      addInvestment: 'Adicionar Investimento',
      setGoal: 'Definir Meta'
    },
    table: {
      date: 'Data',
      type: 'Tipo',
      category: 'Categoria',
      description: 'Descrição',
      amount: 'Valor'
    }
  }
};
let currentTranslations = {};

export function applyLanguage(lang) {
  document.documentElement.setAttribute('lang', lang);

  return fetch(`./locales/${lang}.json`)
    .then(res => res.json())
    .then(translations => {
      currentTranslations = translations;

      Object.entries(translations).forEach(([key, value]) => {
        const el = document.getElementById(key);
        if (el) el.innerText = value;
      });

      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[key]) el.innerText = translations[key];
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (translations[key]) el.placeholder = translations[key];
      });

      window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    });
}

export function t(key) {
  try {
    return key.split('.').reduce((o, i) => (o && o[i] !== undefined) ? o[i] : null, currentTranslations) || key;
  } catch {
    return key;
  }
}
