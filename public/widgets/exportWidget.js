// --- exportWidget.js ---
export class ExportWidget {
  constructor(buttonEl) {
    this.buttonEl = buttonEl;
  }
  init(getDataFn) {
    this.getData = getDataFn;
    this.buttonEl.addEventListener('click', () => this.exportCSV());
  }
  exportCSV() {
    const rows = this.getData().map(t => [
      t.symbol, t.operation, t.amount, t.price, t.fee, t.date
    ]);
    rows.unshift(['Símbolo','Op.','Qtd','Preço','Taxa','Data']);
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transacoes.csv'; a.click();
  }
}
