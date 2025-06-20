// /api/stock.js – Vercel Serverless Function // Ex.: https://your-project.vercel.app/api/stock?symbol=NOS.LS // ---------------------------------------------------------------------

// (Em runtimes Node 18+ do Vercel o fetch global já existe; se usar //  uma versão mais antiga, descomente a linha abaixo.) // import fetch from 'node-fetch';

export default async function handler(req, res) { const { symbol = 'NOS.LS' } = req.query; const respondError = (msg, code = 500) => res.status(code).json({ error: msg });

// Converte epoch (s) → YYYY-MM-DD const toDate = (unix) => new Date(unix * 1000).toISOString().split('T')[0];

try { // 1) Resumo, perfil e targets -------------------------------------- const summaryURL = https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)} + ?modules=price,summaryDetail,defaultKeyStatistics,financialData,assetProfile;

const summaryJson = await fetch(summaryURL).then((r) => r.json());
const summary = summaryJson.quoteSummary?.result?.[0];
if (!summary) throw new Error('Yahoo summary returned no data');

const { price, summaryDetail, defaultKeyStatistics: stats, financialData, assetProfile: profile } = summary;

// 2) Histórico de preços (1 ano) -----------------------------------
const chartURL =
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
  `?range=1y&interval=1d&includePrePost=false`;

const chartJson = await fetch(chartURL).then((r) => r.json());
const chart = chartJson.chart?.result?.[0];
if (!chart) throw new Error('Yahoo chart returned no data');

const dates = (chart.timestamp || []).map(toDate);
const prices = chart.indicators?.quote?.[0]?.close || [];

// 3) Income statements (4 anos) ------------------------------------
const incomeURL =
  `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}` +
  `?modules=incomeStatementHistory`;

const incomeJson = await fetch(incomeURL).then((r) => r.json());
const incomeHist = incomeJson.quoteSummary?.result?.[0]?.incomeStatementHistory?.incomeStatementHistory || [];

const years = [];
const revenue = [];
const earnings = [];

[...incomeHist]
  .sort((a, b) => a.endDate.raw - b.endDate.raw)
  .slice(-4)
  .forEach((item) => {
    years.push(new Date(item.endDate.raw * 1000).getFullYear());
    revenue.push(Math.round(item.totalRevenue.raw / 1e6)); // € milhões
    earnings.push(Math.round(item.netIncome.raw / 1e6));   // € milhões
  });

// 4) Monta payload --------------------------------------------------
const data = {
  symbol,
  name: price.shortName ?? price.longName ?? symbol,
  price: price.regularMarketPrice.raw,
  priceChange: price.regularMarketChange.raw,
  priceChangePercent: price.regularMarketChangePercent.raw,
  previousClose: price.regularMarketPreviousClose.raw,
  open: price.regularMarketOpen.raw,
  volume: price.regularMarketVolume.raw,
  avgVolume: stats.averageDailyVolume3Month?.raw ?? null,
  marketCap: price.marketCap?.raw ?? null,
  peRatio: stats.trailingPE?.raw ?? null,
  beta: stats.beta?.raw ?? null,
  dividendYield: summaryDetail.dividendYield?.raw ?? null,
  week52Low: price.fiftyTwoWeekLow.raw,
  week52High: price.fiftyTwoWeekHigh.raw,
  sector: profile?.sector ?? null,
  industry: profile?.industry ?? null,
  employees: profile?.fullTimeEmployees ?? null,
  description: profile?.longBusinessSummary ?? null,

  financials: { years, revenue, earnings },
  history: { dates, prices },

  analystTargets: {
    low: financialData.targetLowPrice?.raw ?? null,
    mean: financialData.targetMeanPrice?.raw ?? null,
    high: financialData.targetHighPrice?.raw ?? null,
  },

  controversy: 1, // placeholder (0–5)
};

res.setHeader('Access-Control-Allow-Origin', '*');
return res.status(200).json(data);

} catch (err) { console.error(err); return respondError(err.message); } }


