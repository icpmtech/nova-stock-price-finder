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
  query,
  orderBy,
  limit,
  addDoc,    // para guardar
  deleteDoc, // para eliminar
  doc        // para referenciar um doc específico
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Estado e elementos
const state = { userEmail: null };
const els = {
  userName: document.getElementById('userName'),
  signOutBtn: document.getElementById('signOutBtn')
};

// Autenticação e redireção se não estiver logado
onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = '/login.html';
    return;
  }
  state.userEmail = user.email;
  if (els.userName)
    els.userName.textContent = user.displayName || user.email.split('@')[0];
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

// Função para parse do QR e montagem de objeto
function parseFaturaQR(qr) {
  console.log('Parsing QR:', qr);
  const partes = qr
    .split(/[\*;\r?\n]/)
    .map(p => p.trim())
    .filter(p => p.includes(':'));
  const acc = {};
  partes.forEach(par => {
    const [key, ...rest] = par.split(':');
    acc[key.trim()] = rest.join(':').trim();
  });
  let data = null;
  if (acc.F && /^\d{8}$/.test(acc.F)) {
    const y = acc.F.slice(0,4), m = acc.F.slice(4,6), d = acc.F.slice(6,8);
    data = `${d}/${m}/${y}`;
  } else {
    data = acc.F || null;
  }
  return {
    pais: acc.C || null,
    nif_emitente: acc.A || null,
    data,
    total: acc.O ? parseFloat(acc.O.replace(',', '.')) : 0,
    iva: acc.I6 ? parseFloat(acc.I6.replace(',', '.')) : 0,
    outros: JSON.stringify(
      Object.fromEntries(
        Object.entries(acc).filter(([k]) => !['A','C','F','O','I6'].includes(k))
      )
    ),
    timestamp: new Date().toISOString(),
    qr_original: qr
  };
}

// Gravar no Firestore
async function guardarFatura(dados) {
  try {
    showLoading(true);
    const docRef = await addDoc(collection(db, 'faturas'), dados);
    console.log('Fatura guardada com ID:', docRef.id);
    showSuccess('Fatura guardada com sucesso!');
    updateStats();
    await loadRecentInvoices();
  } catch (e) {
    console.error('Erro ao guardar fatura:', e);
    showError('Erro ao guardar fatura. Tente novamente.');
  } finally {
    showLoading(false);
  }
}

// Carregar últimas 5 faturas
async function loadRecentInvoices() {
  try {
    const q = query(collection(db, 'faturas'), orderBy('timestamp', 'desc'), limit(5));
    const snap = await getDocs(q);
    const inv = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    displayRecentInvoices(inv);
  } catch (e) {
    console.error('Erro ao carregar faturas:', e);
  }
}

// Exibir faturas recentes
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
        <p><strong class="font-semibold">IVA:</strong> €${inv.iva.toFixed(2)}</p>
      </div>
      <div class="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
        <button class="px-3 py-1 border border-primary text-primary rounded text-sm hover:bg-primary hover:text-white transition" onclick="viewInvoice('${inv.id}')">👁️ Ver</button>
        <button class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition" onclick="deleteInvoice('${inv.id}')">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}

// Formatar data
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// Estatísticas gerais
async function updateStats() {
  try {
    const snap = await getDocs(collection(db, 'faturas'));
    totalFaturas = snap.size;
    totalValor = snap.docs.reduce((sum, d) => sum + (d.data().total || 0), 0);
    document.getElementById('total-faturas').textContent = totalFaturas;
    document.getElementById('total-valor').textContent = totalValor.toFixed(2);
  } catch (e) {
    console.error('Erro ao atualizar estatísticas:', e);
  }
}

// Mostrar loading
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
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
  updateStats();
  loadRecentInvoices();
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
    document.getElementById('output').innerHTML = `
      <div class="bg-teal-500 bg-opacity-90 text-white p-6 rounded-lg mb-4">
        <h3 class="text-xl font-semibold mb-4">👁️ Pré-visualização da Fatura</h3>
        <div class="bg-yellow-200 border border-yellow-300 p-3 rounded mb-4 text-center text-gray-800">⚠️ Confirme os dados antes de guardar</div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>Total:</span><span>€${dados.total.toFixed(2)}</span></div>
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>IVA:</span><span>€${dados.iva.toFixed(2)}</span></div>
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>NIF:</span><span>${dados.nif_emitente}</span></div>
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>Data:</span><span>${dados.data}</span></div>
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>País:</span><span>${dados.pais}</span></div>
          <div class="flex justify-between items-center p-2 bg-white/20 rounded"><span>Outros:</span><span>${dados.outros}</span></div>
        </div>
        <div class="flex space-x-4 mt-6">
          <button id="cancel-save" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">❌ Cancelar</button>
          <button id="edit-invoice" class="px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white">✏️ Editar</button>
          <button id="confirm-save" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">💾 Confirmar e Guardar</button>
        </div>
      </div>
    `;
    document.getElementById('cancel-save').addEventListener('click', cancelSave);
    document.getElementById('edit-invoice').addEventListener('click', () => editInvoice(pendingInvoice));
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
  function exportData() {
    getDocs(collection( db,'faturas')).then(snap => {
      const rows = snap.docs.map(d => [d.id, d.data().nif_emitente||'', d.data().data||'', d.data().total, d.data().iva, d.data().timestamp].join(','));
      const csv = 'data:text/csv;charset=utf-8,ID,NIF,Data,Total,IVA,Timestamp\n' + rows.join('\n');
      const link = document.createElement('a'); link.href = encodeURI(csv); link.download = 'faturas.csv'; link.click(); showSuccess('Dados exportados!');
    }).catch(() => showError('Erro ao exportar dados'));
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
  function switchTabById(id) {
    document.querySelector(`[data-tab="${id}"]`).click();
  }

  // Eliminar todas as faturas
  async function deleteAllInvoices() {
    if (!confirm('Eliminar todas as faturas?')) return;
    try {
      showLoading(true);
      const snap = await getDocs(collection(db,'faturas'));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db,'faturas',d.id))));
      await loadRecentInvoices();
      await updateStats();
      showSuccess('Todas as faturas eliminadas!');
    } catch {
      showError('Erro ao eliminar faturas');
    } finally {
      showLoading(false);
    }
  }

  // Visualizar fatura
  window.viewInvoice = id => {
    loadRecentInvoices().then(() => {
      getDocs(query(collection(db,'faturas'))).then(snap => {
        const d = snap.docs.find(doc => doc.id === id);
        if (d) {
          displayScannedData(d.data());
          switchTabById('scan-results');
        }
      });
    });
  };

  // Eliminar fatura individual
  window.deleteInvoice = id => {
    if (!confirm('Eliminar esta fatura?')) return;
    deleteDoc(doc(db,'faturas',id)).then(() => {
      loadRecentInvoices();
      updateStats();
      showSuccess('Fatura eliminada!');
    }).catch(() => showError('Erro ao eliminar fatura'));
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
