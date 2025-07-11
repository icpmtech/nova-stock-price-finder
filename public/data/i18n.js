const langSwitch = document.getElementById('lang-switch');
let lang = localStorage.getItem('lang') || 'pt';

async function loadI18n() {
  const res = await fetch('./data/i18n-data.json');
  const data = await res.json();
  const t = data[lang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });

  // SEO meta
  document.getElementById('meta-title').textContent = t['meta.title'];
  document.getElementById('meta-desc').setAttribute('content', t['meta.desc']);
  document.getElementById('og-title').setAttribute('content', t['og.title']);
  document.getElementById('og-desc').setAttribute('content', t['og.desc']);
}

langSwitch.value = lang;
langSwitch.addEventListener('change', () => {
  lang = langSwitch.value;
  localStorage.setItem('lang', lang);
  loadI18n();
});

loadI18n();
