import { $, destroyAllCharts } from './utils.js';
import { renderAll } from './render.js';
import { registerEventHandlers } from './events.js';
import { initializeUser, registerAuthHandlers } from './auth.js';

/* -------------------------------------------------------------------------- */
/* Splash-screen hiding                                                       */
/* -------------------------------------------------------------------------- */
function hideLoadingScreen() {
  setTimeout(() => {
    $('#loadingScreen').style.opacity = '0';
    setTimeout(() => { $('#loadingScreen').style.display = 'none'; }, 300);
  }, 1000);
}

/* -------------------------------------------------------------------------- */
/* App bootstrap                                                              */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  hideLoadingScreen();
  initializeUser();
  renderAll();
  registerEventHandlers();
  registerAuthHandlers();

  document.querySelectorAll('.animate-fade-in, .animate-slide-up')
          .forEach((el, i) => el.style.animationDelay = `${i * 0.1}s`);
});
