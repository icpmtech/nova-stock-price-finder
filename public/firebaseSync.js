/* -------------------------------------------------------------------------- */
/*  firebaseSync.js – Firestore ⇆ in-memory state                             */
/* -------------------------------------------------------------------------- */
import FirebaseAPI from './firebaseApi.js';
import {
  walletData, budgets, goals, assetsData, recentTransactionsData
} from './data.js';

import {
  demoPortfolioHistory,
  demoMonthlyData,
  demoSpendingCategories,
  demoAssetsData,
  demoBudgets,
  demoGoals
} from './demoData.js';

import {
  renderAll, renderBudgetProgress, renderFinancialGoals,
  renderAssets, renderRecentTransactions, renderAllTransactions
} from './render.js';

/* -------------------------------------------------------------------------- */
/*  Load everything once after auth success                                   */
/* -------------------------------------------------------------------------- */
export async function loadInitialData() {
  const [walletDoc, cats] = await Promise.all([
    FirebaseAPI.fetchWalletData(),
    FirebaseAPI.fetchSpendingCategories()
  ]);

  Object.assign(walletData, walletDoc ?? {});
  walletData.spendingCategories = cats ?? {};

  let writeWallet = false;
  if (!walletData.portfolioHistory?.length) { walletData.portfolioHistory = [...demoPortfolioHistory]; writeWallet = true; }
  if (!walletData.monthlyData?.length)      { walletData.monthlyData      = [...demoMonthlyData];      writeWallet = true; }
  if (!Object.keys(walletData.spendingCategories).length) {
    walletData.spendingCategories = { ...demoSpendingCategories };
    await FirebaseAPI.setSpendingCategories(walletData.spendingCategories);
  }
  if (writeWallet) await FirebaseAPI.setWalletData(walletData);

  const [bud, gol, ast, tx] = await Promise.all([
    FirebaseAPI.fetchBudgets(),
    FirebaseAPI.fetchGoals(),
    FirebaseAPI.fetchAssetsData(),
    FirebaseAPI.fetchRecentTransactions()
  ]);
  budgets.push(...bud); goals.push(...gol); assetsData.push(...ast); recentTransactionsData.push(...tx);

  if (!assetsData.length)  for (const a of demoAssetsData) assetsData.push({ ...a, id: await FirebaseAPI.addAsset(a) });
  if (!budgets.length)     for (const b of demoBudgets)   budgets.push({ ...b, id: await FirebaseAPI.addBudget(b) });
  if (!goals.length)       for (const g of demoGoals)     goals.push({ ...g, id: await FirebaseAPI.addGoal(g) });

  console.info('[Firebase] Data ready');   // first render happens elsewhere
}

/* -------------------------------------------------------------------------- */
/*  Transactions                                                              */
/* -------------------------------------------------------------------------- */
export async function addTransaction(tx) {
  tx.id = await FirebaseAPI.addTransaction(tx);
  recentTransactionsData.unshift(tx);
  renderRecentTransactions(); renderAllTransactions();
}
export async function updateTransaction(tx) {
  await FirebaseAPI.updateTransaction(tx.id, tx);
  const idx = recentTransactionsData.findIndex(t => t.id === tx.id);
  if (idx > -1) recentTransactionsData[idx] = tx;
  renderRecentTransactions(); renderAllTransactions();
}

/* -------------------------------------------------------------------------- */
/*  Assets, budgets, goals (save helpers)                                     */
/* -------------------------------------------------------------------------- */
export const saveAsset = async a => {
  if (a.id) {
    await FirebaseAPI.updateAsset(a.id, a);
    Object.assign(assetsData.find(x => x.id === a.id) ?? {}, a);
  } else {
    a.id = await FirebaseAPI.addAsset(a);
    assetsData.push(a);
  }
  renderAssets();
};

export const saveBudget = async b => {
  if (b.id) {
    await FirebaseAPI.updateBudget(b.id, b);
    Object.assign(budgets.find(x => x.id === b.id) ?? {}, b);
  } else {
    b.id = await FirebaseAPI.addBudget(b);
    budgets.push(b);
  }
  renderBudgetProgress();
};

export const saveGoal = async g => {
  if (g.id) {
    await FirebaseAPI.updateGoal(g.id, g);
    Object.assign(goals.find(x => x.id === g.id) ?? {}, g);
  } else {
    g.id = await FirebaseAPI.addGoal(g);
    goals.push(g);
  }
  renderFinancialGoals();
};
