// invoicesAPI.js
import { db } from './firebase-init.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const auth = getAuth();

function requireAuth() {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');
  return user.uid;
}

function invoicesCollection() {
  const uid = requireAuth();
  return collection(db, 'users', uid, 'invoices');
}

function invoiceDoc(id) {
  const uid = requireAuth();
  return doc(db, 'users', uid, 'invoices', id);
}

// ✅ Criar nova fatura
async function createInvoice(invoiceData) {
  const colRef = invoicesCollection();
  const docRef = await addDoc(colRef, {
    ...invoiceData,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

// 📄 Obter todas as faturas
async function getAllInvoices() {
  const colRef = invoicesCollection();
  const q = query(colRef, orderBy('data', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 🔍 Obter fatura por ID
async function getInvoiceById(id) {
  const docRef = invoiceDoc(id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) throw new Error('Fatura não encontrada.');
  return { id: snapshot.id, ...snapshot.data() };
}

// ✏️ Atualizar fatura
async function updateInvoice(id, data) {
  const docRef = invoiceDoc(id);
  await updateDoc(docRef, data);
}

// ❌ Apagar fatura
async function deleteInvoice(id) {
  const docRef = invoiceDoc(id);
  await deleteDoc(docRef);
}

// Exportar a API
export const invoicesAPI = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice
};
