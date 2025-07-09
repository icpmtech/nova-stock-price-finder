/* -------------------------------------------------------------------------- */
/* src/auth.js — handles Firebase Auth for Wallet 360                         */
/* -------------------------------------------------------------------------- */
import { $ } from './utils.js';
import { state } from './data.js';
import { loadInitialData } from './firebaseSync.js';
import { renderAll } from './render.js';

/* Keep a local reference so we can call signOut later */
let auth, signOutFn;

/* -------------------------------------------------------------------------- */
/*  Initialise Firebase Auth (call once from main.js)                         */
/* -------------------------------------------------------------------------- */
export async function initializeAuth() {
  /* 1) Load firebase-init.js (it must export { auth }) ------------------- */
  const { auth: firebaseAuth } = await import('./firebase-init.js');

  /* 2) Load Auth SDK & helpers (tree-shaken ES modules) ------------------ */
  const { onAuthStateChanged, signOut } =
    await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

  auth = firebaseAuth;
  signOutFn = signOut;          // save for the click-handler below

  /* 3) Listen for login / logout ---------------------------------------- */
  onAuthStateChanged(auth, async user => {
    if (!user) {
      // Not signed in → redirect
      location.href = '/login.html';
      return;
    }

    /* -- Signed in ------------------------------------------------------- */
    state.userEmail = user.email;
    const displayName = user.displayName || user.email.split('@')[0];
    $('#userName').textContent = displayName;
    $('#signOut').classList.remove('hidden');

    /* Pull Firestore data (if not already loaded) then render dashboard -- */
    await loadInitialData();
    renderAll();
  });
}

/* -------------------------------------------------------------------------- */
/*  Bind the “Sign out” button (call once from main.js after DOM ready)       */
/* -------------------------------------------------------------------------- */
export function registerAuthHandlers() {
  $('#signOut').addEventListener('click', async () => {
    $('#signOut').disabled = true;
    try {
      await signOutFn(auth);
      // onAuthStateChanged() will handle redirect
    } catch (err) {
      console.error('Sign-out failed', err);
      $('#signOut').disabled = false;
    }
  });
}
