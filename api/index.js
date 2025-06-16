// api/index.js
import yahooFinance from 'yahoo-finance2';

// Símbolos de referência (podes aumentar esta lista)
const DEFAULT_STOCKS = [
  'SNDL','NOK','SOFI','PLTR','NIO','F','WISH',
  'BBD','ITUB','VALE','KO','PFE','BAC','GE','T'
];

// Converte string-numérica para número seguro
const toNum = (v, def) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
};

// Normaliza o objeto devolvido pela API do Yahoo
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

export default async function handler(req, res) {
  const {
    symbol,        // ?symbol=AAPL
    max, min,      // ?max=5&min=0.2
    exchange,      // ?exchange=Nasdaq
    minVolume,     // ?minVolume=100000
    cap            // ?cap=micro|small|mid|large
  } = req.query;

  /* ——— 1) Busca por símbolo único ——— */
  if (symbol) {
    try {
      const q = await yahooFinance.quote(symbol.toUpperCase());
      if (!q || q.regularMarketPrice == null) {
        return res.status(404).json({ error: 'Stock not found' });
      }
      return res.status(200).json(mapQuote(q));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch stock data' });
    }
  }

  /* ——— 2) Lista filtrada ——— */
  try {
    const maxP   = toNum(max, 5);
    const minP   = toNum(min, 0);
    const minVol = toNum(minVolume, 0);
    const capKey = (cap || '').toLowerCase();   // micro | small | mid | large

    const quotes = await Promise.all(
      DEFAULT_STOCKS.map(ticker => yahooFinance.quote(ticker))
    );

    const results = quotes
      .filter(q => {
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

        // Market-cap bucket
        switch (capKey) {
          case 'micro': if (mktCap >= 3e8)  return false; break;
          case 'small': if (mktCap < 3e8   || mktCap >= 2e9)  return false; break;
          case 'mid':   if (mktCap < 2e9   || mktCap >= 1e10) return false; break;
          case 'large': if (mktCap < 1e10) return false; break;
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
