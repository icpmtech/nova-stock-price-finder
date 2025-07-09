/* -------------------------------------------------------------------------- */
/* Global reactive state (mutated elsewhere)                                  */
/* -------------------------------------------------------------------------- */
export const state = {
  transactions: [],
  budgets: [],
  goals: [],
  userEmail: '',
  currentView: 'dashboard'
};

/* -------------------------------------------------------------------------- */
/* Static mock data                                                           */
/* -------------------------------------------------------------------------- */
export const walletData = {
  portfolioHistory: [
    { date: '2024-12-01', total: 45000, investments: 25000, savings: 15000, checking: 5000 },
    { date: '2024-12-15', total: 46500, investments: 26000, savings: 15200, checking: 5300 },
    { date: '2025-01-01', total: 48000, investments: 27500, savings: 15500, checking: 5000 },
    { date: '2025-01-15', total: 49200, investments: 28500, savings: 15700, checking: 5000 },
    { date: '2025-02-01', total: 50500, investments: 29800, savings: 15700, checking: 5000 },
    { date: '2025-02-15', total: 51800, investments: 31000, savings: 15800, checking: 5000 },
    { date: '2025-03-01', total: 53200, investments: 32500, savings: 15700, checking: 5000 },
    { date: '2025-03-15', total: 54600, investments: 33800, savings: 15800, checking: 5000 },
    { date: '2025-04-01', total: 56000, investments: 35200, savings: 15800, checking: 5000 },
    { date: '2025-04-15', total: 57500, investments: 36700, savings: 15800, checking: 5000 },
    { date: '2025-05-01', total: 59000, investments: 38200, savings: 15800, checking: 5000 },
    { date: '2025-05-15', total: 60800, investments: 40000, savings: 15800, checking: 5000 },
    { date: '2025-06-01', total: 62500, investments: 41700, savings: 15800, checking: 5000 },
    { date: '2025-06-15', total: 64200, investments: 43400, savings: 15800, checking: 5000 },
    { date: '2025-07-01', total: 66000, investments: 45200, savings: 15800, checking: 5000 }
  ],
  monthlyData: [
    { month: 'Jan', income: 8500, expenses: 6200 },
    { month: 'Feb', income: 8500, expenses: 5800 },
    { month: 'Mar', income: 9000, expenses: 6400 },
    { month: 'Apr', income: 8500, expenses: 5900 },
    { month: 'May', income: 8500, expenses: 6100 },
    { month: 'Jun', income: 8500, expenses: 5700 },
    { month: 'Jul', income: 8500, expenses: 6000 }
  ],
  spendingCategories: {
    'Food & Dining': 1200,
    'Transportation': 450,
    'Shopping': 800,
    'Bills & Utilities': 950,
    'Entertainment': 350,
    'Health & Fitness': 200,
    Investment: 2000,
    Other: 400
  },
  budgets: [
    { category: 'Food & Dining', budget: 1500, spent: 1200, color: '#ef4444' },
    { category: 'Transportation', budget: 500, spent: 450, color: '#f59e0b' },
    { category: 'Shopping', budget: 1000, spent: 800, color: '#8b5cf6' },
    { category: 'Bills & Utilities', budget: 1000, spent: 950, color: '#06b6d4' },
    { category: 'Entertainment', budget: 600, spent: 350, color: '#84cc16' }
  ],
  goals: [
    { name: 'Emergency Fund',  target: 20000, current: 15800, deadline: '2025-12-31', color: '#10b981' },
    { name: 'Vacation Fund',   target:  5000, current:  2800, deadline: '2025-08-15', color: '#f59e0b' },
    { name: 'New Car',         target: 25000, current: 18500, deadline: '2026-06-30', color: '#6366f1' },
    { name: 'Investment Portfolio', target: 50000, current: 45200, deadline: '2025-12-31', color: '#8b5cf6' }
  ]
};

export const assetsData = [
  { name: 'AAPL',  type: 'Stock',  sector: 'Technology',     country: 'USA',   risk: 'Medium', quantity: 25,  priceUSD: 195.50, change:  2.34 },
  { name: 'GOOGL', type: 'Stock',  sector: 'Technology',     country: 'USA',   risk: 'Medium', quantity:  8,  priceUSD: 2750.00, change: -1.23 },
  { name: 'MSFT',  type: 'Stock',  sector: 'Technology',     country: 'USA',   risk: 'Medium', quantity: 15,  priceUSD: 420.80, change:  0.87 },
  { name: 'JNJ',   type: 'Stock',  sector: 'Healthcare',     country: 'USA',   risk: 'Low',    quantity: 20,  priceUSD: 165.30, change:  0.45 },
  { name: 'BTC',   type: 'Crypto', sector: 'Cryptocurrency', country: 'Global',risk: 'High',   quantity: 0.15,priceUSD: 67500.00,change:  5.67 },
  { name: 'ETH',   type: 'Crypto', sector: 'Cryptocurrency', country: 'Global',risk: 'High',   quantity:  2.5,priceUSD:  3800.00,change:  3.45 },
  { name: 'Tesla', type: 'Stock',  sector: 'Automotive',     country: 'USA',   risk: 'High',   quantity: 12,  priceUSD:  245.60,change: -2.10 },
  { name: 'SPY',   type: 'ETF',    sector: 'Market Index',   country: 'USA',   risk: 'Medium', quantity: 50,  priceUSD:  425.30,change:  1.12 }
];

export const recentTransactionsData = [
  { id: 1, type: 'expense',    category: 'food',        amount:  45.50, description: 'Grocery shopping',  date: '2025-07-08', icon: 'shopping-cart' },
  { id: 2, type: 'income',     category: 'salary',      amount: 4250.00, description: 'Monthly salary',    date: '2025-07-01', icon: 'banknote' },
  { id: 3, type: 'expense',    category: 'transport',   amount:  25.00, description: 'Gas station',       date: '2025-07-07', icon: 'fuel' },
  { id: 4, type: 'investment', category: 'investment',  amount:1000.00, description: 'AAPL stock purchase',date:'2025-07-05', icon: 'trending-up' },
  { id: 5, type: 'expense',    category: 'entertainment',amount: 65.00, description: 'Movie night',       date: '2025-07-06', icon: 'film' }
];

export const exchangeRates = { USD: 1, EUR: 0.92 };
