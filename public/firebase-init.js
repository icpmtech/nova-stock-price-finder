import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBou0myKBfv_Drp6wnUUb-x0cG7bIqlo4w",
  authDomain: "novamarketshub.firebaseapp.com",
  projectId: "novamarketshub",
  storageBucket: "novamarketshub.firebasestorage.app",
  messagingSenderId: "280260544447",
  appId: "1:280260544447:web:6c16387f3550662abf430a",
  measurementId: "G-5DZVZLWQ1K"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
