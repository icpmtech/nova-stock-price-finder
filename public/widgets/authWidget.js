// --- authWidget.js ---
import '../firebase-init.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
export class AuthWidget {
  constructor(signOutBtn, userEmailEl, redirectUrl = '/login.html') {
    this.signOutBtn = signOutBtn;
    this.userEmailEl = userEmailEl;
    this.redirectUrl = redirectUrl;
    this.auth = getAuth();
    this.init();
  }
  init() {
    onAuthStateChanged(this.auth, user => {
      if (!user) return location.href = this.redirectUrl;
      this.userEmailEl.textContent = user.email;
      // dispatch custom event to notify app
      window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user.email }));
    });
    this.signOutBtn.addEventListener('click', () => signOut(this.auth));
  }
}