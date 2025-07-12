// firebaseApi.js
// Firebase Cloud Firestore API interface for Wallet360 data

import { db } from './firebase-init.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const auth = getAuth();

// Garante que o utilizador está autenticado e retorna o UID
function requireAuth() {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilizador não autenticado.");
  return user.uid;
}

// Referência à subcoleção do utilizador: collection(path, uid)
function userCollection(path) {
  const uid = requireAuth();
  return collection(db, path, uid);
}

// Referência ao documento do utilizador: doc(path, uid, docId)
function userDoc(path, docId) {
  const uid = requireAuth();
  return doc(db, path, uid, docId);
}

// Mapeia faturas para transações
function mapInvoiceToTx(id, inv) {
  const iso = inv.timestamp?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const cat = inv.categoria || 'outros';
  const icon = {
    supermercado: 'shopping-cart',
    restauracao:  'pizza',
    combustivel:  'fuel',
    saude:        'heart-pulse',
    educacao:     'book',
    outros:       'receipt'
  }[cat] ?? 'receipt';

  return {
    id,
    date: iso,
    type: 'expense',
    category: cat,
    description: `${inv.tipo_documento ?? 'FT'} — NIF ${inv.nif_emitente ?? ''}`,
    amount: inv.total ?? 0,
    icon
  };
}

export default class FirebaseAPI {
  /** TRANSAÇÕES **/
  static async fetchRecentTransactions() {
    const snap = await getDocs(userCollection('recentTransactions'));
    return snap.docs.map(d => {
      const data = d.data();
      return ('total' in data && 'timestamp' in data)
        ? mapInvoiceToTx(d.id, data)
        : { id: d.id, ...data };
    });
  }

  static async addTransaction(tx) {
    const ref = await addDoc(userCollection('recentTransactions'), tx);
    return ref.id;
  }

  static async updateTransaction(id, updates) {
    await updateDoc(userDoc('recentTransactions', id), updates);
  }

  static async deleteTransaction(id) {
    await deleteDoc(userDoc('recentTransactions', id));
  }

  /** ASSETS **/
  static async fetchAssetsData() {
    const snap = await getDocs(userCollection('assetsData'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async addAsset(asset) {
    const ref = await addDoc(userCollection('assetsData'), asset);
    return ref.id;
  }

  static async updateAsset(id, updates) {
    await updateDoc(userDoc('assetsData', id), updates);
  }

  static async deleteAsset(id) {
    await deleteDoc(userDoc('assetsData', id));
  }

  /** BUDGETS **/
  static async fetchBudgets() {
    const snap = await getDocs(userCollection('budgets'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async addBudget(budget) {
    const ref = await addDoc(userCollection('budgets'), budget);
    return ref.id;
  }

  static async updateBudget(id, updates) {
    await updateDoc(userDoc('budgets', id), updates);
  }

  static async deleteBudget(id) {
    await deleteDoc(userDoc('budgets', id));
  }

  /** GOALS **/
  static async fetchGoals() {
    const snap = await getDocs(userCollection('goals'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async addGoal(goal) {
    const ref = await addDoc(userCollection('goals'), goal);
    return ref.id;
  }

  static async updateGoal(id, updates) {
    await updateDoc(userDoc('goals', id), updates);
  }

  static async deleteGoal(id) {
    await deleteDoc(userDoc('goals', id));
  }

  /** SPENDING CATEGORIES **/
  static async fetchSpendingCategories() {
    const snap = await getDocs(userCollection('spendingCategories'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async setSpendingCategory(catId, data) {
    await setDoc(userDoc('spendingCategories', catId), data);
  }

  /** DASHBOARD SINGLETON **/
  static async fetchWalletData() {
    const ref = doc(db, 'dashboard', requireAuth(), 'walletData');
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  }

  static async setWalletData(data) {
    const ref = doc(db, 'dashboard', requireAuth(), 'walletData');
    await setDoc(ref, data);
  }

  /** PORTFOLIO HISTORY **/
  static async fetchPortfolioHistory() {
    const snap = await getDocs(collection(db, 'dashboard', requireAuth(), 'portfolioHistory'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async addPortfolioEntry(entry) {
    const ref = await addDoc(collection(db, 'dashboard', requireAuth(), 'portfolioHistory'), entry);
    return ref.id;
  }

  static async updatePortfolioEntry(id, updates) {
    const ref = doc(db, 'dashboard', requireAuth(), 'portfolioHistory', id);
    await updateDoc(ref, updates);
  }

  static async deletePortfolioEntry(id) {
    const ref = doc(db, 'dashboard', requireAuth(), 'portfolioHistory', id);
    await deleteDoc(ref);
  }

  /** MONTHLY DATA **/
  static async fetchMonthlyData() {
    const snap = await getDocs(collection(db, 'dashboard', requireAuth(), 'monthlyData'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async addMonthlyRecord(record) {
    const ref = await addDoc(collection(db, 'dashboard', requireAuth(), 'monthlyData'), record);
    return ref.id;
  }

  static async updateMonthlyRecord(id, updates) {
    const ref = doc(db, 'dashboard', requireAuth(), 'monthlyData', id);
    await updateDoc(ref, updates);
  }

  static async deleteMonthlyRecord(id) {
    const ref = doc(db, 'dashboard', requireAuth(), 'monthlyData', id);
    await deleteDoc(ref);
  }
}
