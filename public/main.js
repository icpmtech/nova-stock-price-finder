/* -------------------------------------------------------------------------- */
/*  main.js – single-page bootstrap                                           */
/* -------------------------------------------------------------------------- */

import { $ } from './utils.js';
import { registerEventHandlers } from './events.js';
import { initializeAuth, registerAuthHandlers } from './auth.js';  // ✅ new names
import { exchangeRates } from './data.js';
import { getExchangeRates } from './currency.js';
import { applyLanguage } from './i18n.js';
import { initLanguage } from './i18n.js';
import { applyCurrency } from './helpers.js'; // ✅ AQUI
const lang = localStorage.getItem('wallet360_language') || 'pt';
applyLanguage(lang);

const currency = localStorage.getItem('wallet360_currency') || 'EUR';
applyCurrency(currency);

// 🔁 Atualiza os selects visuais no header
const languageSelect = document.getElementById('languageSelect');
if (languageSelect) languageSelect.value = lang;

const currencySelect = document.getElementById('currencySelect');
if (currencySelect) currencySelect.value = currency;

/* Optional splash-screen fade-out ----------------------------------------- */
function hideLoadingScreen() {
  const splash = $('#loadingScreen');
  if (!splash) return;
  setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => (splash.style.display = 'none'), 1000);
  }, 5000);
}

/* -------------------------------------------------------------------------- */
/*  App bootstrap                                                             */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {


  hideLoadingScreen();
   initLanguage();
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
