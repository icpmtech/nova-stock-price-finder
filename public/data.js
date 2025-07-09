/* -------------------------------------------------------------------------- */
/*  Reactive in-memory cache (initially empty; filled from Firestore)         */
/* -------------------------------------------------------------------------- */
export const state = {
  userEmail: '',
  currentView: 'dashboard'
};

/* ► walletData, budgets, goals, assets, recentTransactions will all be added
   ► at runtime by firebaseSync.loadInitialData() so every component can
     import them directly without null-checks.                                 */
export let walletData              = {};   // history + monthly + categories
export let budgets                 = [];
export let goals                   = [];
export let assetsData              = [];
export let recentTransactionsData  = [];

/* -------------------------------------------------------------------------- */
/*  Currency rates can still be hard-coded (or call an API later)             */
/* -------------------------------------------------------------------------- */
export let exchangeRates = { USD: 1, EUR: 0.92 };
