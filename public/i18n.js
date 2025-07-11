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
export function applyLanguage(lang) {
  document.documentElement.setAttribute('lang', lang);

  fetch(`./locales/${lang}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`Erro ao carregar ./locales/${lang}.json`);
      return res.json();
    })
    .then((translations) => {
      Object.entries(translations).forEach(([key, value]) => {
        const el = document.getElementById(key);
        if (el) el.innerText = value;
      });

      // Dispara evento global
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    })
    .catch((err) => {
      console.error(`[i18n] Falha ao aplicar idioma "${lang}":`, err);
    });
}