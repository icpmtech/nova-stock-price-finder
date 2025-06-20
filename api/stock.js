// /api/stock.js  (CommonJS, Node 18+ no Vercel)
const yahooFinance = require('yahoo-finance2').default;

/* ------------ Config opcional ------------------------------ */
yahooFinance.setGlobalConfig({
  queue: { concurrency: 5 },                      // Evita timeout
  fetchOptions: { headers: { 'User-Agent': 'Mozilla/5.0' } }
});

/* ------------ Utilidades ----------------------------------- */
const DEFAULT_STOCKS = [
  'SNDL','NOK','SOFI','PLTR','NIO',
  'F','WISH','BBD','ITUB','VALE','KO','PFE','BAC','GE','T'
];

const toNum = (v, def=null) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
};

const mapQuote = (q) => {
  const sd  = q.summaryDetail || {};
  const fin = q.financialData || {};
  return {
    symbol:        q.symbol,
    name:          q.shortName || q.longName || '',
    exchange:      q.fullExchangeName || q.exchangeName || '',
    price:         toNum(q.regularMarketPrice, 0),
    changePercent: toNum(q.regularMarketChangePercent, 0),
    volume:        toNum(q.regularMarketVolume, 0),
    marketCap:     toNum(q.marketCap, 0),
    currency:      q.currency || 'USD',
    forwardPE:     toNum(sd.forwardPE?.raw, null),
    forwardSales:  toNum(fin.priceToSalesTrailing12Months, null)
  };
};

/* ------------ Handler -------------------------------------- */
module.exports = async function handler(req, res) {
  const { symbol, query, max, min, exchange, minVolume, cap } = req.query;

  /* 1) AUTOCOMPLETE --------------------------------------------------- */
  if (query) {
    try {
      const r = await yahooFinance.search(query);
      const suggestions = (r.quotes || [])
        .filter(q => q.symbol && q.shortname)
        .map(q => ({ symbol: q.symbol, name: q.shortname, exchange: q.exchange }));
      return res.status(200).json(suggestions);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'autocomplete_failed' });
    }
  }

  /* 2) DETALHE -------------------------------------------------------- */
  if (symbol) {
    try {
      const q = await yahooFinance.quote(symbol.toUpperCase(), {
        modules: ['summaryDetail', 'financialData']
      });
      if (!q || q.regularMarketPrice == null) {
        return res.status(404).json({ error: 'not_found' });
      }

      // Médias de setor
      const peerRaw = await Promise.all(
        DEFAULT_STOCKS.map(t =>
          yahooFinance.quote(t, { modules: ['summaryDetail','financialData'] })
            .catch(() => null)
        )
      );
      const peers        = peerRaw.filter(Boolean).map(mapQuote);
      const peerPEs      = peers.map(p => p.forwardPE).filter(Boolean);
      const peerSales    = peers.map(p => p.forwardSales).filter(Boolean);
      const industryAvgPE    = peerPEs.length   ? peerPEs.reduce((a,b)=>a+b)/peerPEs.length   : null;
      const industryAvgSales = peerSales.length ? peerSales.reduce((a,b)=>a+b)/peerSales.length : null;

      return res.status(200).json({ ...mapQuote(q), industryAvgPE, industryAvgSales });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'detail_failed' });
    }
  }

  /* 3) LISTA FILTRADA ------------------------------------------------- */
  try {
    const maxP   = toNum(max, 5);
    const minP   = toNum(min, 0);
    const minVol = toNum(minVolume, 0);
    const capKey = (cap || '').toLowerCase();

    const quotesRaw = await Promise.all(
      DEFAULT_STOCKS.map(t =>
        yahooFinance.quote(t, { modules: ['summaryDetail','financialData'] })
          .catch(() => null)
      )
    );

    const list = quotesRaw.filter(Boolean).map(mapQuote).filter(M => {
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
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'list_failed' });
  }
};
