const defaultConfig = {
  containerId: 'footer-widget',
  brandName: 'NovaStocks',
  links: [
    { label: 'Sobre', href: 'about.html' },
    { label: 'Contactos', href: 'contact.html' },
    { label: 'Termos de Uso', href: 'terms.html' },
    { label: 'Privacidade', href: 'privacy.html' }
  ],
  social: [
    { icon: '🐦', href: 'https://twitter.com/novaStocks' },
    { icon: '📘', href: 'https://facebook.com/novaStocks' },
    { icon: '📸', href: 'https://instagram.com/novaStocks' }
  ]
};

function buildFooter(cfg) {
  const container = document.getElementById(cfg.containerId);
  if (!container) return;

  const footer = document.createElement('footer');
  footer.className = 'bg-gray-800 text-gray-300 p-6';

  const brand = document.createElement('div');
  brand.className = 'text-center text-lg font-semibold mb-4';
  brand.textContent = cfg.brandName;

  const linksList = document.createElement('ul');
  linksList.className = 'flex justify-center space-x-6 mb-4';
  cfg.links.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    a.className = 'hover:text-white';
    li.appendChild(a);
    linksList.appendChild(li);
  });

  const socialList = document.createElement('div');
  socialList.className = 'flex justify-center space-x-4 mb-4';
  cfg.social.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.icon;
    a.className = 'text-xl hover:text-white';
    socialList.appendChild(a);
  });

  const copyright = document.createElement('div');
  copyright.className = 'text-center text-sm';
  const year = new Date().getFullYear();
  copyright.textContent = `© ${year} ${cfg.brandName}. Todos os direitos reservados.`;

  footer.appendChild(brand);
  footer.appendChild(linksList);
  footer.appendChild(socialList);
  footer.appendChild(copyright);
  container.appendChild(footer);
}

function initFooter(config = {}) {
  buildFooter(Object.assign({}, defaultConfig, config));
}

document.addEventListener('DOMContentLoaded', () => {
  initFooter();
});
