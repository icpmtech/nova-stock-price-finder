import { db } from './firebase-init.js'; import { collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, deleteField } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

function mapInvoiceToTx(id, inv) { const iso = inv.timestamp?.slice(0, 10) ?? new Date().toISOString().slice(0, 10); const cat = inv.categoria || 'outros'; const icon = { supermercado: 'shopping-cart', restauracao: 'pizza', combustivel: 'fuel', saude: 'heart-pulse', educacao: 'book', outros: 'receipt' }[cat] ?? 'receipt';

return { id, date: iso, type: 'expense', category: cat, description: ${inv.tipo_documento ?? 'FT'} — NIF ${inv.nif_emitente ?? ''}, amount: inv.total ?? 0, icon }; }

export default class FirebaseAPI { static async fetchWalletData() { const walletDoc = doc(db, 'dashboard', 'walletData'); const snapshot = await getDoc(walletDoc); return snapshot.exists() ? snapshot.data() : null; }

static async setWalletData(data) { const walletDoc = doc(db, 'dashboard', 'walletData'); await setDoc(walletDoc, data); }

static async updateWalletData(updates) { const walletDoc = doc(db, 'dashboard', 'walletData'); await updateDoc(walletDoc, updates); }

static async fetchPortfolioHistory() { const colRef = collection(db, 'dashboard', 'walletData', 'portfolioHistory'); const snapshot = await getDocs(colRef); return snapshot.docs.map(d => ({ id: d.id, ...d.data() })); }

static async addPortfolioEntry(entry) { const colRef = collection(db, 'dashboard', 'walletData', 'portfolioHistory'); const ref = await addDoc(colRef, entry); return ref.id; }

static async updatePortfolioEntry(id, updates) { const entryDoc = doc(db, 'dashboard', 'walletData', 'portfolioHistory', id); await updateDoc(entryDoc, updates); }

static async deletePortfolioEntry(id) { const entryDoc = doc(db, 'dashboard', 'walletData', 'portfolioHistory', id); await deleteDoc(entryDoc); }

static async fetchMonthlyData() { const colRef = collection(db, 'dashboard', 'walletData', 'monthlyData'); const snapshot = await getDocs(colRef); return snapshot.docs.map(d => ({ id: d.id, ...d.data() })); }

static async addMonthlyRecord(record) { const colRef = collection(db, 'dashboard', 'walletData', 'monthlyData'); const ref = await addDoc(colRef, record); return ref.id; }

static async updateMonthlyRecord(id, updates) { const recDoc = doc(db, 'dashboard', 'walletData', 'monthlyData', id); await updateDoc(recDoc, updates); }

static async deleteMonthlyRecord(id) { const recDoc = doc(db, 'dashboard', 'walletData', 'monthlyData', id); await deleteDoc(recDoc); }

static async fetchSpendingCategories() { const docRef = doc(db, 'dashboard', 'spendingCategories'); const snapshot = await getDoc(docRef); return snapshot.exists() ? snapshot.data() : {}; }

static async setSpendingCategories(categories) { const docRef = doc(db, 'dashboard', 'spendingCategories'); await setDoc(docRef, categories); }

static async updateSpendingCategory(name, value) { const docRef = doc(db, 'dashboard', 'spendingCategories'); await updateDoc(docRef, { [name]: value }); }

static async deleteSpendingCategory(name) { const docRef = doc(db, 'dashboard', 'spendingCategories'); await updateDoc(docRef, { [name]: deleteField() }); }

static async fetchBudgets() { const colRef = collection(db, 'budgets'); const snapshot = await getDocs(colRef); return snapshot.docs.map(d => ({ id: d.id, ...d.data() })); }

static async addBudget(budget) { const colRef = collection(db, 'budgets'); const ref = await addDoc(colRef, budget); return ref.id; }

static async updateBudget(id, updates) { const budDoc = doc(db, 'budgets', id); await updateDoc(budDoc, updates); }

static async deleteBudget(id) { const budDoc = doc(db, 'budgets', id); await deleteDoc(budDoc); }

static async fetchGoals() { const colRef = collection(db, 'goals'); const snapshot = await getDocs(colRef); return snapshot.docs.map(d => ({ id: d.id, ...d.data() })); }

static async addGoal(goal) { const colRef = collection(db, 'goals'); const ref = await addDoc(colRef, goal); return ref.id; }

static async updateGoal(id, updates) { const goalDoc = doc(db, 'goals', id); await updateDoc(goalDoc, updates); }

static async deleteGoal(id) { const goalDoc = doc(db, 'goals', id); await deleteDoc(goalDoc); }

static async fetchAssetsData() { const colRef = collection(db, 'assetsData'); const snapshot = await getDocs(colRef); return snapshot.docs.map(d => ({ id: d.id, ...d.data() })); }

static async addAsset(asset) { const colRef = collection(db, 'assetsData'); const ref = await addDoc(colRef, asset); return ref.id; }

static async updateAsset(id, updates) { const assetDoc = doc(db, 'assetsData', id); await updateDoc(assetDoc, updates); }

static async deleteAsset(id) { const assetDoc = doc(db, 'assetsData', id); await deleteDoc(assetDoc); }

static async fetchRecentTransactions() { const snap = await getDocs(collection(db, 'recentTransactions')); return snap.docs.map(d => { const data = d.data(); return ('total' in data && 'timestamp' in data) ? mapInvoiceToTx(d.id, data) : { id: d.id, ...data }; }); }

static async addTransaction(tx) { const colRef = collection(db, 'recentTransactions'); const ref = await addDoc(colRef, tx); return ref.id; }

static async updateTransaction(id, updates) { const txDoc = doc(db, 'recentTransactions', id); await updateDoc(txDoc, updates); }

static async deleteTransaction(id) { if (!id || typeof id !== 'string') throw new Error('ID inválido'); const ref = doc(db, 'recentTransactions', id); await deleteDoc(ref); } }

