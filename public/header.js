
const defaultConfig = { containerId: 'header-widget', title: 'NovaStocks', logoUrl: '/assets/logo.png', links: [ { icon: '📊', label: 'Dashboard', href: 'dashboard.html' }, { icon: '📈', label: 'Transações', href: 'real-time.html' }, { icon: '⚖️', label: 'Mercados', href: 'global-markets.html' }, { icon: '📋', label: 'Relatórios', href: 'report-transactions.html' }, { icon: '🏠', label: 'Painel', href: 'watchlist.html' }, { icon: '📂', label: 'Carteira', href: 'watchlist.html' }, { icon: '📉', label: 'Performance', href: 'report-transactions.html' }, { icon: '🔔', label: 'Alertas', href: 'events.html' }, { icon: '⭐', label: 'Favoritos', href: 'watchlist.html' }, { icon: '📤', label: 'Exportar', href: 'tax-report.html' }, { icon: '⚙️', label: 'Definições', href: 'settings.html' } ] };

function buildHeader(cfg) { const container = document.getElementById(cfg.containerId); if (!container) return console.warn('Header widget: container not found');

const header = document.createElement('div'); header.className = 'flex justify-between items-center bg-white p-4 shadow-lg relative';

const btnMenu = document.createElement('button'); btnMenu.className = 'p-1 rounded-lg transition'; btnMenu.innerHTML = <img src="${cfg.logoUrl}" alt="${cfg.title} logo" class="h-8 w-auto"/>; btnMenu.addEventListener('click', () => { document.body.classList.toggle('sidebar-open'); });

const h1 = document.createElement('h1'); h1.className = 'text-2xl font-bold text-gray-800'; h1.textContent = cfg.title;

const notifWrap = document.createElement('div'); notifWrap.className = 'relative mr-4'; const btnBell = document.createElement('button'); btnBell.className = 'relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition'; btnBell.innerHTML = 🔔<span id="notif-badge" class="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full hidden">0</span>; notifWrap.appendChild(btnBell);

const notifMenu = document.createElement('div'); notifMenu.id = cfg.containerId + '-notif-menu'; notifMenu.className = 'hidden absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-auto max-h-64'; notifWrap.appendChild(notifMenu);

btnBell.addEventListener('click', e => { e.stopPropagation(); populateNotifications(notifMenu); notifMenu.classList.toggle('hidden'); });

const dropdownWrap = document.createElement('div'); dropdownWrap.className = 'relative'; const btnMore = document.createElement('button'); btnMore.className = 'p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition'; btnMore.innerHTML = <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6h.01M12 12h.01M12 18h.01"/></svg>; const menu = document.createElement('div'); menu.id = cfg.containerId + '-menu'; menu.className = 'hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50'; menu.innerHTML = <div class="py-1">${cfg.links.map(link => <a href="${link.href}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><span class="mr-2">${link.icon}</span>${link.label}</a>).join('')}</div>;

btnMore.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('hidden'); });

document.addEventListener('click', () => { menu.classList.add('hidden'); notifMenu.classList.add('hidden'); }); menu.addEventListener('click', e => e.stopPropagation()); notifMenu.addEventListener('click', e => e.stopPropagation());

header.appendChild(btnMenu); header.appendChild(h1); header.appendChild(notifWrap); dropdownWrap.appendChild(btnMore); dropdownWrap.appendChild(menu); header.appendChild(dropdownWrap); container.appendChild(header); }

function populateNotifications(menuEl) { const events = JSON.parse(localStorage.getItem('stockEvents') || '[]'); const today = new Date().toISOString().split('T')[0]; const upcoming = events.filter(e => e.date >= today); const badge = document.getElementById('notif-badge');

if (upcoming.length > 0) { badge.textContent = upcoming.length; badge.classList.remove('hidden'); } else { badge.classList.add('hidden'); }

if (upcoming.length === 0) { menuEl.innerHTML = '<div class="p-4 text-sm text-gray-500">Sem notificações</div>'; } else { menuEl.innerHTML = upcoming.map(e => <div class="px-4 py-2 hover:bg-gray-100 text-sm text-gray-800"><div class="font-semibold">${e.title}</div><div class="text-xs text-gray-500">${e.date} - ${e.symbol}</div></div>).join(''); } }

function init(config = {}) { const finalConfig = Object.assign({}, defaultConfig, config); buildHeader(finalConfig); }

document.addEventListener('DOMContentLoaded', () => { const container = document.getElementById(defaultConfig.containerId); let config = {}; if (container && container.dataset.config) { try { config = JSON.parse(container.dataset.config); } catch (e) {} } init(config); });

