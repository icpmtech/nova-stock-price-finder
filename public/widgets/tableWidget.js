// --- tableWidget.js ---
export class TableWidget {
  constructor(tbodyEl) {
    this.tbodyEl = tbodyEl;
  }
  renderRows(transactions, marketPrices) {
    this.tbodyEl.innerHTML = '';
    transactions.forEach(t => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-primary-100';
      const market = marketPrices[t.symbol] != null ?
        `€${marketPrices[t.symbol].toFixed(2)}` : '--';
      tr.innerHTML = `
        <td>${t.symbol}</td><td>${t.operation}</td><td>${t.amount}</td>
        <td>€${t.price.toFixed(2)}</td><td>${market}</td>
        <td>€${t.fee.toFixed(2)}</td><td>${new Date(t.date).toLocaleDateString()}</td>
        <td class="${t.profit>=0?'text-green-400':'text-red-400'}">${t.profitStr}</td>
        <td>🗑️ ✏️</td>`;
      this.tbodyEl.appendChild(tr);
    });
  }
}
