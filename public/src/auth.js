/* src/auth.js */
import { $ } from './utils.js';   // ✅ comes from utils, not data
import { state } from './data.js';

export function initializeUser() {
  state.userEmail = 'user@example.com';
  $('#userName').textContent = 'John Doe';
  $('#signOut').classList.remove('hidden');
}

export function registerAuthHandlers() {
  $('#signOut').addEventListener('click', () => {
    state.userEmail = '';
    $('#userName').textContent = '';
    $('#signOut').classList.add('hidden');
    console.log('User signed out');
  });
}
