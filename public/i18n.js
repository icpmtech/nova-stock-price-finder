export const i18n = {}; 
let currentTranslations = {};

export function applyLanguage(lang) {
  document.documentElement.setAttribute('lang', lang);
  localStorage.setItem('wallet360Lang', lang); // guarda para futuras sessões

  return fetch(`./locales/${lang}.json`)
    .then(res => res.json())
    .then(translations => {
      currentTranslations = translations;

      Object.entries(translations).forEach(([key, value]) => {
        const el = document.getElementById(key);
        if (el) el.innerText = value;
      });

      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[key]) el.innerText = translations[key];
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (translations[key]) el.placeholder = translations[key];
      });

      window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    });
}

export function t(key) {
  return currentTranslations[key] || key;
}

export function initLanguage() {
  const savedLang = localStorage.getItem('wallet360Lang');
  const browserLang = navigator.language?.substring(0, 2) || 'pt';

  const langToUse = savedLang || (['en', 'pt', 'es', 'fr'].includes(browserLang) ? browserLang : 'pt');
  applyLanguage(langToUse);

  const langSelect = document.getElementById('languageSelect');
  if (langSelect) langSelect.value = langToUse;
}