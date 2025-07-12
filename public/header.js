const defaultConfig = {
  containerId: 'header-widget',
  title: '💳 Wallet 360',
  logoUrl: '/assets/logo.png',
  links: [
    { icon: '💼', label: 'Carteira', href: 'wallet360.html' },
    { icon: '📊', label: 'Gerir Investimentos', href: 'dashboard.html' },
    { icon: '📊', label: 'Investimentos', href: 'real-time.html' },
    { icon: '💱', label: 'Transações', href: 'report-transactions.html' },
    { icon: '🔍', label: 'Análise', href: 'symbol-analysis.html' },
    { icon: '🌐', label: 'Mercados', href: 'global-markets.html' },
    { icon: '📑', label: 'Relatórios', href: 'report-transactions.html' },
    { icon: '📷', label: 'QR Code Leitor', href: 'invoices-reader.html' },
    { icon: '📑', label: 'Ativos', href: 'assets.html' },
    { icon: '📑', label: 'Objetivos', href: 'goals.html' },
    { icon: '📈', label: 'Análises de Ações', href: 'card-symbol.html' },
    { icon: '📈', label: 'Cotação', href: 'cotacao.html' },
    { icon: '📆', label: 'Eventos', href: 'events.html' },
    { icon: '⭐', label: 'Favoritos', href: 'watchlist.html' },
    { icon: '📆', label: 'IRS', href: 'tax.html' },
    { icon: '📤', label: 'Exportar', href: 'tax-report.html' },
    { icon: '📥', label: 'Importar', href: 'importer.html' },
    { icon: '⚙️', label: 'Definições', href: 'settings.html' }
  ]
};

function buildHeader(cfg) {
  const container = document.getElementById(cfg.containerId);
  if (!container) return;

  // Adicionar estilos CSS mobile-first
  const style = document.createElement('style');
  style.textContent = `
    /* Base styles - Mobile first */
    .wallet-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .wallet-header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      max-width: 100%;
    }
    
    .wallet-logo {
      height: 2rem;
      width: auto;
      border-radius: 0.375rem;
      transition: transform 0.2s ease;
    }
    
    .wallet-logo:hover {
      transform: scale(1.05);
    }
    
    .wallet-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      margin: 0;
      flex: 1;
      text-align: center;
      padding: 0 1rem;
    }
    
    .wallet-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .wallet-btn {
      position: relative;
      padding: 0.5rem;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
      font-size: 1.25rem;
      min-width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .wallet-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    
    .wallet-btn:active {
      transform: translateY(0);
    }
    
    .notification-badge {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 600;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .dropdown-menu {
      position: absolute;
      right: 0;
      top: 100%;
      margin-top: 0.5rem;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      z-index: 1000;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      pointer-events: none;
      min-width: 280px;
      max-width: 90vw;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .dropdown-menu.show {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: #374151;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .dropdown-item:hover {
      background: #f8fafc;
    }
    
    .dropdown-item:last-child {
      border-bottom: none;
    }
    
    .dropdown-icon {
      margin-right: 0.75rem;
      font-size: 1.125rem;
      width: 1.5rem;
      text-align: center;
    }
    
    .dropdown-label {
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .notification-item {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .notification-item:last-child {
      border-bottom: none;
    }
    
    .notification-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }
    
    .notification-meta {
      font-size: 0.75rem;
      color: #6b7280;
    }
    
    .empty-state {
      padding: 2rem 1rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    /* Tablet styles */
    @media (min-width: 640px) {
      .wallet-header-content {
        padding: 1rem 1.5rem;
      }
      
      .wallet-title {
        font-size: 1.5rem;
      }
      
      .wallet-actions {
        gap: 0.75rem;
      }
      
      .dropdown-menu {
        min-width: 320px;
      }
    }
    
    /* Desktop styles */
    @media (min-width: 1024px) {
      .wallet-header-content {
        padding: 1rem 2rem;
      }
      
      .wallet-title {
        font-size: 1.75rem;
      }
      
      .wallet-actions {
        gap: 1rem;
      }
      
      .dropdown-menu {
        min-width: 360px;
      }
    }
    
    /* Smooth scrolling for dropdown */
    .dropdown-menu {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    }
    
    .dropdown-menu::-webkit-scrollbar {
      width: 6px;
    }
    
    .dropdown-menu::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    
    .dropdown-menu::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    
    /* Loading animation */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .loading {
      animation: pulse 1.5s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);

  // Criar estrutura do header
  const header = document.createElement('div');
  header.className = 'wallet-header';
  
  const headerContent = document.createElement('div');
  headerContent.className = 'wallet-header-content';

  // Logo/Menu button
  const logoBtn = document.createElement('button');
  logoBtn.className = 'wallet-btn';
  logoBtn.innerHTML = `<img src="${cfg.logoUrl}" alt="${cfg.title} logo" class="wallet-logo"/>`;
  logoBtn.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-open');
  });

  // Title
  const title = document.createElement('h1');
  title.className = 'wallet-title';
  title.textContent = cfg.title;

  // Actions container
  const actions = document.createElement('div');
  actions.className = 'wallet-actions';

  // Notifications
  const notificationContainer = createNotificationButton(cfg);
  
  // Main menu
  const menuContainer = createMainMenu(cfg);

  // Assembly
  actions.appendChild(notificationContainer);
  actions.appendChild(menuContainer);
  
  headerContent.appendChild(logoBtn);
  headerContent.appendChild(title);
  headerContent.appendChild(actions);
  
  header.appendChild(headerContent);
  container.appendChild(header);
}

function createNotificationButton(cfg) {
  const container = document.createElement('div');
  container.className = 'relative';

  // Get events from storage (fallback to empty array)
  let events = [];
  try {
    events = JSON.parse(localStorage.getItem('stockEvents') || '[]');
  } catch (e) {
    console.warn('Failed to load events from localStorage');
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.date >= today);

  const button = document.createElement('button');
  button.className = 'wallet-btn';
  button.innerHTML = `
    🔔
    ${upcoming.length > 0 ? `<span class="notification-badge">${upcoming.length > 99 ? '99+' : upcoming.length}</span>` : ''}
  `;

  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';

  if (upcoming.length > 0) {
    upcoming.forEach(event => {
      const item = document.createElement('div');
      item.className = 'notification-item';
      item.innerHTML = `
        <div class="notification-title">${event.title}</div>
        <div class="notification-meta">${event.date} - ${event.symbol}</div>
      `;
      dropdown.appendChild(item);
    });
  } else {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '📭<br>Sem notificações';
    dropdown.appendChild(empty);
  }

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown(dropdown);
  });

  container.appendChild(button);
  container.appendChild(dropdown);
  return container;
}

function createMainMenu(cfg) {
  const container = document.createElement('div');
  container.className = 'relative';

  const button = document.createElement('button');
  button.className = 'wallet-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="1"/>
      <circle cx="12" cy="5" r="1"/>
      <circle cx="12" cy="19" r="1"/>
    </svg>
  `;

  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown-menu';

  cfg.links.forEach(link => {
    const item = document.createElement('a');
    item.className = 'dropdown-item';
    item.href = link.href;
    item.innerHTML = `
      <span class="dropdown-icon">${link.icon}</span>
      <span class="dropdown-label">${link.label}</span>
    `;
    dropdown.appendChild(item);
  });

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown(dropdown);
  });

  container.appendChild(button);
  container.appendChild(dropdown);
  return container;
}

function toggleDropdown(dropdown) {
  // Close all other dropdowns
  document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
    if (menu !== dropdown) {
      menu.classList.remove('show');
    }
  });
  
  // Toggle current dropdown
  dropdown.classList.toggle('show');
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.wallet-actions')) {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});

// Close dropdowns on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
});

function init(config = {}) {
  const finalConfig = Object.assign({}, defaultConfig, config);
  buildHeader(finalConfig);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById(defaultConfig.containerId);
  let cfg = {};
  
  if (container && container.dataset.config) {
    try {
      cfg = JSON.parse(container.dataset.config);
    } catch (e) {
      console.warn('Failed to parse config from data-config attribute');
    }
  }
  
  init(cfg);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { init, defaultConfig };
}