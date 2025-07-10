import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { collection, getDocs, query, orderBy, limit, addDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const state = { userEmail: null };
const els = {
  userName: document.getElementById('userName'),
  signOutBtn: document.getElementById('signOutBtn')
};

onAuthStateChanged(auth, user => {
  if (!user) return location.href = '/login.html';
  state.userEmail = user.email;
  if (els.userName)
    els.userName.textContent = user.displayName || user.email.split('@')[0];
});

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

function parseFaturaQR(qr) {
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
    data = `${acc.F.slice(6,8)}/${acc.F.slice(4,6)}/${acc.F.slice(0,4)}`;
  } else if (acc.D && /^\d{8}$/.test(acc.D)) {
    data = `${acc.D.slice(6,8)}/${acc.D.slice(4,6)}/${acc.D.slice(0,4)}`;
  } else {
    data = acc.F || acc.D || null;
  }
  const pais = acc.C || acc.I1 || null;
  const nif_emitente = acc.A || acc.B || null;
  const totalRaw = acc.O ?? acc.D ?? '0';
  const total = parseFloat(totalRaw.replace(',', '.')) || 0;
  const ivaRaw = acc.N ?? acc.I6 ?? acc.I5 ?? acc.I4 ?? acc.I3 ?? acc.E ?? '0';
  const iva = parseFloat(ivaRaw.replace(',', '.')) || 0;
  const exclude = ['A','B','C','D','E','F','O','N','I1','I3','I4','I5','I6'];
  const outros = JSON.stringify(
    Object.fromEntries(
      Object.entries(acc).filter(([k]) => !exclude.includes(k))
    )
  );
  return {
    pais,
    nif_emitente,
    data,
    total,
    iva,
    outros,
    timestamp: new Date().toISOString(),
    qr_original: qr
  };
}

async function guardarFatura(dados) {
  try {
    showLoading(true);
    const docRef = await addDoc(collection(db, 'faturas'), dados);
    showSuccess('Fatura guardada com sucesso!');
    updateStats();
    await loadRecentInvoices();
  } catch {
    showError('Erro ao guardar fatura.');
  } finally {
    showLoading(false);
  }
}

async function loadRecentInvoices() {
  try {
    const q = query(collection(db, 'faturas'), orderBy('timestamp','desc'), limit(5));
    const snap = await getDocs(q);
    displayRecentInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch {}
}

function displayRecentInvoices(invoices) {
  const container = document.getElementById('recent-invoices-list');
  if (!invoices.length) return container.innerHTML = '<p class="text-gray-500 italic text-center py-10">Nenhuma fatura encontrada</p>';
  container.innerHTML = invoices.map(inv => `
    <div class="bg-gray-100 rounded-lg p-5 mb-4 border-l-4 border-primary hover:shadow-lg transform hover:-translate-y-1 transition">
      <div class="flex justify-between items-center mb-2">
        <span class="text-lg font-bold text-green-500">€${inv.total.toFixed(2)}</span>
        <span class="text-sm text-gray-600">${formatDate(inv.timestamp)}</span>
      </div>
      <div class="space-y-1 text-gray-700">
        <p><strong class="font-semibold">NIF:</strong> ${inv.nif_emitente||'N/A'}</p>
        <p><strong class="font-semibold">IVA:</strong> €${inv.iva.toFixed(2)}</p>
      </div>
      <div class="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
        <button onclick="viewInvoice('${inv.id}')" class="px-3 py-1 border border-primary text-primary rounded text-sm hover:bg-primary hover:text-white transition">👁️ Ver</button>
        <button onclick="deleteInvoice('${inv.id}')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('pt-PT',{
    day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'
  });
}

async function updateStats() {
  try {
    const snap = await getDocs(collection(db,'faturas'));
    totalFaturas = snap.size;
    totalValor = snap.docs.reduce((s,d)=>s + (d.data().total||0),0);
    document.getElementById('total-faturas').textContent = totalFaturas;
    document.getElementById('total-valor').textContent = totalValor.toFixed(2);
  } catch {}
}

function showLoading(show) { document.getElementById('loading').style.display = show?'flex':'none'; }
function showSuccess(msg) { showNotification(msg,'success'); }
function showError(msg)   { showNotification(msg,'error');   }
function showNotification(message,type) {
  const n=document.createElement('div');
  n.className=`fixed top-5 right-5 px-5 py-3 rounded-lg text-white font-medium transform translate-x-full transition z-[1100] ${type==='success'?'bg-green-500':'bg-red-500'}`;
  n.textContent=message;
  document.body.appendChild(n);
  setTimeout(()=>n.classList.remove('translate-x-full'),100);
  setTimeout(()=>n.remove(),3000);
}

window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('upload-image').addEventListener('click',()=>document.getElementById('image-input').click());
  document.getElementById('image-input').addEventListener('change',handleImageUpload);

  function onScanSuccess(txt) {
    if(isScanning) return;
    isScanning=true;
    pendingInvoice=parseFaturaQR(txt);
    showPreview(pendingInvoice);
    html5QrcodeScanner.clear().then(()=>{
      document.getElementById('scan-status').textContent='QR Code lido - confirme os dados';
      setTimeout(()=>{initScanner(); isScanning=false;},1000);
    });
  }
  function onScanFailure(){}
  function initScanner(){
    html5QrcodeScanner=new Html5QrcodeScanner('reader',{fps:10,qrbox:{width:250,height:250},aspectRatio:1.0},false);
    html5QrcodeScanner.render(onScanSuccess,onScanFailure);
    document.getElementById('scan-status').textContent='Pronto para escanear';
  }

  initScanner(); updateStats(); loadRecentInvoices(); setupButtonEvents();

  function handleImageUpload(e){
    const file=e.target.files[0]; if(!file) return;
    const img=new Image(); img.onload=()=>{
      const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
      const ctx=c.getContext('2d'); ctx.drawImage(img,0,0);
      const code=jsQR(ctx.getImageData(0,0,c.width,c.height).data,c.width,c.height);
      if(code){ pendingInvoice=parseFaturaQR(code.data); showPreview(pendingInvoice); document.getElementById('scan-status').textContent='✅ Código lido de imagem!'; showSuccess('Código lido de imagem!'); }
      else{ document.getElementById('scan-status').textContent='❌ Não detectado.'; showError('QR não detectado'); }
    };
    img.src=URL.createObjectURL(file);
  }

  function displayScannedData(dados){
    document.getElementById('output').innerHTML=`<div class="bg-gradient-to-br from-green-500 to-green-400 text-white p-6 rounded-lg mb-4"><h3 class="text-xl font-semibold mb-4">✅ Fatura Guardada</h3><div class="grid grid-cols-2 gap-4"><div class="flex justify-between bg-white/20 p-2 rounded"><span>Total:</span><span>€${dados.total.toFixed(2)}</span></div><div class="flex justify-between bg-white/20 p-2 rounded"><span>IVA:</span><span>€${dados.iva.toFixed(2)}</span></div><div class="flex justify-between bg-white/20 p-2 rounded"><span>NIF:</span><span>${dados.nif_emitente}</span></div><div class="flex justify-between bg-white/20 p-2 rounded"><span>Data:</span><span>${dados.data}</span></div></div></div>`;
  }

  function showPreview(dados){
    document.getElementById('output').innerHTML=`<div class="bg-teal-500 bg-opacity-90 text-white p-6 rounded-lg mb-4"><h3 class="text-xl font-semibold mb-4">👁️ Pré-visualização da Fatura</h3><div class="bg-yellow-200 border-yellow-300 border p-3 rounded mb-4 text-gray-800 text-center">⚠️ Confirme os dados antes de guardar</div><div class="grid grid-cols-2 gap-4 mb-4"><div class="flex justify-between bg-white/20 p-2 rounded"><span>Total:</span><span>€${dados.total.toFixed(2)}</span></div><div class="flex justify-between bg-white/20 p-2 rounded"><span>IVA:</span><span>€${dados.iva.toFixed(2)}</span></div><div class="flex justify-between bg-white/20 p-2 rounded"><span>NIF:</span><span>${dados.nif_emitente}</span></div><div class="flex justify-between bg-white/20 p-2 rounded"><span>Data:</span><span>${dados.data}</span></div><div class="flex justify-between bg-white/20 p-2 rounded"><span>País:</span><span>${dados.pais}</span></div><div class="flex justify-between bg-white/20 p-2 rounded"><span>Outros:</span><span>${dados.outros}</span></div></div><div class="mb-4"><label class="block mb-1 font-semibold">Dados brutos (QR):</label><textarea readonly class="w-full p-2 rounded bg-white text-gray-800 h-24">${dados.qr_original}</textarea></div><div class="flex space-x-4 mt```
