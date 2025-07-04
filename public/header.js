;(function(window, document){
  const defaultConfig = {
    containerId: 'header-widget',
    title: 'NovaMarketHub',
    links: [
      { icon: '📊', label: 'Dashboard', href: '#' },
      { icon: '💼', label: 'Transações', href: '#' },
      { icon: '📈', label: 'Relatórios', href: 'report-transactions.html' },
      { icon: '⚙️', label: 'Definições', href: '#' },
    ],
  };

  function buildHeader(cfg) {
    const container = document.getElementById(cfg.containerId);
    if (!container) return console.warn('Header widget: container not found');

    // Root header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-6 bg-white  p-4 shadow-lg relative';

    // Sidebar toggle (left)
    const btnMenu = document.createElement('button');
    btnMenu.className = 'p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition';
    btnMenu.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
           stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"/>
      </svg>`;
    // if you already have a sidebar toggle, hook into its click:
    btnMenu.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open'); // or call your own toggleSidebar()
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
    btnMore.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
           stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 6h.01M12 12h.01M12 18h.01"/>
      </svg>`;

    const menu = document.createElement('div');
    menu.id = cfg.containerId + '-menu';
    menu.className = 'hidden absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100';
    menu.innerHTML = `<div class="py-1">
      ${cfg.links.map(link =>
        `<a href="${link.href}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <span class="mr-2">${link.icon}</span>${link.label}
        </a>`
      ).join('')}
    </div>`;

    // wire up dropdown
    btnMore.addEventListener('click', e => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => menu.classList.add('hidden'));

    // assemble
    dropdownWrap.appendChild(btnMore);
    dropdownWrap.appendChild(menu);
    header.appendChild(btnMenu);
    header.appendChild(h1);
    header.appendChild(dropdownWrap);
    container.appendChild(header);
  }

  // expose init
  window.MobileHeaderWidget = {
    init: function(config){
      buildHeader(Object.assign({}, defaultConfig, config));
    }
  };
})(window, document);