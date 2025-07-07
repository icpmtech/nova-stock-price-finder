// --- main.js ---
import { AuthWidget } from './widgets/authWidget.js';
import { FilterWidget } from './widgets/filterWidget.js';
import { TableWidget } from './widgets/tableWidget.js';
import { ExportWidget } from './widgets/exportWidget.js';
import { MarketWidget } from './widgets/marketWidget.js';
import { ChartWidget } from './widgets/chartWidget.js';

window.addEventListener('DOMContentLoaded', () => {
  // Element references
  const auth = new AuthWidget(
    document.getElementById('signOutBtn'),
    document.getElementById('userEmail')
  );
  const filters = new FilterWidget(
    document.getElementById('filterSymbol'),
    document.getElementById('filterStart'),
    document.getElementById('filterEnd')
  );
  const table = new TableWidget(document.getElementById('transactionTbody'));
  const exporter = new ExportWidget(document.getElementById('exportCsv'));
  const market = new MarketWidget();

  const profitChart = new ChartWidget(
    document.getElementById('profitChart').getContext('2d'),
    { type: 'line', options: { scales:{ x:{ type:'time', time:{unit:'day'}}, y:{ beginAtZero:true }}}}
  );
  const monthlyChart = new ChartWidget(
    document.getElementById('monthlyProfitChart').getContext('2d'),
    { type: 'bar', options: { scales:{ y:{ beginAtZero:true }}} }
  );
  const symbolChart = new ChartWidget(
    document.getElementById('symbolProfitChart').getContext('2d'),
    { type: 'doughnut' }
  );

  let state = { all: [], filtered: [], market: {}, profitData: [], monthly: {}, symbol: {} };

  window.addEventListener('userAuthenticated', async e => {
    const email = e.detail;
    const res = await fetch(`/api/transactions?user=${encodeURIComponent(email)}`);
    state.all = await res.json();
    filters.setSymbols([...new Set(state.all.map(t=>t.symbol))]);
    exporter.init(() => state.filtered);
    filters.onChange(() => update());
    update();
    setInterval(() => market.fetchSymbols([...new Set(state.filtered.map(t=>t.symbol))]), 30000);
    market.fetchSymbols([...new Set(state.filtered.map(t=>t.symbol))]);
  });

  market.onUpdate(prices => {
    state.market = prices;
    updateTable();
  });

  async function update() {
    const { symbol, start, end } = filters;
    state.filtered = state.all.filter(t => {
      const d = t.date.split('T')[0];
      return (!symbol.value || t.symbol === symbol.value)
        && (!start.value || d>=start.value)
        && (!end.value || d<=end.value);
    });
    await market.fetchSymbols([...new Set(state.filtered.map(t=>t.symbol))]);
    computeProfits();
    updateTable();
    updateCharts();
  }

  function computeProfits() {
    const fifo = {};
    state.profitData = [];
    state.monthly = {};
    state.symbol = {};
    const today = new Date().toISOString().split('T')[0];
    state.totalProfit = 0;
    state.todayProfit = 0;

    state.filtered.forEach(t => {
      if (t.operation === 'buy') {
        fifo[t.symbol] = fifo[t.symbol]||[];
        fifo[t.symbol].push({qty:t.amount,price:t.price});
        return;
      }
      let qty = t.amount, p=0;
      while(qty>0 && fifo[t.symbol].length){
        const lot = fifo[t.symbol][0];
        const used = Math.min(qty,lot.qty);
        p += used*(t.price-lot.price);
        lot.qty -= used; qty-=used;
        if(!lot.qty) fifo[t.symbol].shift();
      }
      t.profit = p; t.profitStr = p.toFixed(2);
      state.totalProfit+=p;
      if(t.date.split('T')[0]===today) state.todayProfit+=p;
      state.profitData.push({x:t.date,y:p});
      const month=t.date.slice(0,7);
      state.monthly[month]=(state.monthly[month]||0)+p;
      state.symbol[t.symbol]=(state.symbol[t.symbol]||0)+p;
    });
    document.getElementById('totalProfit').textContent = state.totalProfit.toFixed(2);
    document.getElementById('todayProfit').textContent = state.todayProfit.toFixed(2);
  }

  function updateTable() { table.renderRows(state.filtered, state.market); }
  function updateCharts() {
    profitChart.render([{label:'Lucro por Venda',data:state.profitData,borderColor:'rgba(14,165,233,1)',backgroundColor:'rgba(14,165,233,0.2)',fill:true,tension:0.3}], null);
    monthlyChart.render([{label:'Lucro por Mês',data:Object.values(state.monthly)}], Object.keys(state.monthly).sort());
    symbolChart.render([{label:'Lucro por Símbolo',data:Object.values(state.symbol),backgroundColor:Object.keys(state.symbol).map(()=>`hsl(${Math.random()*360},70%,60%)`)}], Object.keys(state.symbol));
  }
});
