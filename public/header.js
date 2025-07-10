const defaultConfig = {
  containerId: 'header-widget',
  title: '💳 Wallet 360',
  logoUrl: '/assets/logo.png',
   links :[
  { icon: '📊', label: 'Dashboard',        href: 'dashboard.html' },       // overview / KPIs
  { icon: '💱', label: 'Transações',       href: 'real-time.html' },       // currency-style arrows
  { icon: '🔍', label: 'Análise',          href: 'symbol-analysis.html' }, // deep dive
  { icon: '🌐', label: 'Mercados',         href: 'global-markets.html' },  // global view
  { icon: '📑', label: 'Relatórios',       href: 'report-transactions.html' }, // documents
  { icon: '🖥️', label: 'Painel',           href: 'watchlist.html' },       // screen / monitor
  { icon: '💼', label: 'Carteira',         href: 'Wallet360.html' },          // portfolio / briefcase
  { icon: '📈', label: 'Análises de Ações',href: 'card-symbol.html' },     // stock chart
  { icon: '📈', label: 'Cotação',          href: 'cotacao.html' },     // cotacao chart
  { icon: '📆', label: 'Eventos',          href: 'events.html' },          // calendar
  { icon: '⭐',  label: 'Favoritos',        href: 'watchlist.html' },       // favorite / star
  { icon: '📤', label: 'Exportar',         href: 'tax-report.html' },      // out-tray
  { icon: '📥', label: 'Importar',         href: 'importer.html' },        // in-tray
  { icon: '⚙️', label: 'Definições',       href: 'settings.html' }         // cog
]

};

function buildHeader(cfg) {
  const container = document.getElementById(cfg.containerId);
  if (!container) return;

  const header = document.createElement('div');
  header.className = 'flex justify-between items-center  p-4 shadow-lg relative';

  const btnMenu = document.createElement('button');
  btnMenu.className = 'p-1 rounded-lg';
  btnMenu.innerHTML = `<img src="${cfg.logoUrl}" alt="${cfg.title} logo" class="h-8 w-auto"/>`;
  btnMenu.addEventListener('click', () =>
    document.body.classList.toggle('sidebar-open')
  );

  const titleEl = document.createElement('h1');
  titleEl.className = 'text-2xl font-bold text-gray-800';
  titleEl.textContent = cfg.title;

  const events = JSON.parse(localStorage.getItem('stockEvents') || '[]');
  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.date >= today);

  const notifWrap = document.createElement('div');
  notifWrap.className = 'relative mr-4';

  const btnBell = document.createElement('button');
  btnBell.className = 'relative p-2 rounded-lg hover:bg-gray-100';
  btnBell.innerHTML = `
    🔔
    <span class="absolute top-0 right-0 inline-flex items-center justify-center px-1 text-xs font-bold text-white bg-red-600 rounded-full">
      ${upcoming.length}
    </span>
  `;
  notifWrap.appendChild(btnBell);

  const notifMenu = document.createElement('div');
  notifMenu.className =
    'hidden absolute right-0 mt-2 w-64 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 overflow-auto max-h-64';

  if (upcoming.length) {
    upcoming.forEach(ev => {
      const item = document.createElement('div');
      item.className = 'px-4 py-2 hover:bg-gray-100 text-sm text-gray-800';
      item.innerHTML = `
        <div class="font-semibold">${ev.title}</div>
        <div class="text-xs text-gray-500">${ev.date} - ${ev.symbol}</div>
      `;
      notifMenu.appendChild(item);
    });
  } else {
    const empty = document.createElement('div');
    empty.className = 'p-4 text-sm text-gray-500';
    empty.textContent = 'Sem notificações';
    notifMenu.appendChild(empty);
  }

  notifWrap.appendChild(notifMenu);

  btnBell.addEventListener('click', e => {
    e.stopPropagation();
    notifMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => notifMenu.classList.add('hidden'));

  const dropdownWrap = document.createElement('div');
  dropdownWrap.className = 'relative';

  const btnMore = document.createElement('button');
  btnMore.className = 'p-2 rounded-lg hover:bg-gray-100';
  btnMore.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
      stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 6h.01M12 12h.01M12 18h.01"/>
    </svg>
  `;

  const menu = document.createElement('div');
  menu.className =
    'hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50';
  menu.innerHTML = `
    <div class="py-1">
      ${cfg.links
        .map(
          link => `
        <a href="${link.href}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <span class="mr-2">${link.icon}</span>${link.label}
        </a>`
        )
        .join('')}
    </div>
  `;

  btnMore.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => menu.classList.add('hidden'));

  header.appendChild(btnMenu);
  header.appendChild(titleEl);
  header.appendChild(notifWrap);
  dropdownWrap.appendChild(btnMore);
  dropdownWrap.appendChild(menu);
  header.appendChild(dropdownWrap);
  container.appendChild(header);
}

function init(config = {}) {
  buildHeader(Object.assign({}, defaultConfig, config));
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById(defaultConfig.containerId);
  let cfg = {};
  if (container && container.dataset.config) {
    try {
      cfg = JSON.parse(container.dataset.config);
    } catch {}
  }
  init(cfg);
});
