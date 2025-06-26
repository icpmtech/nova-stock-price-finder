import yahooFinance from 'yahoo-finance2';

const ibexTickers = {
  "Banco Santander": "SAN.MC",
  "Iberdrola": "IBE.MC",
  "Inditex": "ITX.MC",
  "BBVA": "BBVA.MC",
  "Telefónica": "TEF.MC"
};

export default async function handler(req, res) {
  try {
    const results = [];

    for (const [name, symbol] of Object.entries(ibexTickers)) {
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
    res.status(500).json({ error: 'Erro ao obter dados do IBEX.' });
  }
}
