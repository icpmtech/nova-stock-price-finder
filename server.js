import express from 'express';
import cors from 'cors';
import yahooFinance from 'yahoo-finance2';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));

const STOCKS = ['AAPL', 'AMD', 'NOK', 'INTC', 'F', 'T', 'GE', 'SIRI', 'PFE', 'BAC'];

app.get('/api/cheap-stocks', async (req, res) => {
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

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
