const lang = localStorage.getItem('lang') || 'pt';
const langSwitch = document.getElementById('lang-switch');
const langSwitchMobile = document.getElementById('lang-switch-mobile');

async function loadTranslations(selectedLang) {
  const res = await fetch('./data/i18n-data.json');
  const data = await res.json();
  const t = data[selectedLang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });

  // SEO metas
  document.getElementById('meta-title').textContent = t['meta.title'];
  document.getElementById('meta-desc').setAttribute('content', t['meta.desc']);
  document.getElementById('og-title').setAttribute('content', t['og.title']);
  document.getElementById('og-desc').setAttribute('content', t['og.desc']);
}

function setLanguage(newLang) {
  localStorage.setItem('lang', newLang);
  loadTranslations(newLang);
  if (langSwitch) langSwitch.value = newLang;
  if (langSwitchMobile) langSwitchMobile.value = newLang;
}

if (langSwitch) {
  langSwitch.addEventListener('change', e => setLanguage(e.target.value));
}
if (langSwitchMobile) {
  langSwitchMobile.addEventListener('change', e => setLanguage(e.target.value));
}

setLanguage(lang);

// Menu toggle
document.getElementById('btnMenu')?.addEventListener('click', () => {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('hidden');
});
