import yahooFinance from 'yahoo-finance2';

const cac40Tickers = {
  "Airbus": "AIR.PA",
  "L'Oréal": "OR.PA",
  "LVMH": "MC.PA",
  "TotalEnergies": "TTE.PA",
  "Danone": "BN.PA",
  "Sanofi": "SAN.PA",
  "AXA": "CS.PA",
  "Société Générale": "GLE.PA",
  "BNP Paribas": "BNP.PA",
  "Engie": "ENGI.PA"
  // Podes adicionar mais símbolos conforme necessário
};

export default async function handler(req, res) {
  try {
    const results = [];

    for (const [name, symbol] of Object.entries(cac40Tickers)) {
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
    res.status(500).json({ error: 'Erreur lors du chargement des données CAC 40.' });
  }
}
