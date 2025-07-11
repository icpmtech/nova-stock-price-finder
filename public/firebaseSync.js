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
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db,auth } from './firebase-init.js';
import { applyLanguage } from './i18n.js';
import { applyCurrency } from './helpers.js';
export async function getUserDetails() {
  const user = auth.currentUser;
  if (!user) return null;

  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data(); // retorna { displayName, theme, language, currency, ... }
  } else {
    return null; // não existe ainda
  }
}
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
// Aplicar idioma e moeda ao dashboard
const userDetails = await getUserDetails();

if (userDetails?.language) {
  localStorage.setItem('wallet360_language', userDetails.language);
  applyLanguage(userDetails.language);
}
if (userDetails?.currency) {
  localStorage.setItem('wallet360_currency', userDetails.currency);
  applyCurrency(userDetails.currency);
}
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
export async function deleteTransaction(tx) {
  await FirebaseAPI.deleteTransaction(tx); // <- aqui está a correção

  const idx = recentTransactionsData.findIndex(t => t.id === tx);
  if (idx > -1) recentTransactionsData.splice(idx, 1); // remove da lista local

  renderRecentTransactions();
  renderAllTransactions();
  
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
