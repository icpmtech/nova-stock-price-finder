// 1. Firebase config
// Importar configuração central
import { auth, db } from './firebase-init.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  updateDoc , // para atualizar
  addDoc,    // para guardar
  deleteDoc, // para eliminar
  doc        // para referenciar um doc específico
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Estado e elementos
const state = { user:       null, userEmail: null };
const els = {
  userName: document.getElementById('userName'),
  signOutBtn: document.getElementById('signOutBtn')
};

// Autenticação e redireção se não estiver logado
// Autenticação e redireção se não estiver logado
onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = '/login.html';
    return;
  }
  state.user = user;          // ⇠ guarda o FirebaseUser
  state.userEmail = user.email;

  if (els.userName)
    els.userName.textContent = user.displayName || user.email.split('@')[0];
if (auth.currentUser) {
  updateStats();
  loadRecentInvoices();
}
 
});

// Logout
if (els.signOutBtn) {
  els.signOutBtn.addEventListener('click', async () => {
    els.signOutBtn.disabled = true;
    await signOut(auth);
    location.href = '/login.html';
  });
}

let html5QrcodeScanner = null;
let isScanning = false;
let totalFaturas = 0;
let totalValor = 0;
let scannerPaused = false;
let currentCamera = 0;
let pendingInvoice = null;
/**
 * Analisa uma string de QR de fatura segundo as "Especificações Técnicas – Código QR" (Portaria 195/2020)
 * e devolve um objeto com todos os campos tipados e organizados.
 */
function parseFaturaQR(qr) {
  console.log('Parsing QR:', qr);

  const partes = qr
    .split(/[\*;\r?\n]+/)
    .map(p => p.trim())
    .filter(p => p.includes(':'));

  const acc = {};
  partes.forEach(par => {
    const [key, ...rest] = par.split(':');
    acc[key.trim()] = rest.join(':').trim();
  });

  let data = null;
  if (/^\d{8}$/.test(acc.F || '')) {
    const y = acc.F.slice(0,4), m = acc.F.slice(4,6), d = acc.F.slice(6,8);
    data = `${d}/${m}/${y}`;
  } else {
    data = acc.F || null;
  }

  const result = {
    nif_emitente:      acc.A || null,
    nif_adquirente:    acc.B || null,
    pais:              acc.C || null,
    tipo_documento:    acc.D || null,
    estado_documento:  acc.E || null,
    data:              data,
    id_documento:      acc.G || null,
    atcud:             acc.H || null,
  };

  result.espacos_fiscais = {
    I1: acc.I1 || null,
    I2: parseFloat(acc.I2 || 0),
    I3: parseFloat(acc.I3 || 0),
    I4: parseFloat(acc.I4 || 0),
    I5: parseFloat(acc.I5 || 0),
    I6: parseFloat(acc.I6 || 0),
    I7: parseFloat(acc.I7 || 0),
    I8: parseFloat(acc.I8 || 0),
  };

  result.espacos_fiscais_reg = {
    J1: acc.J1 || null, J2: parseFloat(acc.J2 || 0), J3: parseFloat(acc.J3 || 0),
    J4: parseFloat(acc.J4 || 0), J5: parseFloat(acc.J5 || 0), J6: parseFloat(acc.J6 || 0),
    J7: parseFloat(acc.J7 || 0), J8: parseFloat(acc.J8 || 0),
    K1: acc.K1 || null, K2: parseFloat(acc.K2 || 0), K3: parseFloat(acc.K3 || 0),
    K4: parseFloat(acc.K4 || 0), K5: parseFloat(acc.K5 || 0), K6: parseFloat(acc.K6 || 0),
    K7: parseFloat(acc.K7 || 0), K8: parseFloat(acc.K8 || 0),
  };

  result.nao_tributavel  = parseFloat(acc.L || 0);
  result.imposto_selo    = parseFloat(acc.M || 0);
  result.total_impostos  = parseFloat(acc.N || 0);
  result.total           = parseFloat(acc.O || 0);
  result.retencoes       = parseFloat(acc.P || 0);

  result.hash_qr         = acc.Q || null;
  result.certificado     = acc.R || null;
  result.outras_info     = acc.S || null;

  const todasChaves = Object.keys(acc);
  const excluidas = [
    'A','B','C','D','E','F','G','H',
    'I1','I2','I3','I4','I5','I6','I7','I8',
    'J1','J2','J3','J4','J5','J6','J7','J8',
    'K1','K2','K3','K4','K5','K6','K7','K8',
    'L','M','N','O','P','Q','R','S'
  ];

  const camposExtras = Object.fromEntries(
    todasChaves
      .filter(k => !excluidas.includes(k))
      .map(k => [k, acc[k]])
  );

  result.campos_extras      = camposExtras;
  result.outros             = JSON.stringify(camposExtras, null, 2);
  result.timestamp          = new Date().toISOString();
  result.rawqrcode          = qr;
  
  result.iva                = result.total_impostos;

  return result;
}
// Gravar no Firestore
/* ------------------------------------------------------------- */
/* 1. Guardar fatura                                             */
/* ---------- SUBSTITUA apenas esta função -------------------- */
async function guardarFatura(dados) {
  // 1. Garante que temos um utilizador autenticado
  const user = state.user || auth.currentUser;
  if (!user) {
    showError('Sessão expirada — faça login novamente.');
    return;
  }

  try {
    showLoading(true);
    const uid = user.uid;                      // ← sempre definido
    await addDoc(userTxCol(uid), dados);       // /users/{uid}/recentTransactions
    showSuccess('Fatura guardada com sucesso!');
    await Promise.all([updateStats(), loadRecentInvoices()]);
  } catch (e) {
    console.error('Erro ao guardar fatura:', e);
    showError('Erro ao guardar fatura. Tente novamente.');
  } finally {
    showLoading(false);
  }
}

/* ---------- Opcional: prevenir click antes do login --------- */
function confirmSave() {
  if (!auth.currentUser) {
    showError('Aguarde o login antes de guardar.');
    return;
  }
  if (!pendingInvoice) return;
  guardarFatura(pendingInvoice);
  displayScannedData(pendingInvoice);
  pendingInvoice = null;
  setTimeout(() => {
    if (!scannerPaused) { initScanner(); isScanning = false; }
  }, 2000);
}

// Carregar últimas 5 faturas
/* ------------------------------------------------------------- */
/* 2. Carregar as 5 mais recentes                                */
/* ---------------------------------------------------------------- */
/*  loadRecentInvoices – versão robusta                             */
async function loadRecentInvoices() {
  // 1. Garantir utilizador autenticado
  const user = state.user || auth.currentUser;
  if (!user) {                    // sessão expirada?
    showError('Sessão não encontrada. Faça login novamente.');
    return [];
  }

  try {
    // 2. Buscar docs mais recentes do próprio utilizador
    const q = query(
      userTxCol(user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const snap     = await getDocs(q);
    const invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3. Actualizar UI
    displayRecentInvoices(invoices);
    gerarGraficosFaturas(invoices);
    atualizarContadorEsteMes(invoices);

    // 3.1 Média para o banner “Média”
    const avg = invoices.length
      ? invoices.reduce((s,i)=>s+(i.total||0),0) / invoices.length
      : 0;
    document.getElementById('avg-value').textContent = avg.toFixed(2);

    return invoices;              // devolve caso seja útil
  } catch (err) {
    console.error('Erro ao carregar faturas:', err);
    showError('Falha ao carregar faturas. Tente novamente.');
    return [];
  }
}

function tipoLabel(tipo) {
  switch (tipo) {
    case "FS": return "Fatura Simplificada";
    case "FT": return "Fatura";
    case "FR": return "Recibo";
    case "NC": return "Nota de Crédito";
    case "ND": return "Nota de Débito";
    default:   return tipo || "—";
  }
}

function categoriaLabel(cat) {
  switch (cat) {
    case "supermercado": return "Supermercado";
    case "restauracao":  return "Restauração";
    case "combustivel":  return "Combustível";
    case "saude":        return "Saúde";
    case "educacao":     return "Educação";
    case "outros":       return "Outros";
    default:             return cat || "—";
  }
}

function displayRecentInvoices(invoices) {
  const container = document.getElementById('recent-invoices-list');
  if (invoices.length === 0) {
    container.innerHTML = '<p class="text-gray-500 italic text-center py-10">Nenhuma fatura encontrada</p>';
    return;
  }
  container.innerHTML = invoices.map(inv => `
    <div class="bg-gray-100 rounded-lg p-5 mb-4 border-l-4 border-primary hover:shadow-lg transform hover:-translate-y-1 transition">
      <div class="flex justify-between items-center mb-2">
        <span class="text-lg font-bold text-green-500">€${inv.total.toFixed(2)}</span>
        <span class="text-sm text-gray-600">${formatDate(inv.timestamp)}</span>
      </div>
      <div class="text-gray-700 space-y-1">
        <p><strong class="font-semibold">NIF:</strong> ${inv.nif_emitente || 'N/A'}</p>
        <p><strong class="font-semibold">Tipo:</strong> ${tipoLabel(inv.tipo_documento)}</p>
        <p><strong class="font-semibold">Categoria:</strong> ${categoriaLabel(inv.categoria)}</p>
        <p><strong class="font-semibold">IVA:</strong> €${inv.iva.toFixed(2)}</p>
      </div>
      <div class="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
        <button class="px-3 py-1 border border-primary text-primary rounded text-sm hover:bg-primary hover:text-white transition" onclick="viewInvoice('${inv.id}')">👁️ Ver</button>
        <button onclick="editInvoice('${inv.id}')" class="px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white">✏️ Editar</button>
        <button class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition" onclick="deleteInvoice('${inv.id}')">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}
function atualizarContadorEsteMes(faturas) {
  // Data/hora local do utilizador
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const totalEsteMes = faturas
  .filter(f => {
    const data = new Date(f.timestamp);
    return data.getMonth() === thisMonth && data.getFullYear() === thisYear;
  })
  .reduce((acc, f) => acc + (f.total || 0), 0);
document.getElementById('this-month').textContent = totalEsteMes.toFixed(2);

}

function gerarGraficosFaturas(faturas) {
  // Agrupa por categoria
  const somaPorCategoria = {};
  faturas.forEach(f => {
    const cat = f.categoria || 'outros';
    somaPorCategoria[cat] = (somaPorCategoria[cat] || 0) + (f.total || 0);
  });

  // Agrupa por tipo de fatura
  const somaPorTipo = {};
  faturas.forEach(f => {
    const tipo = f.tipo_documento || 'Outro';
    somaPorTipo[tipo] = (somaPorTipo[tipo] || 0) + (f.total || 0);
  });

  // Labels e cores
  const categoriaLabels = {
    supermercado: "Supermercado",
    restauracao:  "Restauração",
    combustivel:  "Combustível",
    saude:        "Saúde",
    educacao:     "Educação",
    outros:       "Outros"
  };
  const tipoLabels = {
    FS: "Fatura Simplificada",
    FT: "Fatura",
    FR: "Recibo",
    NC: "Nota de Crédito",
    ND: "Nota de Débito",
    Outro: "Outro"
  };

  const cores = [
    "#38bdf8", "#a7f3d0", "#fbbf24", "#f87171", "#818cf8", "#f472b6", "#34d399", "#facc15"
  ];

  // --- Pie Categoria
  const catKeys = Object.keys(somaPorCategoria);
  const catLabelsArr = catKeys.map(c => categoriaLabels[c] || c);
  const catValuesArr = catKeys.map(c => somaPorCategoria[c]);
  if (window.chartCategoriasPie) window.chartCategoriasPie.destroy();
  window.chartCategoriasPie = new Chart(document.getElementById('graficoCategoriasPie').getContext('2d'), {
    type: 'pie',
    data: {
      labels: catLabelsArr,
      datasets: [{
        data: catValuesArr,
        backgroundColor: cores,
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { display: true, position: 'bottom', labels: { font: {size: 15} } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: €${ctx.parsed.toFixed(2)}`
          }
        }
      }
    }
  });

  // --- Pie Tipo de Fatura
  const tipoKeys = Object.keys(somaPorTipo);
  const tipoLabelsArr = tipoKeys.map(t => tipoLabels[t] || t);
  const tipoValuesArr = tipoKeys.map(t => somaPorTipo[t]);
  if (window.chartTiposPie) window.chartTiposPie.destroy();
  window.chartTiposPie = new Chart(document.getElementById('graficoTiposPie').getContext('2d'), {
    type: 'pie',
    data: {
      labels: tipoLabelsArr,
      datasets: [{
        data: tipoValuesArr,
        backgroundColor: cores,
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { display: true, position: 'bottom', labels: { font: {size: 15} } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: €${ctx.parsed.toFixed(2)}`
          }
        }
      }
    }
  });
}



// Formatar data
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// Estatísticas gerais
/* ------------------------------------------------------------- */
/* 3. Estatísticas                                               */
async function updateStats() {
  if (!state.user) return;
  const uid = state.user.uid;
  const snap = await getDocs(userTxCol(uid));
  const totalFaturas = snap.size;
  const totalValor   = snap.docs.reduce((s, d) => s + (d.data().total || 0), 0);
  document.getElementById('total-faturas').textContent = totalFaturas;
  document.getElementById('total-valor').textContent   = totalValor.toFixed(2);
}

// Mostrar loading
/* ----------------------------------------------------------------- */
/* Substitua apenas esta função                                      */
function showLoading(show) {
  // tenta obter o overlay
  let el = document.getElementById('loading');

  // cria-o na hora se não existir (segurança extra)
  if (!el && show) {
    el = document.createElement('div');
    el.id = 'loading';
    el.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    el.innerHTML = `
      <div class="bg-white rounded-3xl p-8 text-center shadow-2xl">
        <div class="w-16 h-16 mx-auto mb-4">
          <div class="w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p class="text-gray-600 font-medium">Processando...</p>
      </div>`;
    document.body.appendChild(el);
  }

  // se mesmo assim não houver, apenas avisa — evita TypeError
  if (!el) {
    console.warn('#loading não encontrado (showLoading ignorado)');
    return;
  }

  // mostra ou esconde
  el.style.display = show ? 'flex' : 'none';
}


// Notificações
function showSuccess(msg) { showNotification(msg, 'success'); }
function showError(msg) { showNotification(msg, 'error'); }
function showNotification(message, type) {
  const n = document.createElement('div');
  n.className = `fixed top-5 right-5 px-5 py-3 rounded-lg text-white font-medium transform translate-x-full transition-transform z-[1100] ${type==='success'?'bg-green-500':'bg-red-500'}`;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.classList.remove('translate-x-full'), 100);
  setTimeout(() => n.remove(), 3000);
}

// Inicialização e eventos de scan
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('upload-image').addEventListener('click', () => document.getElementById('image-input').click());
  document.getElementById('image-input').addEventListener('change', handleImageUpload);

  function onScanSuccess(txt) {
    if (isScanning) return;
    isScanning = true;
    pendingInvoice = parseFaturaQR(txt);
    showPreview(pendingInvoice);
    html5QrcodeScanner.clear().then(() => {
      document.getElementById('scan-status').textContent = 'QR Code lido - confirme os dados';
      setTimeout(() => { initScanner(); isScanning = false; }, 1000);
    });
  }
  function onScanFailure() {}

  function initScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner('reader', { fps:10, qrbox:{width:250,height:250}, aspectRatio:1.0 }, false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    document.getElementById('scan-status').textContent = 'Pronto para escanear';
  }

  initScanner();
  setupButtonEvents();

  // Função para tratar upload de imagem
  function handleImageUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      const code = jsQR(ctx.getImageData(0,0,c.width,c.height).data, c.width, c.height);
      if (code) {
        pendingInvoice = parseFaturaQR(code.data);
        showPreview(pendingInvoice);
        document.getElementById('scan-status').textContent = '✅ Código lido de imagem!';
        showSuccess('Código lido da imagem com sucesso!');
      } else {
        document.getElementById('scan-status').textContent = '❌ QR Code não detetado na imagem.';
        showError('QR Code não detetado na imagem.');
      }
    };
    img.src = URL.createObjectURL(file);
  }

  // Exibir dados escaneados
  function displayScannedData(dados) {
    document.getElementById('output').innerHTML = `
      <div class="bg-gradient-to-br from-green-500 to-green-400 text-white p-6 rounded-lg mb-4">
        <h3 class="text-xl font-semibold mb-4">✅ Fatura Guardada</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>Total:</span><span>€${dados.total.toFixed(2)}</span></div>
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>IVA:</span><span>€${dados.iva.toFixed(2)}</span></div>
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>NIF:</span><span>${dados.nif_emitente}</span></div>
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>Data:</span><span>${dados.data}</span></div>
        </div>
      </div>
    `;
  }

  // Mostrar preview antes de gravar
function showPreview(dados) {
  // Helpers para renderizar secções e listas
  function renderCampo(label, valor) {
    return `<div class="flex justify-between items-center p-2 bg-white/20 rounded">
      <span>${label}:</span><span>${valor ?? '—'}</span></div>`;
  }

  function renderSecao(titulo, campos) {
    return `<div class="mb-2"><div class="font-semibold text-lg mb-1">${titulo}</div>
      <div class="grid grid-cols-2 gap-2">${campos.join('')}</div></div>`;
  }

  // Campos principais
  const camposPrincipais = [
    renderCampo('NIF Emitente', dados.nif_emitente),
    renderCampo('NIF Adquirente', dados.nif_adquirente),
    renderCampo('País', dados.pais),
    renderCampo('Tipo Doc.', dados.tipo_documento),
    renderCampo('Estado Doc.', dados.estado_documento),
    renderCampo('Data', dados.data),
    renderCampo('ID Documento', dados.id_documento),
    renderCampo('ATCUD', dados.atcud),
    renderCampo('Total', typeof dados.total === 'number' ? '€'+dados.total.toFixed(2) : '—'),
    renderCampo('IVA', typeof dados.iva === 'number' ? '€'+dados.iva.toFixed(2) : '—'),
    renderCampo('Não Tributável', typeof dados.nao_tributavel === 'number' ? '€'+dados.nao_tributavel.toFixed(2) : '—'),
    renderCampo('Imposto Selo', typeof dados.imposto_selo === 'number' ? '€'+dados.imposto_selo.toFixed(2) : '—'),
    renderCampo('Retenções', typeof dados.retencoes === 'number' ? '€'+dados.retencoes.toFixed(2) : '—'),
    renderCampo('Hash QR', dados.hash_qr),
    renderCampo('Certificado', dados.certificado),
    renderCampo('Outras Info', dados.outras_info),
    renderCampo('Timestamp', dados.timestamp),
  ];

  // Espaços fiscais (I1–I8)
  const camposEspacosFiscais = Object.entries(dados.espacos_fiscais || {}).map(
    ([k, v]) => renderCampo(k, v === null ? '—' : v)
  );

  // Espaços fiscais regionais (J1–J8, K1–K8)
  const camposEspacosFiscaisReg = Object.entries(dados.espacos_fiscais_reg || {}).map(
    ([k, v]) => renderCampo(k, v === null ? '—' : v)
  );

  // Campos extras
  const camposExtras = Object.entries(dados.campos_extras || {}).map(
    ([k, v]) => renderCampo(k, v === null ? '—' : v)
  );

  // Preview completo
  document.getElementById('output').innerHTML = `
    <div class="bg-teal-500 bg-opacity-90 text-white p-3 sm:p-6 rounded-lg mb-4 max-h-[75vh] sm:max-h-[80vh] overflow-y-auto">
      <h3 class="text-xl font-semibold mb-4">👁️ Pré-visualização da Fatura</h3>
      <div class="bg-yellow-200 border border-yellow-300 p-3 rounded mb-4 text-center text-gray-800">
        ⚠️ Confirme os dados antes de guardar
      </div>
      ${renderSecao('Campos Principais', camposPrincipais)}
      ${renderSecao('Espaços Fiscais (I1–I8)', camposEspacosFiscais)}
      ${renderSecao('Espaços Fiscais Regionais (J1–J8, K1–K8)', camposEspacosFiscaisReg)}
      ${camposExtras.length > 0 ? renderSecao('Campos Extras', camposExtras) : ''}
      <div class="mt-4">
        <div class="font-mono text-xs bg-black/30 p-2 rounded break-words">Raw QR: ${dados.rawqrcode}</div>
      </div>
      <div class="flex space-x-4 mt-6">
        <button id="cancel-save" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">❌ Cancelar</button>
        <button id="edit-invoice" class="px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white">✏️ Editar</button>
        <button id="confirm-save" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">💾 Confirmar e Guardar</button>
      </div>
    </div>
  `;
  document.getElementById('cancel-save').addEventListener('click', cancelSave);
  document.getElementById('edit-invoice').addEventListener('click', () => editInvoice(dados));
  document.getElementById('confirm-save').addEventListener('click', confirmSave);
}


  // Botões e eventos gerais
  function setupButtonEvents() {
    document.getElementById('toggle-scanner').addEventListener('click', toggleScanner);
    document.getElementById('switch-camera').addEventListener('click', switchCamera);
    document.getElementById('refresh-stats').addEventListener('click', () => { showLoading(true); updateStats().then(() => { showLoading(false); showSuccess('Estatísticas atualizadas!'); }); });
    document.getElementById('export-data').addEventListener('click', exportData);
    document.getElementById('clear-results').addEventListener('click', clearResults);
    document.getElementById('manual-input').addEventListener('click', showManualInput);
    document.getElementById('refresh-invoices').addEventListener('click', loadRecentInvoices);
    document.getElementById('delete-all').addEventListener('click', deleteAllInvoices);
    document.querySelectorAll('.tab-button').forEach(btn => btn.addEventListener('click', switchTab));
  }

  // Alternar scanner
  function toggleScanner() {
    const btn = document.getElementById('toggle-scanner');
    if (scannerPaused) { initScanner(); btn.textContent='⏸️ Pausar Scanner'; scannerPaused=false; }
    else { html5QrcodeScanner.clear(); btn.textContent='▶️ Iniciar Scanner'; scannerPaused=true; document.getElementById('scan-status').textContent='Scanner pausado'; }
  }

  // Trocar câmera
  async function switchCamera() {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices.length > 1) {
        currentCamera = (currentCamera + 1) % devices.length;
        html5QrcodeScanner.clear().then(() => { initScanner(); showSuccess(`Câmera: ${devices[currentCamera].label}`); });
      } else showError('Apenas uma câmera disponível');
    } catch { showError('Erro ao trocar câmera'); }
  }

  // Exportar CSV
 /* ------------------------------------------------------------- */
/* 6. Exportar CSV                                               */
function exportData() {
  if (!state.user) return;
  getDocs(userTxCol(state.user.uid))
    .then(snap => {
      const rows = snap.docs.map(d => [
        d.id,
        d.data().nif_emitente || '',
        d.data().data || '',
        d.data().total,
        d.data().iva,
        d.data().timestamp
      ].join(','));
      const csv = 'data:text/csv;charset=utf-8,ID,NIF,Data,Total,IVA,Timestamp\\n' + rows.join('\\n');
      const a = document.createElement('a');
      a.href = encodeURI(csv);
      a.download = 'faturas.csv';
      a.click();
      showSuccess('CSV exportado!');
    })
    .catch(() => showError('Erro ao exportar dados'));
}

  // Limpar resultados
  function clearResults() {
    pendingInvoice = null;
    document.getElementById('output').innerHTML = '<div class="text-gray-500 text-center py-10"><h3 class="text-xl">🔍 Aguardando leitura...</h3><p>Aponte a câmera para o QR code</p></div>';
    if (scannerPaused) { initScanner(); document.getElementById('toggle-scanner').textContent='⏸️ Pausar Scanner'; scannerPaused=false; }
    showSuccess('Resultados limpos!');
  }

  // Inserção manual
  function showManualInput() {
    const modal = document.createElement('div'); modal.className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-auto">
        <h3 class="text-xl font-semibold mb-4">✍️ Inserir Fatura Manual</h3>
        <form id="manual-form">
          <div class="mb-4"><label class="block mb-1">NIF:</label><input class="w-full p-2 border rounded" id="manual-nif" type="text" required/></div>
          <div class="mb-4"><label class="block mb-1">Total:</label><input class="w-full p-2 border rounded" id="manual-total" type="number" step="0.01" required/></div>
          <div class="mb-4"><label class="block mb-1">IVA:</label><input class="w-full p-2 border rounded" id="manual-iva" type="number" step="0.01" required/></div>
          <div class="mb-4"><label class="block mb-1">Data:</label><input class="w-full p-2 border rounded" id="manual-data" type="date" required/></div>
          <div class="mb-6"><label class="block mb-1">País:</label><input class="w-full p-2 border rounded" id="manual-pais" type="text" value="PT"/></div>
          <div class="flex justify-end space-x-4"><button type="button" class="px-4 py-2 bg-gray-600 text-white rounded" onclick="closeModal()">Cancelar</button><button type="submit" class="px-4 py-2 bg-primary text-white rounded">Pré-visualizar</button></div>
        </form>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('manual-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('manual-form').addEventListener('submit', e => {
      e.preventDefault();
      const d = {
        nif_emitente: document.getElementById('manual-nif').value,
        total: parseFloat(document.getElementById('manual-total').value),
        iva: parseFloat(document.getElementById('manual-iva').value),
        data: document.getElementById('manual-data').value,
        pais: document.getElementById('manual-pais').value,
        outros: null,
        timestamp: new Date().toISOString(),
        qr_original: 'MANUAL'
      };
      pendingInvoice = d;
      showPreview(d);
      closeModal();
      switchTabById('scan-results');
    });
  }

  // Editar fatura pré-visualizada
  function editInvoice(dados) {
    const modal = document.createElement('div'); modal.className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-auto">
        <h3 class="text-xl font-semibold mb-4">✏️ Editar Fatura</h3>
        <form id="edit-form">
          <div class="mb-4"><label class="block mb-1">NIF:</label><input class="w-full p-2 border rounded" id="edit-nif" type="text" value="${dados.nif_emitente}" required/></div>
          <div class="mb-4"><label class="block mb-1">Total:</label><input class="w-full p-2 border rounded" id="edit-total" type="number" step="0.01" value="${dados.total}" required/></div>
          <div class="mb-4"><label class="block mb-1">IVA:</label><input class="w-full p-2 border rounded" id="edit-iva" type="number" step="0.01" value="${dados.iva}" required/></div>
          <div class="mb-4"><label class="block mb-1">Data:</label><input class="w-full p-2 border rounded" id="edit-data" type="date" value="${dados.data.split('/').reverse().join('-')}" required/></div>
          <div class="mb-4"><label class="block mb-1">País:</label><input class="w-full p-2 border rounded" id="edit-pais" type="text" value="${dados.pais}"/></div>
          <div class="mb-6"><label class="block mb-1">Outros:</label><input class="w-full p-2 border rounded" id="edit-outros" type="text" value='${dados.outros}'/></div>
          <div class="flex justify-end space-x-4"><button type="button" class="px-4 py-2 bg-gray-600 text-white rounded" onclick="closeModal()">Cancelar</button><button type="submit" class="px-4 py-2 bg-primary text-white rounded">Atualizar</button></div>
        </form>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('edit-form').addEventListener('submit', e => {
      e.preventDefault();
      const updated = {
        nif_emitente: document.getElementById('edit-nif').value,
        total: parseFloat(document.getElementById('edit-total').value),
        iva: parseFloat(document.getElementById('edit-iva').value),
        data: document.getElementById('edit-data').value.split('-').reverse().join('/'),
        pais: document.getElementById('edit-pais').value,
        outros: document.getElementById('edit-outros').value,
        timestamp: new Date().toISOString(),
        qr_original: dados.qr_original
      };
      pendingInvoice = updated;
      showPreview(updated);
      closeModal();
    });
  }

  // Alternar abas
  function switchTab(e) {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('border-primary','text-primary','font-semibold'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    const btn = e.currentTarget;
    btn.classList.add('border-primary','text-primary','font-semibold');
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
  }
  // Mostra a aba pelo ID (mesmo sem botão)
function switchTabById(id) {
  // esconde todas
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  // mostra a pedida
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  else console.warn(`switchTabById: #${id} não encontrado`);
}

// Se ainda quiser manter os botões visíveis
function switchTab(e) {
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('border-primary','text-primary','font-semibold'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  const btn = e.currentTarget;
  btn.classList.add('border-primary','text-primary','font-semibold');
  document.getElementById(btn.dataset.tab).classList.remove('hidden');
}
/* ------------------------------------------------------------- */
/* 4. Eliminar TODAS as faturas do utilizador                    */
async function deleteAllInvoices() {
  if (!state.user || !confirm('Eliminar todas as faturas?')) return;
  showLoading(true);
  const uid = state.user.uid;
  const snap = await getDocs(userTxCol(uid));
  await Promise.all(snap.docs.map(d => deleteDoc(userTxDoc(uid, d.id))));
  await Promise.all([loadRecentInvoices(), updateStats()]);
  showSuccess('Todas as faturas eliminadas!');
  showLoading(false);
}

  // Visualizar fatura
/* 5. Operações sobre uma única fatura                           */
// Ver
window.viewInvoice = async id => {
  if (!state.user) return;
  const d = await getDoc(userTxDoc(state.user.uid, id));
  if (!d.exists()) return showError('Fatura não encontrada');
  displayScannedData(d.data());
  switchTabById('scan-results');
};
/* -------------- versão ajustada para sub-colecção -------------- */
window.editInvoice = async id => {
  if (!state.user) return;                          // garante UID
  const uid   = state.user.uid;
  const snap  = await getDoc(userTxDoc(uid, id));   // /users/{uid}/recentTransactions/{id}
  if (!snap.exists()) return showError('Fatura não encontrada');

  const invoice = snap.data();

  document.getElementById('modal-edit').innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg p-8 min-w-[320px] max-w-md shadow-xl relative">
        <button onclick="closeEditModal()" class="absolute top-2 right-3 text-2xl text-gray-400 hover:text-red-600">&times;</button>
        <h2 class="text-xl font-bold mb-4">Editar Fatura</h2>
        <form id="edit-invoice-form" class="space-y-3">
          <!-- (inputs iguais aos seus) -->
        </form>
      </div>
    </div>`;
  document.body.classList.add('overflow-hidden');

  document.getElementById('edit-invoice-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const updatedData = {
      total:          parseFloat(f.total.value),
      iva:            parseFloat(f.iva.value),
      nif_emitente:   f.nif_emitente.value.trim(),
      tipo_documento: f.tipo_documento.value,
      categoria:      f.categoria.value
    };
    await updateDoc(userTxDoc(uid, id), updatedData);   // <-- caminho novo
    closeEditModal();
    loadRecentInvoices();
    updateStats();
    showSuccess('Fatura atualizada com sucesso!');
  };
};



// Função para fechar o modal de edição
window.closeEditModal = function() {
  document.getElementById('modal-edit').innerHTML = '';
  document.body.classList.remove('overflow-hidden');
}


  // Eliminar fatura individual
 window.deleteInvoice = id => {
  if (!state.user || !confirm('Eliminar esta fatura?')) return;
  deleteDoc(userTxDoc(state.user.uid, id))
    .then(() => { loadRecentInvoices(); updateStats(); showSuccess('Fatura eliminada!'); })
    .catch(() => showError('Erro ao eliminar fatura'));
};

  // Fechar modal
  window.closeModal = () => {
    const m = document.querySelector('div.fixed.inset-0');
    if (m) m.remove();
  };

  // Confirmar e cancelar previews
  function cancelSave() {
    pendingInvoice = null;
    clearResults();
    if (scannerPaused) { initScanner(); document.getElementById('toggle-scanner').textContent='⏸️ Pausar Scanner'; scannerPaused=false; }
  }
  function confirmSave() {
    if (!pendingInvoice) return;
    guardarFatura(pendingInvoice);
    displayScannedData(pendingInvoice);
    pendingInvoice = null;
    setTimeout(() => { if (!scannerPaused) { initScanner(); isScanning=false; } }, 2000);
  }
});
/* ------------------------------------------------------------- */
/* Helpers Firestore – novos                                    */
function userTxCol(uid)          { return collection(db, 'users', uid, 'recentTransactions'); }
function userTxDoc(uid, docId)   { return doc(db, 'users', uid, 'recentTransactions', docId); }
