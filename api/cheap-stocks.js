import yahooFinance from 'yahoo-finance2';

const STOCKS = ['AAPL', 'AMD', 'NOK', 'INTC', 'F', 'T', 'GE', 'SIRI', 'PFE', 'BAC'];

export default async function handler(req, res) {
  try {
    const results = [];

    for (const symbol of STOCKS) {
      const quote = await yahooFinance.quote(symbol);
      if (quote.regularMarketPrice && quote.regularMarketPrice < 5) {
        results.push({
          symbol,
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
}
