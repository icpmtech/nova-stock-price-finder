/* -------------------------------------------------------------------------- */
/*  charts-i18n.js – Charts com UX, Tailwind e suporte multilíngue            */
/* -------------------------------------------------------------------------- */
import { charts, destroyChart }           from './utils.js';
import { recentTransactionsData,
         exchangeRates }                  from './data.js';
import { settings }                       from './utils.js';
import { walletData }                     from './data.js';

/* ───────────────────────────── 1. i18n helper ───────────────────────────── */
export const locales = {
  en: {
    loadingChart:          'Loading chart…',
    noTxData:              'No transaction data available',
    noFinData:             'No financial data available',
    noSpendData:           'No spending data available',
    noCatFound:            'No expense categories found',
    addTxHint:             'Add some transactions to see your data visualization',
    error:                 'Error loading charts',
    refresh:               'Please try refreshing the page',
    /* Chart labels */
    netBalance:            'Net Balance',
    investments:           'Investments',
    expenses:              'Expenses',
    income:                'Income',
    /* Chart titles */
    portfolioTitle:        'Portfolio Overview',
    incomeVsExpenseTitle:  'Monthly Income vs Expenses',
    categoryTitle:         'Spending by Category'
  },
  pt: {
    loadingChart:          'Carregando gráfico…',
    noTxData:              'Nenhum dado de transação disponível',
    noFinData:             'Nenhum dado financeiro disponível',
    noSpendData:           'Nenhum dado de gastos disponível',
    noCatFound:            'Nenhuma categoria de despesa encontrada',
    addTxHint:             'Adicione transações para visualizar seus dados',
    error:                 'Erro ao carregar os gráficos',
    refresh:               'Tente atualizar a página',
    netBalance:            'Saldo Líquido',
    investments:           'Investimentos',
    expenses:              'Despesas',
    income:                'Receita',
    portfolioTitle:        'Visão Geral da Carteira',
    incomeVsExpenseTitle:  'Receita vs Despesa Mensal',
    categoryTitle:         'Gastos por Categoria'
  },
  es: {
    loadingChart:          'Cargando gráfico…',
    noTxData:              'No hay datos de transacciones disponibles',
    noFinData:             'No hay datos financieros disponibles',
    noSpendData:           'No hay datos de gastos disponibles',
    noCatFound:            'No se encontraron categorías de gasto',
    addTxHint:             'Agrega transacciones para ver la visualización',
    error:                 'Error al cargar los gráficos',
    refresh:               'Intenta actualizar la página',
    netBalance:            'Saldo Neto',
    investments:           'Inversiones',
    expenses:              'Gastos',
    income:                'Ingresos',
    portfolioTitle:        'Resumen de Portafolio',
    incomeVsExpenseTitle:  'Ingresos vs Gastos Mensuales',
    categoryTitle:         'Gastos por Categoría'
  }
};

const t = key => (locales[settings.currentLang] ?? locales.en)[key] ?? key;

/* Formatação de moeda conforme localidade atual */
export const formatCurrency = v =>
  new Intl.NumberFormat(settings.currentLang, {
    style: 'currency',
    currency: settings.currentCurrency,
    maximumFractionDigits: 2
  }).format(v);

/* ──────────────────────────── 2. Tema & animação ────────────────────────── */
const CHART_COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  danger:  '#ef4444',
  warning: '#f59e0b',
  info:    '#06b6d4',
  purple:  '#8b5cf6',
  pink:    '#ec4899',
  teal:    '#14b8a6',
  orange:  '#f97316',
  lime:    '#84cc16',
  cyan:    '#06b6d4',
  violet:  '#7c3aed'
};

const ANIMATION_CONFIG = {
  duration: 1000,
  easing: 'easeInOutQuart',
  delay: ctx => ctx.dataIndex * 100
};

/* ─────────────────────────── 3. Loading / Empty UI ───────────────────────── */
function showLoadingState(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      <span class="ml-3 text-gray-600">${t('loadingChart')}</span>
    </div>
  `;
}
function hideLoadingState(id) { const e=document.getElementById(id); if(e) e.innerHTML=''; }
function showEmptyState(id, msgKey) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64 text-gray-500 text-center">
      <i class="fas fa-chart-bar text-4xl mb-4 opacity-50"></i>
      <p class="text-lg font-medium">${t(msgKey)}</p>
      <p class="text-sm mt-2">${t('addTxHint')}</p>
    </div>
  `;
}

/* ──────────────────────────── 4. Base options ───────────────────────────── */
const baseOpts = extra => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  animation: ANIMATION_CONFIG,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { size: 12, family: 'Inter, sans-serif' }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255,255,255,.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? ctx.parsed)}`
      }
    },
    ...extra?.plugins
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,.1)', drawBorder: false },
      ticks: {
        callback: v => formatCurrency(v),
        font: { size: 11, family: 'Inter, sans-serif' },
        color: '#6b7280'
      }
    },
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 11, family: 'Inter, sans-serif' },
        color: '#6b7280'
      }
    }
  },
  ...extra
});

/* Helper (YYYY-MM) */ const monthKey = d => d.slice(0, 7);

/* ───────────────────── 5. Portfolio Line Chart ──────────────────────────── */
export function renderPortfolioChart(ctx, containerId='portfolioContainer') {
  if (!recentTransactionsData.length)
    return showEmptyState(containerId, 'noTxData');

  showLoadingState(containerId);
  destroyChart('portfolio');

  setTimeout(() => {
    const sorted = [...recentTransactionsData]
      .sort((a,b)=>new Date(a.date)-new Date(b.date));

    const labels=[], netVals=[], investVals=[], expVals=[];
    let net=0, invest=0, exp=0;

    sorted.forEach(tx=>{
      if(tx.type==='income')          net += tx.amount;
      else if(tx.type==='expense'){   net-=tx.amount; exp+=tx.amount; }
      else if(tx.type==='investment'){net+=tx.amount; invest+=tx.amount;}

      labels.push(
        new Date(tx.date).toLocaleDateString(settings.currentLang, {month:'short', day:'numeric'})
      );
      netVals.push   (net    * exchangeRates[settings.currentCurrency]);
      investVals.push(invest * exchangeRates[settings.currentCurrency]);
      expVals.push   (exp    * exchangeRates[settings.currentCurrency]);
    });

    hideLoadingState(containerId);

    charts.portfolio = new Chart(ctx,{
      type:'line',
      data:{
        labels,
        datasets:[{
          label:t('netBalance'), data:netVals,
          borderColor:CHART_COLORS.primary, backgroundColor:`${CHART_COLORS.primary}20`,
          fill:true,tension:.4,pointRadius:4,pointHoverRadius:8,
          pointBackgroundColor:CHART_COLORS.primary,pointBorderColor:'#fff',pointBorderWidth:2
        },{
          label:t('investments'),data:investVals,
          borderColor:CHART_COLORS.success,backgroundColor:`${CHART_COLORS.success}20`,
          fill:false,tension:.4,pointRadius:3
        },{
          label:t('expenses'),data:expVals,
          borderColor:CHART_COLORS.danger,backgroundColor:`${CHART_COLORS.danger}20`,
          fill:false,tension:.4,pointRadius:3
        }]
      },
      options:baseOpts({
        plugins:{title:{display:true,text:t('portfolioTitle'),
          font:{size:16,weight:'bold',family:'Inter, sans-serif'},padding:20}}
      })
    });
  },300);
}

/* ───────────────── Income vs Expense Bar ────────────────────────────────── */
export function renderIncomeExpensesChart(ctx, id='incomeExpensesContainer'){
  if(!recentTransactionsData.length)
    return showEmptyState(id,'noFinData');

  showLoadingState(id); destroyChart('incomeExpenses');

  setTimeout(()=>{
    const bucket={};
    recentTransactionsData.forEach(tx=>{
      const k=monthKey(tx.date); bucket[k]??={income:0,expense:0,investment:0};
      bucket[k][tx.type]+=tx.amount;
    });

    const keys=Object.keys(bucket).sort(); const months=[];
    if(keys.length){
      const [y0,m0]=keys[0].split('-').map(Number);
      const [y1,m1]=keys.at(-1).split('-').map(Number);
      const start=new Date(y0,m0-1,1), end=new Date(y1,m1-1,1);
      for(let d=start; d<=end; d.setMonth(d.getMonth()+1)){
        const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        months.push(k); bucket[k]??={income:0,expense:0,investment:0};
      }
    }
    const income=months.map(k=>bucket[k].income*exchangeRates[settings.currentCurrency]);
    const expenses=months.map(k=>bucket[k].expense*exchangeRates[settings.currentCurrency]);

    hideLoadingState(id);

    charts.incomeExpenses=new Chart(ctx,{
      type:'bar',
      data:{
        labels:months.map(k=>{
          const d=new Date(k+'-01');
          return d.toLocaleDateString(settings.currentLang,{month:'short',year:'2-digit'});
        }),
        datasets:[{
          label:t('income'), data:income,
          backgroundColor:`${CHART_COLORS.success}CC`,borderColor:CHART_COLORS.success,
          borderWidth:1,borderRadius:4,borderSkipped:false,hoverBackgroundColor:CHART_COLORS.success
        },{
          label:t('expenses'), data:expenses,
          backgroundColor:`${CHART_COLORS.danger}CC`,borderColor:CHART_COLORS.danger,
          borderWidth:1,borderRadius:4,borderSkipped:false,hoverBackgroundColor:CHART_COLORS.danger
        }]
      },
      options:baseOpts({
        plugins:{title:{display:true,text:t('incomeVsExpenseTitle'),
          font:{size:16,weight:'bold',family:'Inter, sans-serif'},padding:20}}
      })
    });
  },400);
}

/* ───────────────────── Spending by Category Doughnut ────────────────────── */
export function renderCategoryChart(ctx,id='categoryContainer'){
  if(!recentTransactionsData.length && !walletData.spendingCategories)
    return showEmptyState(id,'noSpendData');

  showLoadingState(id); destroyChart('category');

  setTimeout(()=>{
    const catTotals={...(walletData.spendingCategories??{})};
    Object.keys(catTotals).forEach(k=>catTotals[k]=0);

    recentTransactionsData.filter(tx=>tx.type==='expense')
      .forEach(tx=>{ catTotals[tx.category]=(catTotals[tx.category]||0)+tx.amount; });

    const cats=Object.keys(catTotals).filter(c=>catTotals[c]>0);
    if(!cats.length) return showEmptyState(id,'noCatFound');

    const vals=cats.map(c=>catTotals[c]*exchangeRates[settings.currentCurrency]);

    hideLoadingState(id);

    const bg=[CHART_COLORS.danger,CHART_COLORS.warning,CHART_COLORS.purple,
              CHART_COLORS.info,CHART_COLORS.lime,CHART_COLORS.pink,
              CHART_COLORS.primary,CHART_COLORS.success,CHART_COLORS.violet,
              CHART_COLORS.teal,CHART_COLORS.orange,CHART_COLORS.cyan]
              .slice(0,cats.length);

    charts.category=new Chart(ctx,{
      type:'doughnut',
      data:{labels:cats,datasets:[{data:vals,backgroundColor:bg,
        borderWidth:3,borderColor:'#fff',hoverBorderWidth:4,hoverOffset:10}]},
      options:{
        responsive:true,maintainAspectRatio:false,cutout:'60%',
        animation:{animateRotate:true,animateScale:true,duration:1000,easing:'easeInOutQuart'},
        plugins:{
          legend:{
            position:'right',
            labels:{
              padding:20,usePointStyle:true,font:{size:12,family:'Inter, sans-serif'},
              generateLabels(chart){
                const ds=chart.data.datasets[0]; const total=ds.data.reduce((a,b)=>a+b,0);
                return chart.data.labels.map((lbl,i)=>({
                  text:`${lbl} (${((ds.data[i]/total)*100).toFixed(1)}%)`,
                  fillStyle:ds.backgroundColor[i],strokeStyle:'#fff',lineWidth:ds.borderWidth,index:i
                }));
              }
            }
          },
          title:{display:true,text:t('categoryTitle'),
            font:{size:16,weight:'bold',family:'Inter, sans-serif'},padding:20},
          tooltip:{
            backgroundColor:'rgba(0,0,0,.8)',titleColor:'#fff',bodyColor:'#fff',
            borderColor:'rgba(255,255,255,.1)',borderWidth:1,cornerRadius:8,
            callbacks:{
              label:ctx=>{
                const val=ctx.parsed, total=ctx.dataset.data.reduce((a,b)=>a+b,0);
                return `${ctx.label}: ${formatCurrency(val)} (${((val/total)*100).toFixed(1)}%)`;
              }
            }
          }
        }
      }
    });
  },500);
}

/* ─────────────────────── 6. Refresh helpers ─────────────────────────────── */
export function refreshAllCharts(){
  ['portfolio','incomeExpenses','category'].forEach(id=>showLoadingState(`${id}Container`));

  setTimeout(()=>{
    renderPortfolioChart(document.getElementById('portfolioChart')?.getContext('2d'));},100);
  setTimeout(()=>{
    renderIncomeExpensesChart(document.getElementById('incomeExpensesChart')?.getContext('2d'));},200);
  setTimeout(()=>{
    renderCategoryChart(document.getElementById('categoryChart')?.getContext('2d'));},300);
}

/* Exposed single-chart refreshers */
export const refreshPortfolioChart      = () =>
  renderPortfolioChart(document.getElementById('portfolioChart')?.getContext('2d'));
export const refreshIncomeExpensesChart = () =>
  renderIncomeExpensesChart(document.getElementById('incomeExpensesChart')?.getContext('2d'));
export const refreshCategoryChart       = () =>
  renderCategoryChart(document.getElementById('categoryChart')?.getContext('2d'));

/* ─────────────────────── 7. Init & error guard ──────────────────────────── */
export function initializeCharts(){
  try{ refreshAllCharts(); }
  catch(err){
    console.error('Chart init error:',err);
    document.querySelectorAll('[id$="Container"]').forEach(el=>{
      el.innerHTML=`
        <div class="flex flex-col items-center justify-center h-64 text-red-500">
          <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <p class="text-lg font-medium">${t('error')}</p>
          <p class="text-sm mt-2">${t('refresh')}</p>
        </div>`;
    });
  }
}
