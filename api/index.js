// api/index.js
// ------------------------------------------------------------
// API handler para Vercel (ou qualquer ambiente Serverless)
// Devolve:
//   • /api/index?symbol=TSLA   → objeto com dados completos da ação
//   • /api/index?max=5         → lista das DEFAULT_STOCKS abaixo desse preço
//     (podes acrescentar ?min=0.5 ou outros filtros se quiseres)
// ------------------------------------------------------------
import yahooFinance from 'yahoo-finance2';

const DEFAULT_STOCKS = [
  'SNDL', 'NOK', 'SOFI', 'PLTR', 'NIO', 'F', 'WISH',
  'BBD', 'ITUB', 'VALE', 'KO', 'PFE', 'BAC', 'GE', 'T'
];

// Utilitário para ler n query strings de forma tipada
function num(value, def) {
  const n = parseFloat(value);
  return isNaN(n) ? def : n;
}

export default async function handler(req, res) {
  const { symbol, max, min } = req.query;

  // --- PEDIDO POR SÍMBOLO ÚNICO -------------------------------------------
  if (symbol) {
    try {
      const quote = await yahooFinance.quote(symbol.toUpperCase());

      if (!quote || quote.regularMarketPrice == null) {
        return res.status(404).json({ error: 'Stock not found' });
      }

      const data = mapQuote(quote);
      return res.status(200).json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch stock data' });
    }
  }

  // --- LISTA FILTRADA -------------------------------------------------------
  try {
    const maxPrice = num(max, 5);   // default $5
    const minPrice = num(min, 0);   // default $0

    const quotes = await Promise.all(
      DEFAULT_STOCKS.map(s => yahooFinance.quote(s))
    );

    const results = quotes
      .filter(q =>
        q.regularMarketPrice != null &&
        q.regularMarketPrice <= maxPrice &&
        q.regularMarketPrice >= minPrice
      )
      .map(mapQuote);

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}

// Converte o objeto da yahoo-finance2 para o formato que o frontend espera
function mapQuote(q) {
  return {
    symbol: q.symbol,
    name: q.shortName || q.longName || '',
    price: q.regularMarketPrice,
    changePercent: q.regularMarketChangePercent ?? 0,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? 0,
    currency: q.currency || 'USD'
  };
}
