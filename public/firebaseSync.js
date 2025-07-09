/* -------------------------------------------------------------------------- */
/*  Firestore ⇆ in-memory synchronisation for Wallet360                       */
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
/*  LOAD everything on boot                                                   */
/* -------------------------------------------------------------------------- */
export async function loadInitialData() {
  /* 1. Wallet document & categories -------------------------------------- */
  const [walletDoc, cats] = await Promise.all([
    FirebaseAPI.fetchWalletData(),
    FirebaseAPI.fetchSpendingCategories()
  ]);

  Object.assign(walletData, walletDoc ?? {});
  walletData.spendingCategories = cats ?? {};

  /* ----- Seed wallet-level demo data if empty --------------------------- */
  let shouldWriteWallet = false;

  if (!Array.isArray(walletData.portfolioHistory) || !walletData.portfolioHistory.length) {
    walletData.portfolioHistory = demoPortfolioHistory.slice();
    shouldWriteWallet = true;
  }

  if (!Array.isArray(walletData.monthlyData) || !walletData.monthlyData.length) {
    walletData.monthlyData = demoMonthlyData.slice();
    shouldWriteWallet = true;
  }

  if (!Object.keys(walletData.spendingCategories).length) {
    walletData.spendingCategories = { ...demoSpendingCategories };
    await FirebaseAPI.setSpendingCategories(walletData.spendingCategories);
  }

  if (shouldWriteWallet) {
    await FirebaseAPI.setWalletData(walletData);
  }

  /* 2. Top-level collections -------------------------------------------- */
  const [bud, gol, ast, tx] = await Promise.all([
    FirebaseAPI.fetchBudgets(),
    FirebaseAPI.fetchGoals(),
    FirebaseAPI.fetchAssetsData(),
    FirebaseAPI.fetchRecentTransactions()
  ]);

  budgets.push(...bud);
  goals.push(...gol);
  assetsData.push(...ast);
  recentTransactionsData.push(...tx);

  /* ----- Seed assets if empty ------------------------------------------ */
  if (!assetsData.length) {
    for (const asset of demoAssetsData) {
      const id = await FirebaseAPI.addAsset(asset);
      assetsData.push({ ...asset, id });
    }
  }

  /* ----- Seed budgets if empty ----------------------------------------- */
  if (!budgets.length) {
    for (const b of demoBudgets) {
      const id = await FirebaseAPI.addBudget(b);
      budgets.push({ ...b, id });
    }
  }

  /* ----- Seed goals if empty ------------------------------------------- */
  if (!goals.length) {
    for (const g of demoGoals) {
      const id = await FirebaseAPI.addGoal(g);
      goals.push({ ...g, id });
    }
  }

  console.info('[Firebase] Initial data loaded (with demo fallbacks if needed)');
}

/* -------------------------------------------------------------------------- */
/*  SAVE helpers: write → Firestore, update cache, refresh UI                */
/* -------------------------------------------------------------------------- */
export async function addPortfolioSnapshot(entry) {
  entry.id = await FirebaseAPI.addPortfolioEntry(entry);
  (walletData.portfolioHistory ??= []).push(entry);
  renderAll();
}

export async function addMonthlyRecord(record) {
  record.id = await FirebaseAPI.addMonthlyRecord(record);
  (walletData.monthlyData ??= []).push(record);
  renderAll();
}

export async function addTransaction(tx) {
  tx.id = await FirebaseAPI.addTransaction(tx);
  recentTransactionsData.unshift(tx);
  renderRecentTransactions();
  renderAllTransactions();
}

/* ---------------- Generic CRUD wrappers ---------------------------------- */
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
