import yahooFinance from 'yahoo-finance2';

const DEFAULT_STOCKS = [
  'AAPL', 'AMD', 'NOK', 'INTC', 'F', 'T', 'GE', 'SIRI', 'PFE', 'BAC', 'SNDL', 'WISH', 'SOFI', 'PLTR', 'NIO', 'BBBY', 'AMC'
];

export default async function handler(req, res) {
  const { symbol, max } = req.query;

  if (symbol) {
    try {
      const quote = await yahooFinance.quote(symbol.toUpperCase());

      if (!quote || !quote.regularMarketPrice) {
        return res.status(404).json({ error: "Stock not found" });
      }

      return res.status(200).json({
        symbol: quote.symbol,
        name: quote.shortName,
        price: quote.regularMarketPrice,
        currency: quote.currency
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch stock data" });
    }
  }

  // List all stocks below max price (default $5)
  try {
    const results = [];
    const maxPrice = parseFloat(max) || 5;

    for (const s of DEFAULT_STOCKS) {
      const quote = await yahooFinance.quote(s);
      if (quote.regularMarketPrice && quote.regularMarketPrice < maxPrice) {
        results.push({
          symbol: s,
          name: quote.shortName,
          price: quote.regularMarketPrice,
          currency: quote.currency,
        });
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}
