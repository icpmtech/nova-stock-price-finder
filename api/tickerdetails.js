import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker em falta. Usa ?ticker=SMCI' });
  }

  try {
    // Dados de preço
    const quote = await yahooFinance.quote(ticker);
    const price    = quote.regularMarketPrice;
    const previous = quote.regularMarketPreviousClose;
    const diff     = price - previous;
    const percent  = (diff / previous) * 100;
    const target   = quote.targetMeanPrice;

    // Tendência de recomendações
    const rec = await yahooFinance.recommendationTrend(ticker);
    // Pega o período mais recente
    const latest = rec.trend && rec.trend[0];
    const recSummary = latest
      ? {
          strongBuy:  latest.strongBuy,
          buy:        latest.buy,
          hold:       latest.hold,
          sell:       latest.sell,
          strongSell: latest.strongSell
        }
      : null;

    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).json({
      ticker,
      name:         quote.shortName || ticker,
      price:        price?.toFixed(2),
      diff:         diff?.toFixed(2),
      percent:      percent?.toFixed(2),
      targetPrice:  target?.toFixed(2) || null,
      recSummary
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Erro ao obter dados para ${ticker}.` });
  }
}
