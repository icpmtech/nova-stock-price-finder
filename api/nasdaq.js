import yahooFinance from 'yahoo-finance2';

const nasdaqTickers = {
  "Apple": "AAPL",
  "Microsoft": "MSFT",
  "NVIDIA": "NVDA",
  "Amazon": "AMZN",
  "Meta Platforms": "META",
  "Alphabet (Google) A": "GOOGL",
  "Alphabet (Google) C": "GOOG",
  "Tesla": "TSLA",
  "Intel": "INTC",
  "Netflix": "NFLX"
  // Podes adicionar mais conforme necessário
};

export default async function handler(req, res) {
  try {
    const results = [];

    for (const [name, symbol] of Object.entries(nasdaqTickers)) {
      const quote = await yahooFinance.quote(symbol);
      const price = quote.regularMarketPrice;
      const previous = quote.regularMarketPreviousClose;
      const diff = price - previous;
      const percent = (diff / previous) * 100;

      results.push({
        name,
        symbol,
        price: price.toFixed(2),
        diff: diff.toFixed(2),
        percent: percent.toFixed(2)
      });
    }

    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dados do NASDAQ.' });
  }
}
