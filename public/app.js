const $ = id => document.getElementById(id);
const fmt = n => n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n;
const badge = x => x>=8?'score-excellent':x>=7?'score-good':x>=6?'score-fair':'score-poor';
const riskC  = r => 'risk-'+r.toLowerCase();

let rows=[],sort={field:'score',dir:'desc'};

const scoreOf=s=>{let k=5;if(s.price<5)k+=2;if(s.changePercent>0)k+=1;if(s.marketCap>2e9)k+=1;if(s.volume>1e7)k+=1;return+ k.toFixed(1);}
const riskOf=s=>s.price<1||s.volume<1e6?'High':s.price<3||s.volume<5e6?'Medium':'Low';

async function fetchData(){
  const q=new URLSearchParams({
    max: $('maxPriceSlider').value, min:$('minPrice').value, minVolume:$('minVolume').value,
    exchange:$('exchange').value, cap:$('marketCap').value
  }); [...q].forEach(([k,v])=>!v&&q.delete(k));
  const data=await (await fetch('/api/index?'+q)).json();
  rows=data.map(d=>({...d,score:scoreOf(d),risk:riskOf(d)}));
  sortTable(sort.field,false); updateStats();
}

function render(){
  const tb=document.querySelector('#stocksTable tbody');
  tb.innerHTML = rows.length?rows.map(r=>{
    const col=r.changePercent>=0?'#009e73':'#e74c3c',ic=r.changePercent>=0?'▲':'▼';
    return `<tr>
      <td class="symbol">${r.symbol}</td><td>${r.name}</td><td>${r.exchange}</td>
      <td class="price">$${r.price.toFixed(2)}</td>
      <td style="color:${col};font-weight:600">${ic} ${Math.abs(r.changePercent).toFixed(2)}%</td>
      <td>${fmt(r.volume)}</td><td>$${fmt(r.marketCap)}</td>
      <td><span class="badge ${badge(r.score)}">${r.score}</span></td>
      <td class="${riskC(r.risk)}">${r.risk}</td>
    </tr>`}).join(''):`<tr><td colspan="9" style="text-align:center;padding:1.6rem">No matches</td></tr>`;
}

function sortTable(f,flip=true){
  if(flip)sort.dir=sort.field===f&&sort.dir==='asc'?'desc':'asc';
  sort.field=f; const d=sort.dir==='asc'?1:-1;
  rows.sort((a,b)=>a[f]>b[f]?d:-d); render();
}

function updateStats(){
  const n=rows.length; $('totalStocks').textContent=n;
  $('avgPrice').textContent='$'+(n?rows.reduce((t,s)=>t+s.price,0)/n:0).toFixed(2);
  $('avgScore').textContent=(n?rows.reduce((t,s)=>t+s.score,0)/n:0).toFixed(1);
  $('highQualityCount').textContent=rows.filter(s=>s.score>=7).length;
}

function applyFilters(){fetchData();}
function resetFilters(){
  $('maxPriceSlider').value=5;$('maxPriceVal').textContent=5;
  $('minPrice').value='0.10';$('minVolume').value='100000';
  ['marketCap','minScore','riskLevel','exchange'].forEach(id=>$(id).value='');fetchData();
}
function syncSlider(){ $('maxPriceVal').textContent=$('maxPriceSlider').value; }

document.addEventListener('DOMContentLoaded',()=>{syncSlider();fetchData();});