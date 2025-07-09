import { $ } from './utils.js';
import { renderAll } from './render.js';
import { registerEventHandlers } from './events.js';
import { initializeUser, registerAuthHandlers } from './auth.js';
import { loadInitialData } from './firebaseSync.js';

function hideLoadingScreen() {
  setTimeout(() => {
    $('#loadingScreen').style.opacity = '0';
    setTimeout(() => ($('#loadingScreen').style.display = 'none'), 300);
  }, 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
  hideLoadingScreen();
  initializeUser();

  await loadInitialData();   // ⬅ wait for Firestore
  renderAll();               // first paint with live data

  registerEventHandlers();
  registerAuthHandlers();

  document.querySelectorAll('.animate-fade-in, .animate-slide-up')
          .forEach((el, i) => (el.style.animationDelay = `${i * 0.1}s`));
});
