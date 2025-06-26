import axios from 'axios';

const tickers = {
  "EDP": "EDP.LS",
  "Jerónimo Martins": "JMT.LS",
  "BCP": "BCP.LS",
  "Galp": "GALP.LS",
  "EDP Renováveis": "EDPR.LS",
  "Navigator": "NVG.LS",
  "Sonae": "SON.LS",
  "REN": "RENE.LS"
};

export default async function handler(req, res) {
  const results = [];

  for (const [name, symbol] of Object.entries(tickers)) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;
      const response = await axios.get(url);
      const meta = response.data.chart.result[0].meta;
      const price = meta.regularMarketPrice;
      const previous = meta.chartPreviousClose;
      const diff = price - previous;
      const percent = (diff / previous) * 100;

      results.push({
        name,
        symbol,
        price: price.toFixed(2),
        diff: diff.toFixed(2),
        percent: percent.toFixed(2)
      });
    } catch (err) {
      results.push({ name, symbol, error: 'Erro ao obter dados' });
    }
  }

  res.setHeader('Cache-Control', 's-maxage=300');
  res.status(200).json(results);
}
