/* -------------------------------------------------------------------------- */
/*  Demo data used when Firestore is empty                                    */
/* -------------------------------------------------------------------------- */

/* -------- Portfolio history (line-chart) ---------------------------------- */
export const demoPortfolioHistory = [
  { date: '2024-10-01', total: 42000, investments: 22000, savings: 14000, checking: 6000 },
  { date: '2024-11-01', total: 43500, investments: 23500, savings: 14000, checking: 6000 },
  { date: '2024-12-01', total: 45000, investments: 25000, savings: 14000, checking: 6000 },
  { date: '2025-01-01', total: 47000, investments: 27000, savings: 14000, checking: 6000 },
  { date: '2025-02-01', total: 48500, investments: 28500, savings: 14000, checking: 6000 },
  { date: '2025-03-01', total: 50000, investments: 30000, savings: 14000, checking: 6000 },
  { date: '2025-04-01', total: 51800, investments: 31800, savings: 14000, checking: 6000 },
  { date: '2025-05-01', total: 53500, investments: 33500, savings: 14000, checking: 6000 },
  { date: '2025-06-01', total: 55200, investments: 35200, savings: 14000, checking: 6000 },
  { date: '2025-07-01', total: 56800, investments: 36800, savings: 14000, checking: 6000 }
];

/* -------- Monthly income vs expenses (bar-chart) -------------------------- */
export const demoMonthlyData = [
  { month: 'Aug', income: 8500, expenses: 6500 },
  { month: 'Sep', income: 8500, expenses: 6300 },
  { month: 'Oct', income: 8500, expenses: 6200 },
  { month: 'Nov', income: 8500, expenses: 6100 },
  { month: 'Dec', income: 8500, expenses: 6000 },
  { month: 'Jan', income: 9000, expenses: 6400 },
  { month: 'Feb', income: 9000, expenses: 6200 },
  { month: 'Mar', income: 9000, expenses: 6100 },
  { month: 'Apr', income: 9000, expenses: 6000 },
  { month: 'May', income: 9000, expenses: 5900 }
];

/* -------- Spending categories (doughnut-chart) ---------------------------- */
export const demoSpendingCategories = {
  'Food & Dining':    1100,
  Transportation:      400,
  Shopping:            750,
  'Bills & Utilities': 900,
  Entertainment:       300,
  'Health & Fitness':  250,
  Investment:         2000,
  Other:               350
};

/* -------- Assets portfolio demo ------------------------------------------ */
export const demoAssetsData = [
  { name: 'AAPL',  type: 'Stock',  sector: 'Technology',     country: 'USA', risk: 'Medium', quantity: 25,  priceUSD: 195.50, change:  2.34 },
  { name: 'GOOGL', type: 'Stock',  sector: 'Technology',     country: 'USA', risk: 'Medium', quantity:  8,  priceUSD: 2750.00, change: -1.23 },
  { name: 'MSFT',  type: 'Stock',  sector: 'Technology',     country: 'USA', risk: 'Medium', quantity: 15,  priceUSD:  420.80, change:  0.87 },
  { name: 'JNJ',   type: 'Stock',  sector: 'Healthcare',     country: 'USA', risk: 'Low',    quantity: 20,  priceUSD:  165.30, change:  0.45 },
  { name: 'BTC',   type: 'Crypto', sector: 'Cryptocurrency', country: '—',  risk: 'High',   quantity: 0.15, priceUSD: 67500.00, change:  5.67 },
  { name: 'ETH',   type: 'Crypto', sector: 'Cryptocurrency', country: '—',  risk: 'High',   quantity:  2.5, priceUSD:  3800.00, change:  3.45 },
  { name: 'Tesla', type: 'Stock',  sector: 'Automotive',     country: 'USA', risk: 'High',   quantity: 12,  priceUSD:  245.60, change: -2.10 },
  { name: 'SPY',   type: 'ETF',    sector: 'Market Index',   country: 'USA', risk: 'Medium', quantity: 50,  priceUSD:  425.30, change:  1.12 }
];
/* -------- Budgets (progress bars) ---------------------------------------- */
export const demoBudgets = [
  { category: 'Food & Dining',  budget: 1500, spent: 1200, color: '#ef4444' },
  { category: 'Transportation', budget:  500, spent:  450, color: '#f59e0b' },
  { category: 'Shopping',       budget: 1000, spent:  800, color: '#8b5cf6' },
  { category: 'Bills & Utilities', budget: 1000, spent: 950, color: '#06b6d4' },
  { category: 'Entertainment',  budget:  600, spent:  350, color: '#84cc16' }
];

/* -------- Financial goals (progress bars) -------------------------------- */
export const demoGoals = [
  { name: 'Emergency Fund',       target: 20000, current: 15800, deadline: '2025-12-31', color: '#10b981' },
  { name: 'Vacation Fund',        target:  5000, current:  2800, deadline: '2025-08-15', color: '#f59e0b' },
  { name: 'New Car',              target: 25000, current: 18500, deadline: '2026-06-30', color: '#6366f1' },
  { name: 'Investment Portfolio', target: 50000, current: 45200, deadline: '2025-12-31', color: '#8b5cf6' }
];
