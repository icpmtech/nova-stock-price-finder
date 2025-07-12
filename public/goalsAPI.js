// firebaseApi.js
import { db } from './firebase-init.js';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js';

const GoalsAPI = {
  async fetchGoals(user) {
    if (!user) return [];
    const ref = collection(db, 'users', user.uid, 'goals');
    const snap = await getDocs(ref);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async addGoal(user, data) {
    const ref = collection(db, 'users', user.uid, 'goals');
    await addDoc(ref, data);
  },
  async updateGoal(user, id, data) {
    const ref = doc(db, 'users', user.uid, 'goals', id);
    await updateDoc(ref, data);
  },
  async deleteGoal(user, id) {
    const ref = doc(db, 'users', user.uid, 'goals', id);
    await deleteDoc(ref);
  }
};
export default GoalsAPI;
