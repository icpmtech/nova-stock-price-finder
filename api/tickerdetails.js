import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker em falta. Usa ?ticker=SMCI' });
  }

  try {
    const quote = await yahooFinance.quote(ticker);

    const price = quote.regularMarketPrice;
    const previous = quote.regularMarketPreviousClose;
    const diff = price - previous;
    const percent = (diff / previous) * 100;
    const target = quote.financialCurrency === 'USD' ? quote.targetMeanPrice : null;

    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).json({
      ticker,
      name: quote.shortName || quote.displayName || ticker,
      price: price?.toFixed(2),
      previous: previous?.toFixed(2),
      diff: diff?.toFixed(2),
      percent: percent?.toFixed(2),
      targetPrice: target?.toFixed(2) || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Erro ao obter dados para ${ticker}.` });
  }
}
