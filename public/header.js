// header.js  const defaultConfig = {
containerId: 'header-widget',
title: 'NovaStocks',
logoUrl: '/assets/logo.png', // caminho para o logo
links: [
{ icon: '📊', label: 'Dashboard', href: 'dashboard.html' },
{ icon: '📈', label: 'Transações', href: 'real-time.html' },
{ icon: '⚖️', label: 'Mercados', href: 'global-markets.html' },
{ icon: '📋', label: 'Relatórios', href: 'report-transactions.html' },
{ icon: '🏠', label: 'Painel', href: 'watchlist.html' },
{ icon: '📂', label: 'Carteira', href: 'watchlist.html' },
{ icon: '📉', label: 'Performance', href: 'report-transactions.html' },
{ icon: '🔔', label: 'Alertas', href: 'events.html' },
{ icon: '⭐', label: 'Favoritos', href: 'watchlist.html' },
{ icon: '📤', label: 'Exportar', href: 'tax-report.html' },
{ icon: '⚙️', label: 'Definições', href: 'settings.html' }
]
};

function buildHeader(cfg) {
const container = document.getElementById(cfg.containerId);
if (!container) return console.warn('Header widget: container not found');

// Root header
const header = document.createElement('div');
header.className = 'flex justify-between items-center  bg-white p-4 shadow-lg relative';

// Logo/Button (left)
const btnMenu = document.createElement('button');
btnMenu.className = 'p-1 rounded-lg transition';
btnMenu.innerHTML = <img src="${cfg.logoUrl}" alt="${cfg.title} logo" class="h-8 w-auto"/>;
btnMenu.addEventListener('click', () => {
document.body.classList.toggle('sidebar-open');
});

// Title (center)
const h1 = document.createElement('h1');
h1.className = 'text-2xl font-bold text-gray-800';
h1.textContent = cfg.title;

// Dropdown wrapper (right)
const dropdownWrap = document.createElement('div');
dropdownWrap.className = 'relative';

const btnMore = document.createElement('button');
btnMore.className = 'p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition';
btnMore.innerHTML =    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"   stroke="currentColor" viewBox="0 0 24 24">   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"   d="M12 6h.01M12 12h.01M12 18h.01"/>   </svg>;

const menu = document.createElement('div');
menu.id = cfg.containerId + '-menu';
menu.className = 'hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50';
menu.innerHTML = <div class="py-1">   ${cfg.links.map(link =>   <a href="${link.href}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
<span class="mr-2">${link.icon}</span>${link.label}
</a>`
).join('')}

  </div>`;  btnMore.addEventListener('click', e => {
e.stopPropagation();
menu.classList.toggle('hidden');
});

// Fecha o menu ao clicar fora
document.addEventListener('click', () => {
menu.classList.add('hidden');
});

// Evita fechar se clicar dentro do menu
menu.addEventListener('click', e => e.stopPropagation());

// Monta o header
header.appendChild(btnMenu);
header.appendChild(h1);
dropdownWrap.appendChild(btnMore);
dropdownWrap.appendChild(menu);
header.appendChild(dropdownWrap);
container.appendChild(header);
}

// Public init
function init(config = {}) {
const finalConfig = Object.assign({}, defaultConfig, config);
buildHeader(finalConfig);
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
const container = document.getElementById(defaultConfig.containerId);
let config = {};
if (container && container.dataset.config) {
try {
config = JSON.parse(container.dataset.config);
} catch (e) {
console.warn('Header widget: invalid data-config JSON');
}
}
init(config);
});
