// --- marketWidget.js ---
export class MarketWidget {
  constructor() {
    this.prices = {};
    this.updateHandler = null;
  }
  async fetchSymbols(symbols) {
    await Promise.all(symbols.map(async s => {
      try {
        const res = await fetch(`/api/stocks?symbol=${s}`);
        const j = await res.json();
        this.prices[s] = j.price;
      } catch { }
    }));
    if (this.updateHandler) this.updateHandler(this.prices);
  }
  onUpdate(callback) {
    this.updateHandler = callback;
  }
}