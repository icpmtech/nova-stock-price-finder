
// --- filterWidget.js ---
export class FilterWidget {
  constructor(symbolEl, startEl, endEl) {
    this.symbolEl = symbolEl;
    this.startEl = startEl;
    this.endEl = endEl;
    this.filterChangeHandler = null;
    this.init();
  }
  init() {
    [this.symbolEl, this.startEl, this.endEl].forEach(el =>
      el.addEventListener('change', () => this.onFilterChange())
    );
  }
  onFilterChange() {
    if (this.filterChangeHandler) this.filterChangeHandler({
      symbol: this.symbolEl.value,
      start: this.startEl.value,
      end: this.endEl.value
    });
  }
  setSymbols(symbols) {
    this.symbolEl.innerHTML = '<option value="">Todos</option>' +
      symbols.map(s => `<option value="${s}">${s}</option>`).join('');
  }
  onChange(callback) {
    this.filterChangeHandler = callback;
  }
}
