import { i18n } from './i18n.js';
import { exchangeRates } from './data.js';

/* -------------------------------------------------------------------------- */
/* Reactive app-wide settings                                                 */
/* -------------------------------------------------------------------------- */
export const settings = {
  currentLang: 'en',
  currentCurrency: 'USD',
  isDark: false
};

/* -------------------------------------------------------------------------- */
/* Tiny DOM helpers                                                           */
/* -------------------------------------------------------------------------- */
export const $  = sel => document.querySelector(sel);
export const $$ = sel => document.querySelectorAll(sel);

/* -------------------------------------------------------------------------- */
/* Formatting & translation helpers                                           */
/* -------------------------------------------------------------------------- */
export function translate(path) {
  return path.split('.').reduce((o, k) => o[k], i18n[settings.currentLang]);
}

export function formatCurrency(usd) {
  const val = usd * exchangeRates[settings.currentCurrency];
  const locale = settings.currentLang === 'en' ? 'en-US' : 'pt-PT';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: settings.currentCurrency }).format(val);
}

export function formatPercent(value) {
  const locale = settings.currentLang === 'en' ? 'en-US' : 'pt-PT';
  return new Intl.NumberFormat(locale, { style: 'percent', minFractionDigits: 1, maxFractionDigits: 2 })
    .format(value / 100);
}

/* -------------------------------------------------------------------------- */
/* Centralised Chart.js instance registry                                     */
/* -------------------------------------------------------------------------- */
export const charts = {};

export function destroyChart(name) {
  if (charts[name]) {
    charts[name].destroy();
    delete charts[name];
  }
}

export const destroyAllCharts = () => Object.keys(charts).forEach(destroyChart);
