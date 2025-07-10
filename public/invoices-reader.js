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
    limit
  } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

  // Estado e elementos
  const state = {
    userEmail: null
  };

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

    // 2. Função para parse e guardar no Firestore
    function parseFaturaQR(qr) {
      const campos = qr.split(';').reduce((acc, par) => {
        const [chave, valor] = par.split(':');
        if (chave && valor) acc[chave] = valor;
        return acc;
      }, {});
      
      return {
        pais: campos.A || null,
        nif_emitente: campos.B || null,
        data: campos.C || null,
        total: parseFloat(campos.D) || 0,
        iva: parseFloat(campos.E) || 0,
        outros: campos.F || null,
        timestamp: new Date().toISOString(),
        qr_original: qr
      };
    }

    async function guardarFatura(dados) {
      try {
        showLoading(true);
        const docRef = await addDoc(collection(db, "faturas"), dados);
        console.log("Fatura guardada com ID:", docRef.id);
        showSuccess("Fatura guardada com sucesso!");
        updateStats();
        await loadRecentInvoices();
      } catch (e) {
        console.error("Erro ao guardar fatura:", e);
        showError("Erro ao guardar fatura. Tente novamente.");
      } finally {
        showLoading(false);
      }
    }

    async function loadRecentInvoices() {
      try {
        const q = query(collection(db, "faturas"), orderBy("timestamp", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        const invoices = [];
        
        querySnapshot.forEach((doc) => {
          invoices.push({ id: doc.id, ...doc.data() });
        });
        
        displayRecentInvoices(invoices);
      } catch (e) {
        console.error("Erro ao carregar faturas:", e);
      }
    }

    function displayRecentInvoices(invoices) {
              const container = document.getElementById('recent-invoices-list');
      if (invoices.length === 0) {
        container.innerHTML = '<p class="no-invoices">Nenhuma fatura encontrada</p>';
        return;
      }

      container.innerHTML = invoices.map(invoice => `
        <div class="invoice-card">
          <div class="invoice-header">
            <span class="invoice-amount">€${invoice.total.toFixed(2)}</span>
            <span class="invoice-date">${formatDate(invoice.timestamp)}</span>
          </div>
          <div class="invoice-details">
            <p><strong>NIF:</strong> ${invoice.nif_emitente || 'N/A'}</p>
            <p><strong>IVA:</strong> €${invoice.iva.toFixed(2)}</p>
          </div>
          <div class="invoice-actions">
            <button class="btn btn-small btn-outline" onclick="viewInvoice('${invoice.id}')">👁️ Ver</button>
            <button class="btn btn-small btn-danger" onclick="deleteInvoice('${invoice.id}')">🗑️ Eliminar</button>
          </div>
        </div>
      `).join('');
    }

    function formatDate(timestamp) {
      return new Date(timestamp).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    async function updateStats() {
      try {
        const querySnapshot = await getDocs(collection(db, "faturas"));
        totalFaturas = querySnapshot.size;
        totalValor = 0;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          totalValor += data.total || 0;
        });
        
        document.getElementById('total-faturas').textContent = totalFaturas;
        document.getElementById('total-valor').textContent = totalValor.toFixed(2);
      } catch (e) {
        console.error("Erro ao atualizar estatísticas:", e);
      }
    }

    function showLoading(show) {
      const loader = document.getElementById('loading');
      loader.style.display = show ? 'flex' : 'none';
    }

    function showSuccess(message) {
      showNotification(message, 'success');
    }

    function showError(message) {
      showNotification(message, 'error');
    }

    function showNotification(message, type) {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('show');
      }, 100);
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // 3. QR Code Scan + Display
    window.addEventListener("DOMContentLoaded", () => {

document.getElementById('upload-image').addEventListener('click', () => {
  document.getElementById('image-input').click();
});

document.getElementById('image-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      const dados = parseFaturaQR(code.data);
      pendingInvoice = dados;
      showPreview(dados);
      document.getElementById('scan-status').textContent = '✅ Código lido de imagem!';
      showSuccess("Código lido da imagem com sucesso!");
    } else {
      document.getElementById('scan-status').textContent = '❌ QR Code não detetado na imagem.';
      showError("QR Code não detetado na imagem.");
    }
  };
  img.src = URL.createObjectURL(file);
});


      function onScanSuccess(decodedText, decodedResult) {
        if (isScanning) return;
        isScanning = true;
        
        const dados = parseFaturaQR(decodedText);
        pendingInvoice = dados;
        showPreview(dados);
        
        // Stop scanning temporarily
        html5QrcodeScanner.clear().then(() => {
          document.getElementById('scan-status').textContent = 'QR Code lido - Confirme os dados';
          setTimeout(() => {
            if (!pendingInvoice) {
              initScanner();
              isScanning = false;
            }
          }, 1000);
        });
      }

      function onScanFailure(error) {
        // Handle scan failure silently
      }

      function initScanner() {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        }, false);
        
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        document.getElementById('scan-status').textContent = 'Pronto para escanear';
      }

      function displayScannedData(dados) {
        const output = document.getElementById('output');
        output.innerHTML = `
          <div class="scanned-data">
            <h3>✅ Fatura Guardada</h3>
            <div class="data-grid">
              <div class="data-item">
                <span class="label">Total:</span>
                <span class="value">€${dados.total.toFixed(2)}</span>
              </div>
              <div class="data-item">
                <span class="label">IVA:</span>
                <span class="value">€${dados.iva.toFixed(2)}</span>
              </div>
              <div class="data-item">
                <span class="label">NIF:</span>
                <span class="value">${dados.nif_emitente || 'N/A'}</span>
              </div>
              <div class="data-item">
                <span class="label">Data:</span>
                <span class="value">${dados.data || 'N/A'}</span>
              </div>
            </div>
          </div>
        `;
      }

      function showPreview(dados) {
        const output = document.getElementById('output');
        output.innerHTML = `
          <div class="preview-data">
            <h3>👁️ Pré-visualização da Fatura</h3>
            <div class="preview-notice">
              <p>⚠️ Confirme os dados antes de guardar</p>
            </div>
            <div class="data-grid">
              <div class="data-item">
                <span class="label">Total:</span>
                <span class="value">€${dados.total.toFixed(2)}</span>
              </div>
              <div class="data-item">
                <span class="label">IVA:</span>
                <span class="value">€${dados.iva.toFixed(2)}</span>
              </div>
              <div class="data-item">
                <span class="label">NIF:</span>
                <span class="value">${dados.nif_emitente || 'N/A'}</span>
              </div>
              <div class="data-item">
                <span class="label">Data:</span>
                <span class="value">${dados.data || 'N/A'}</span>
              </div>
              <div class="data-item">
                <span class="label">País:</span>
                <span class="value">${dados.pais || 'N/A'}</span>
              </div>
              <div class="data-item">
                <span class="label">Outros:</span>
                <span class="value">${dados.outros || 'N/A'}</span>
              </div>
            </div>
            <div class="preview-actions">
              <button id="cancel-save" class="btn btn-secondary">❌ Cancelar</button>
              <button id="edit-invoice" class="btn btn-outline">✏️ Editar</button>
              <button id="confirm-save" class="btn btn-primary">💾 Confirmar e Guardar</button>
            </div>
          </div>
        `;

        // Add event listeners for preview actions
        document.getElementById('cancel-save').addEventListener('click', cancelSave);
        document.getElementById('edit-invoice').addEventListener('click', () => editInvoice(dados));
        document.getElementById('confirm-save').addEventListener('click', confirmSave);
      }

      // Initialize
      initScanner();
      updateStats();
      loadRecentInvoices();
      setupButtonEvents();

      // Tab functionality
      document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
          const tabName = button.dataset.tab;
          
          // Update active tab
          document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          
          button.classList.add('active');
          document.getElementById(tabName).classList.add('active');
        });
      });

      function setupButtonEvents() {
        // Scanner controls
        document.getElementById('toggle-scanner').addEventListener('click', toggleScanner);
        document.getElementById('switch-camera').addEventListener('click', switchCamera);
        
        // Stats actions
        document.getElementById('refresh-stats').addEventListener('click', refreshStats);
        document.getElementById('export-data').addEventListener('click', exportData);
        
        // Scan actions
        document.getElementById('clear-results').addEventListener('click', clearResults);
        document.getElementById('manual-input').addEventListener('click', showManualInput);
        
        // Invoice actions
        document.getElementById('refresh-invoices').addEventListener('click', loadRecentInvoices);
        document.getElementById('delete-all').addEventListener('click', deleteAllInvoices);
      }

      function toggleScanner() {
        const button = document.getElementById('toggle-scanner');
        if (scannerPaused) {
          initScanner();
          button.innerHTML = '⏸️ Pausar Scanner';
          scannerPaused = false;
        } else {
          html5QrcodeScanner.clear();
          button.innerHTML = '▶️ Iniciar Scanner';
          scannerPaused = true;
          document.getElementById('scan-status').textContent = 'Scanner pausado';
        }
      }

      async function switchCamera() {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices.length > 1) {
            currentCamera = (currentCamera + 1) % devices.length;
            html5QrcodeScanner.clear().then(() => {
              initScanner();
              showSuccess(`Câmera trocada para: ${devices[currentCamera].label}`);
            });
          } else {
            showError('Apenas uma câmera disponível');
          }
        } catch (e) {
          showError('Erro ao trocar câmera');
        }
      }

      function refreshStats() {
        showLoading(true);
        updateStats().then(() => {
          showLoading(false);
          showSuccess('Estatísticas atualizadas!');
        });
      }

      function exportData() {
        getDocs(collection(db, "faturas")).then(querySnapshot => {
          const data = [];
          querySnapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
          });
          
          const csvContent = "data:text/csv;charset=utf-8," + 
            "ID,NIF,Data,Total,IVA,Timestamp\n" +
            data.map(row => `${row.id},${row.nif_emitente || ''},${row.data || ''},${row.total},${row.iva},${row.timestamp}`).join('\n');
          
          const link = document.createElement('a');
          link.setAttribute('href', encodeURI(csvContent));
          link.setAttribute('download', 'faturas_wallet360.csv');
          link.click();
          
          showSuccess('Dados exportados com sucesso!');
        }).catch(e => {
          showError('Erro ao exportar dados');
        });
      }

      function clearResults() {
        pendingInvoice = null;
        document.getElementById('output').innerHTML = `
          <div style="text-align: center; color: #666; padding: 40px;">
            <h3>🔍 Aguardando leitura...</h3>
            <p>Aponte a câmera para o QR code da fatura</p>
          </div>
        `;
        if (scannerPaused) {
          initScanner();
          document.getElementById('toggle-scanner').innerHTML = '⏸️ Pausar Scanner';
          scannerPaused = false;
        }
        showSuccess('Resultados limpos!');
      }

      function showManualInput() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h3>✍️ Inserir Fatura Manual</h3>
            <form id="manual-form">
              <div class="form-group">
                <label>NIF Emitente:</label>
                <input type="text" id="manual-nif" placeholder="Ex: 123456789" required>
              </div>
              <div class="form-group">
                <label>Total (€):</label>
                <input type="number" id="manual-total" step="0.01" placeholder="Ex: 25.50" required>
              </div>
              <div class="form-group">
                <label>IVA (€):</label>
                <input type="number" id="manual-iva" step="0.01" placeholder="Ex: 5.29" required>
              </div>
              <div class="form-group">
                <label>Data:</label>
                <input type="date" id="manual-data" required>
              </div>
              <div class="form-group">
                <label>País:</label>
                <input type="text" id="manual-pais" placeholder="Ex: PT" value="PT">
              </div>
              <div class="form-group">
                <label>Outros (opcional):</label>
                <input type="text" id="manual-outros" placeholder="Informações adicionais">
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">👁️ Pré-visualizar</button>
              </div>
            </form>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set today's date as default
        document.getElementById('manual-data').value = new Date().toISOString().split('T')[0];
        
        document.getElementById('manual-form').addEventListener('submit', (e) => {
          e.preventDefault();
          const dados = {
            nif_emitente: document.getElementById('manual-nif').value,
            total: parseFloat(document.getElementById('manual-total').value),
            iva: parseFloat(document.getElementById('manual-iva').value),
            data: document.getElementById('manual-data').value,
            pais: document.getElementById('manual-pais').value || 'PT',
            outros: document.getElementById('manual-outros').value || null,
            timestamp: new Date().toISOString(),
            qr_original: 'MANUAL_INPUT'
          };
          
          pendingInvoice = dados;
          showPreview(dados);
          closeModal();
          
          // Switch to scan results tab
          document.querySelector('[data-tab="scan-results"]').click();
        });
      }

      async function deleteAllInvoices() {
        if (confirm('Tem certeza que deseja eliminar todas as faturas?')) {
          try {
            showLoading(true);
            const querySnapshot = await getDocs(collection(db, "faturas"));
            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            
            await loadRecentInvoices();
            await updateStats();
            showSuccess('Todas as faturas foram eliminadas!');
          } catch (e) {
            showError('Erro ao eliminar faturas');
          } finally {
            showLoading(false);
          }
        }
      }

      window.viewInvoice = function(id) {
        getDocs(collection(db, "faturas")).then(querySnapshot => {
          querySnapshot.forEach(doc => {
            if (doc.id === id) {
              const data = doc.data();
              displayScannedData(data);
              document.querySelector('[data-tab="scan-results"]').click();
            }
          });
        });
      };

      window.deleteInvoice = function(id) {
        if (confirm('Eliminar esta fatura?')) {
          import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js').then(({ deleteDoc, doc }) => {
            deleteDoc(doc(db, "faturas", id)).then(() => {
              loadRecentInvoices();
              updateStats();
              showSuccess('Fatura eliminada!');
            }).catch(e => {
              showError('Erro ao eliminar fatura');
            });
          });
        }
      };

      window.closeModal = function() {
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
      };

      // Preview action functions
      function cancelSave() {
        pendingInvoice = null;
        clearResults();
        if (scannerPaused) {
          initScanner();
          document.getElementById('toggle-scanner').innerHTML = '⏸️ Pausar Scanner';
          scannerPaused = false;
        }
      }

      function confirmSave() {
        if (pendingInvoice) {
          guardarFatura(pendingInvoice);
          displayScannedData(pendingInvoice);
          pendingInvoice = null;
          
          // Restart scanner after a delay
          setTimeout(() => {
            if (!scannerPaused) {
              initScanner();
              isScanning = false;
            }
          }, 2000);
        }
      }

      function editInvoice(dados) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h3>✏️ Editar Fatura</h3>
            <form id="edit-form">
              <div class="form-group">
                <label>NIF Emitente:</label>
                <input type="text" id="edit-nif" value="${dados.nif_emitente || ''}" required>
              </div>
              <div class="form-group">
                <label>Total (€):</label>
                <input type="number" id="edit-total" step="0.01" value="${dados.total}" required>
              </div>
              <div class="form-group">
                <label>IVA (€):</label>
                <input type="number" id="edit-iva" step="0.01" value="${dados.iva}" required>
              </div>
              <div class="form-group">
                <label>Data:</label>
                <input type="date" id="edit-data" value="${dados.data || ''}" required>
              </div>
              <div class="form-group">
                <label>País:</label>
                <input type="text" id="edit-pais" value="${dados.pais || 'PT'}">
              </div>
              <div class="form-group">
                <label>Outros (opcional):</label>
                <input type="text" id="edit-outros" value="${dados.outros || ''}">
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">👁️ Atualizar Pré-visualização</button>
              </div>
            </form>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('edit-form').addEventListener('submit', (e) => {
          e.preventDefault();
          const dadosEditados = {
            nif_emitente: document.getElementById('edit-nif').value,
            total: parseFloat(document.getElementById('edit-total').value),
            iva: parseFloat(document.getElementById('edit-iva').value),
            data: document.getElementById('edit-data').value,
            pais: document.getElementById('edit-pais').value || 'PT',
            outros: document.getElementById('edit-outros').value || null,
            timestamp: new Date().toISOString(),
            qr_original: dados.qr_original
          };
          
          pendingInvoice = dadosEditados;
          showPreview(dadosEditados);
          closeModal();
        });
      }
    });