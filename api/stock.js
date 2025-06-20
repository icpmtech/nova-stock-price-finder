
// /api/stock.js – ESM ("type": "module") Vercel Function // Rotas: //   • /api/stock?query=apple      → autocomplete //   • /api/stock?symbol=AAPL      → detalhe + médias //   • /api/stock?max=5&cap=small  → lista filtrada // --------------------------------------------------------------------- // Dependência:  npm i yahoo-finance2 // ---------------------------------------------------------------------

import yahooFinance from 'yahoo-finance2';

// Config opcional para evitar time‑out (máx. 5 fetch simultâneos) yahooFinance.setGlobalConfig({ queue: { concurrency: 5 }, fetchOptions: { headers: { 'User-Agent': 'Mozilla/5.0' } } });

const DEFAULT_STOCKS = [ 'SNDL','NOK','SOFI','PLTR','NIO','F','WISH','BBD','ITUB','VALE', 'KO','PFE','BAC','GE','T' ];

const toNum = (v, def = null) => { const n = parseFloat(v); return Number.isFinite(n) ? n : def; };

const mapQuote = (q) => { const sd  = q.summaryDetail  || {}; const fin = q.financialData  || {}; return { symbol:        q.symbol, name:          q.shortName || q.longName || '', exchange:      q.fullExchangeName || q.exchangeName || '', price:         toNum(q.regularMarketPrice, 0), changePercent: toNum(q.regularMarketChangePercent, 0), volume:        toNum(q.regularMarketVolume, 0), marketCap:     toNum(q.marketCap, 0), currency:      q.currency || 'USD', forwardPE:     toNum(sd.forwardPE?.raw, null), forwardSales:  toNum(fin.priceToSalesTrailing12Months, null) }; };

export default async function handler(req, res) { const { symbol, query, max, min, exchange, minVolume, cap } = req.query;

// ── 1) AUTOCOMPLETE ─────────────────────────────────────────────── if (query) { try { const out = await yahooFinance.search(query); const suggestions = (out.quotes || []) .filter((q) => q.symbol && q.shortname) .map((q) => ({ symbol: q.symbol, name: q.shortname, exchange: q.exchange })); return res.status(200).json(suggestions); } catch (err) { console.error(err); return res.status(500).json({ error: 'autocomplete_failed' }); } }

// ── 2) DETALHE DE ATIVO ─────────────────────────────────────────── if (symbol) { try { const q = await yahooFinance.quote(symbol.toUpperCase(), { modules: ['summaryDetail', 'financialData'] }); if (!q || q.regularMarketPrice == null) { return res.status(404).json({ error: 'not_found' }); }

// peers para média do setor
  const peerRaw = await Promise.all(
    DEFAULT_STOCKS.map((t) =>
      yahooFinance.quote(t, { modules: ['summaryDetail','financialData'] })
        .catch(() => null)
    )
  );
  const peers = peerRaw.filter(Boolean).map(mapQuote);
  const avgPE  = peers.map(p => p.forwardPE).filter(Boolean);
  const avgPS  = peers.map(p => p.forwardSales).filter(Boolean);

  const industryAvgPE    = avgPE.length ? avgPE.reduce((a,b)=>a+b)/avgPE.length : null;
  const industryAvgSales = avgPS.length ? avgPS.reduce((a,b)=>a+b)/avgPS.length : null;

  return res.status(200).json({ ...mapQuote(q), industryAvgPE, industryAvgSales });
} catch (err) {
  console.error(err);
  return res.status(500).json({ error: 'detail_failed' });
}

}

// ── 3) LISTA FILTRADA ───────────────────────────────────────────── try { const maxP   = toNum(max, 5); const minP   = toNum(min, 0); const minVol = toNum(minVolume, 0); const capKey = (cap || '').toLowerCase();

const raw = await Promise.all(
  DEFAULT_STOCKS.map((t) =>
    yahooFinance.quote(t, { modules: ['summaryDetail','financialData'] })
      .catch(() => null)
  )
);

const list = raw.filter(Boolean).map(mapQuote).filter((M) => {
  if (M.price == null || M.price > maxP || M.price < minP) return false;
  if (M.volume < minVol) return false;
  if (exchange && !M.exchange.toLowerCase().includes(exchange.toLowerCase())) return false;

  switch (capKey) {
    case 'micro': return M.marketCap < 3e8;
    case 'small': return M.marketCap >= 3e8 && M.marketCap < 2e9;
    case 'mid':   return M.marketCap >= 2e9 && M.marketCap < 1e10;
    case 'large': return M.marketCap >= 1e10;
    default:      return true;
  }
});

return res.status(200).json(list);

} catch (err) { console.error(err); return res.status(500).json({ error: 'list_failed' }); } }

