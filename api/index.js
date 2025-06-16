// api/index.js -------------------------------------------------------------
import yahooFinance from 'yahoo-finance2';

const DEFAULT_STOCKS = [
  'SNDL','NOK','SOFI','PLTR','NIO','F','WISH',
  'BBD','ITUB','VALE','KO','PFE','BAC','GE','T'
];

const num = (v, def) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
};

export default async function handler(req, res) {
  const { symbol, max, min, exchange, minVolume, cap } = req.query;

  /* ---------- 1) símbolo único ---------- */
  if (symbol) {
    try {
      const q = await yahooFinance.quote(symbol.toUpperCase());
      if (!q || q.regularMarketPrice == null) return res.status(404).json({ error: 'Stock not found' });
      return res.status(200).json(mapQuote(q));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch stock data' });
    }
  }

  /* ---------- 2) lista filtrada ---------- */
  try {
    const maxP   = num(max, 5);
    const minP   = num(min, 0);
    const minVol = num(minVolume, 0);
    const capKey = (cap || '').toLowerCase();   // micro | small | mid | large

    const quotes = await Promise.all(DEFAULT_STOCKS.map(t => yahooFinance.quote(t)));

    const results = quotes.filter(q => {
      const price   = q.regularMarketPrice;
      const volume  = q.regularMarketVolume ?? 0;
      const mktCap  = q.marketCap ?? 0;
      const exch    = (q.fullExchangeName || q.exchangeName || '');

      // Preço
      if (price == null || price > maxP || price < minP) return false;

      // Volume
      if (volume < minVol) return false;

      // Exchange
      if (exchange && !exch.toLowerCase().includes(exchange.toLowerCase())) return false;

      // Market-cap categoria
      if (capKey) {
        if (capKey === 'micro' && mktCap >= 3e8) return false;
        if (capKey === 'small' && (mktCap < 3e8 || mktCap >= 2e9)) return false;
        if (capKey === 'mid'   && (mktCap < 2e9 || mktCap >= 1e10)) return false;
        if (capKey === 'large' && mktCap < 1e10) return false;
      }
      return true;
    })
    .map(mapQuote);

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}

/* ---------- helper ---------- */
function mapQuote(q) {
  return {
    symbol:   q.symbol,
    name:     q.shortName || q.longName || '',
    exchange: q.fullExchangeName || q.exchangeName || '',
    price:    q.regularMarketPrice,
    changePercent: q.regularMarketChangePercent ?? 0,
    volume:   q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? 0,
    currency: q.currency || 'USD'
  };
}
