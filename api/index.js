import yahooFinance from 'yahoo-finance2';

const DEFAULT_STOCKS = ['AAPL', 'AMD', 'NOK', 'INTC', 'F', 'T', 'GE', 'SIRI', 'PFE', 'BAC'];

export default async function handler(req, res) {
  const { symbol } = req.query;

  // Pesquisa por símbolo específico
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

  // Listagem de ações baratas (< 5 USD)
  try {
    const results = [];

    for (const s of DEFAULT_STOCKS) {
      const quote = await yahooFinance.quote(s);
      if (quote.regularMarketPrice && quote.regularMarketPrice < 5) {
        results.push({
          symbol: s,
          name: quote.shortName,
          price: quote.regularMarketPrice,
          currency: quote.currency,
        });
      }
    }

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}a