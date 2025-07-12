/* -------------------------------------------------------------------------- */
/*  main.js – single-page bootstrap                                           */
/* -------------------------------------------------------------------------- */

import { $, formatCurrency } from './utils.js';
import { registerEventHandlers } from './events.js';
import { initializeAuth, registerAuthHandlers } from './auth.js';
import { exchangeRates, assetsData } from './data.js';
import { getExchangeRates } from './currency.js';
import { applyLanguage, initLanguage } from './i18n.js';
import { applyCurrency } from './helpers.js';

/* -------------------------------------------------------------------------- */
/*  Idioma e Moeda                                                            */
/* -------------------------------------------------------------------------- */
const lang = localStorage.getItem('wallet360_language') || 'pt';
applyLanguage(lang);

const currency = localStorage.getItem('wallet360_currency') || 'EUR';
applyCurrency(currency);

const languageSelect = document.getElementById('languageSelect');
if (languageSelect) languageSelect.value = lang;

const currencySelect = document.getElementById('currencySelect');
if (currencySelect) currencySelect.value = currency;

/* -------------------------------------------------------------------------- */
/*  Splash screen fade                                                        */
/* -------------------------------------------------------------------------- */
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

  registerEventHandlers();
  registerAuthHandlers();

  const liveRates = getExchangeRates('USD', ['USD', 'EUR']);
  Object.assign(exchangeRates, liveRates);

  initializeAuth();

  // Espera os botões renderizarem para clicar em "All"
  setTimeout(() => {
    const btnAll = document.querySelector('.filter-btn[data-type="all"]');
    if (btnAll) btnAll.click();
    else console.warn('⚠️ Botão "All" não encontrado.');
  }, 500);
});
