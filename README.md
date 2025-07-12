

# 💳 Wallet360 – Leitor de Faturas

![Deploy Status](https://img.shields.io/website?url=https%3A%2F%2Fwallet360.app%2Ffaturas&label=Deploy&style=flat-square&logo=vercel&color=4ade80)

**Wallet360 – Leitor de Faturas** é uma aplicação web moderna e responsiva para digitalizar, guardar e analisar faturas com leitura de QR Code, dashboard visual, exportação CSV, e suporte multilingue.

---

## 🌍 Demo

- 🔗 **[Aceder à App](https://wallet360.app/faturas)**
- 📱 Totalmente responsiva e adaptada a mobile
- 🌐 Suporte a 4 idiomas: PT 🇵🇹 | EN 🇬🇧 | ES 🇪🇸 | FR 🇫🇷

![Preview Wallet360](https://wallet360.app/assets/preview-faturas.png)

---

## 🚀 Funcionalidades

- 📸 Leitura de QR Code com fallback por imagem
- 🧾 Inserção manual de faturas
- 📊 Dashboard com gráficos de gastos, IVA e tipo de documentos
- ☁️ Armazenamento seguro no Firebase Firestore (por utilizador)
- 📤 Exportação para CSV
- 🔐 Autenticação via Firebase
- 🌐 Suporte multilingue (PT, EN, ES, FR)
- 🌓 Tema claro/escuro automático
- 🔔 Notificações locais (e futuras push via Firebase)

---

## 🛠️ Tecnologias Usadas

- HTML5 + Tailwind CSS (Mobile First)
- JavaScript ES Modules
- Firebase Authentication + Firestore
- html5-qrcode (scanner)
- CSV export (Blob API)
- Chart.js / Plotly.js
- i18n com JSON customizado

---

## 📁 Estrutura do Projeto

📁 public/ ├─ index.html ├─ dashboard.html ├─ scan.html ├─ add-manual.html ├─ js/ │   ├─ firebase-init.js │   ├─ firebaseApi.js │   ├─ render.js │   ├─ utils.js │   ├─ i18n.js ├─ lang/ │   └─ i18n.json └─ assets/ └─ preview-faturas.png

---

## 🔧 Configuração

1. Clone o projeto:

```bash
git clone https://github.com/pedrommartins/wallet360-faturas.git
cd wallet360-faturas

2. Crie um projeto Firebase e configure:



// js/firebase-init.js
const firebaseConfig = {
  apiKey: "XXX",
  authDomain: "XXX.firebaseapp.com",
  projectId: "XXX",
  storageBucket: "XXX.appspot.com",
  messagingSenderId: "XXX",
  appId: "XXX"
};

3. Ative Auth (Email/Password) e Firestore


4. Abra localmente ou faça deploy em Vercel/Netlify




---

🔐 Firestore Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/faturas/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}


---

📦 Exportação CSV

Exporta faturas visíveis para ficheiro .csv

Inclui campos como: Data, Tipo Doc, Total, IVA, NIF, Emissor



---

📈 Roadmap

[x] Leitura QR Code

[x] CSV Export

[x] Dashboard Visual

[x] Traduções dinâmicas

[x] Suporte a mobile

[ ] Reconhecimento OCR

[ ] Envio automático de relatórios mensais

[ ] Notificações Push com Firebase FCM



---

🤝 Contribuições

Aceitamos PRs e sugestões!
Crie uma feature-branch, commit, e envie um Pull Request 🙌


---

📜 Licença

MIT © Pedro Martins


---

Deploy Final:
🔗 https://wallet360.app/faturas
🧠 Mantido por Nova Labs

---
