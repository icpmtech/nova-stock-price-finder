// firebase-init.js — configuração central Firebase
// ----------------------------------------------------
// Mantém tudo num único ficheiro para reutilizar "app", "auth" e "db"
// em quaisquer módulos (settings.js, etc.)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth }        from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
// Se um dia precisar de Storage / Analytics:
// import { getStorage }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
// import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';

// ----------------------------------------------------
// Configuração do seu projecto (corrigido bucket)
const firebaseConfig = {
  apiKey:             'AIzaSyBou0myKBfv_Drp6wnUUb-x0cG7bIqlo4w',
  authDomain:         'novamarketshub.firebaseapp.com',
  projectId:          'novamarketshub',
  storageBucket:      'novamarketshub.appspot.com', // <- ".appspot.com" correcto
  messagingSenderId:  '280260544447',
  appId:              '1:280260544447:web:6c16387f3550662abf430a',
  measurementId:      'G-5DZVZLWQ1K'
};

// ----------------------------------------------------
// Inicialização única
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
// const storage   = getStorage(app);
// const analytics = getAnalytics(app);

export { app, auth, db };
