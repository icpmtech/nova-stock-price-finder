// /api/stock.js – ESM, Vercel // Corrige erro de parsing "Unexpected token 'catch'" removendo encadeamentos // .catch em nova linha (ASI). Também cria helper safeQuote().

import yahooFinance from 'yahoo-finance2';

// Config opcional yahooFinance.setGlobalConfig({ queue: { concurrency: 5 }, fetchOptions: { headers: { 'User-Agent': 'Mozilla/5.0' } }, });

const DEFAULT_STOCKS = [ 'SNDL','NOK','SOFI','PLTR','NIO','F','WISH','BBD','ITUB','VALE', 'KO','PFE','BAC','GE','T' ];

const toNum = (v, def = null) => { const n = parseFloat(v); return Number.isFinite(n) ? n : def; };

const mapQuote = (q) => { const sd  = q.summaryDetail || {}; const fin = q.financialData || {}; return { symbol: q.symbol, name: q.shortName || q.longName || '', exchange: q.fullExchangeName || q.exchangeName || '', price: toNum(q.regularMarketPrice, 0), changePercent: toNum(q.regularMarketChangePercent, 0), volume: toNum(q.regularMarketVolume, 0), marketCap: toNum(q.marketCap, 0), currency: q.currency || 'USD', forwardPE: toNum(sd.forwardPE?.raw, null), forwardSales: toNum(fin.priceToSalesTrailing12Months, null), }; };

// Helper para evitar .catch entrelinhas (evita erro de ASI) async function safeQuote(ticker) { try { return await yahooFinance.quote(ticker, { modules: ['summaryDetail', 'financialData'] }); } catch { return null; } }

export default async function handler(req, res) { const { symbol, query, max, min, exchange, minVolume, cap } = req.query;

// 1) Autocomplete ---------------------------------------------------- if (query) { try { const r = await yahooFinance.search(query); const suggestions = (r.quotes || []) .filter((x) => x.symbol && x.shortname) .map((x) => ({ symbol: x.symbol, name: x.shortname, exchange: x.exchange })); return res.status(200).json(suggestions); } catch (err) { console.error(err); return res.status(500).json({ error: 'autocomplete_failed' }); } }

// 2) Detalhe --------------------------------------------------------- if (symbol) { try { const q = await safeQuote(symbol.toUpperCase()); if (!q || q.regularMarketPrice == null) { return res.status(404).json({ error: 'not_found' }); }

const peersRaw = await Promise.all(DEFAULT_STOCKS.map((t) => safeQuote(t)));
  const peers = peersRaw.filter(Boolean).map(mapQuote);
  const peArr = peers.map((p) => p.forwardPE).filter(Boolean);
  const psArr = peers.map((p) => p.forwardSales).filter(Boolean);

  const industryAvgPE = peArr.length ? peArr.reduce((a, b) => a + b) / peArr.length : null;
  const industryAvgSales = psArr.length ? psArr.reduce((a, b) => a + b) / psArr.length : null;

  return res.status(200).json({ ...mapQuote(q), industryAvgPE, industryAvgSales });
} catch (err) {
  console.error(err);
  return res.status(500).json({ error: 'detail_failed' });
}

}

// 3) Lista filtrada -------------------------------------------------- try { const maxP = toNum(max, 5); const minP = toNum(min, 0); const minVol = toNum(minVolume, 0); const capKey = (cap || '').toLowerCase();

const quotesRaw = await Promise.all(DEFAULT_STOCKS.map((t) => safeQuote(t)));

const list = quotesRaw
  .filter(Boolean)
  .map(mapQuote)
  .filter((M) => {
    if (M.price == null || M.price > maxP || M.price < minP) return false;
    if (M.volume < minVol) return false;
    if (exchange && !M.exchange.toLowerCase().includes(exchange.toLowerCase())) return false;

    switch (capKey) {
      case 'micro': return M.marketCap < 3e8;
      case 'small': return M.marketCap >= 3e8 && M.marketCap < 2e9;
      case 'mid': return M.marketCap >= 2e9 && M.marketCap < 1e10;
      case 'large': return M.marketCap >= 1e10;
      default: return true;
    }
  });

return res.status(200).json(list);

} catch (err) { console.error(err); return res.status(500).json({ error: 'list_failed' }); } }

