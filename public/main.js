/* -------------------------------------------------------------------------- */
/*  main.js – single-page bootstrap                                           */
/* -------------------------------------------------------------------------- */

import { $ } from './utils.js';
import { registerEventHandlers } from './events.js';
import { initializeAuth, registerAuthHandlers } from './auth.js';  // ✅ new names
import { exchangeRates } from './data.js';
import { getExchangeRates } from './currency.js';
/* Optional splash-screen fade-out ----------------------------------------- */
function hideLoadingScreen() {
  const splash = $('#loadingScreen');
  if (!splash) return;
  setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => (splash.style.display = 'none'), 300);
  }, 1000);
}

/* -------------------------------------------------------------------------- */
/*  App bootstrap                                                             */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {


  hideLoadingScreen();

  /* 1. Wire up UI interactions (language, currency, dark mode, etc.) */
  registerEventHandlers();

  /* 2. Wire up “Sign out” button */
  registerAuthHandlers();
  // Pull latest FX once; components read from the same object reference
   const liveRates =  getExchangeRates('USD', ['USD', 'EUR']);
  Object.assign(exchangeRates, liveRates);   // ✅ mutate, don’t re-assign
  /* 3. Start Firebase Auth flow.
        - When user is signed in, initializeAuth() will:
            ▸ set state.userEmail
            ▸ load all Firestore data (loadInitialData)
            ▸ call renderAll()
     */
  initializeAuth();
});
