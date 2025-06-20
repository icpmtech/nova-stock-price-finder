
// /api/stock.js – Vercel Serverless Function
// Exemplo de uso: https://<your-project>.vercel.app/api/stock?symbol=NOS.LS
// ---------------------------------------------------------------------------

import fetch from 'node-fetch';

export default async function handler(req, res) {
  const {
    query: { symbol = 'NOS.LS' },
  } = req;

  // Helper de falha padronizada
  const fail = (message, status = 500) =>
    res.status(status).json({ error: message });

  try {
    // ---------------------------------------------------------------------
    // 👉  Substitua pelo seu datasource real (Yahoo Finance, Alpha Vantage,
    //     Twelve Data, Polygon.io, etc.). Estes valores são apenas mock
    //     para demonstrar o formato esperado pelo front-end.
    // ---------------------------------------------------------------------

    /* Exemplo de fetch no Yahoo Finance (não oficial)
    const yahoo = await fetch(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,defaultKeyStatistics`
    ).then((r) => r.json());
    // ... transformar o JSON em price, previousClose, etc.
    */

    // ---------- MOCK DATA (remova quando integrar API real) --------------
    const data = {
      symbol,
      name: 'NOS, S.G.P.S., S.A.',
      price: 3.78,
      priceChange: 0.025,
      priceChangePercent: 0.0067,
      previousClose: 3.755,
      open: 3.835,
      volume: 125_150,
      avgVolume: 1_060_000,
      marketCap: 1.95e9,
      peRatio: 7.1321,
      beta: 0.291,
      dividendYield: 0.0932,
      week52Low: 3.235,
      week52High: 4.53,
      sector: 'Communication Services',
      industry: 'Telecommunications Services',
      employees: 3284,
      description:
        'NOS, S.G.P.S., S.A., together with its subsidiaries, engages in the telecommunications and entertainment business. It offers cable and satellite television, fixed and mobile voice, Internet and mobile broadband access, and voice-over-IP services. The company is also active in publishing and sale of video-grams, advertising on pay-TV channels, operating cinemas and a mobile communications network, film distribution, production of pay-TV channels, datacentre management, licensing, and the provision of other multimedia services.',
      financials: {
        years: [2021, 2022, 2023, 2024],
        revenue: [1470, 1510, 1560, 1620], // € million
        earnings: [120, 100, 110, 115],    // € million
      },
      history: {
        dates: [
          '2024-06-16', '2024-07-01', '2024-07-15', '2024-08-01',
          '2024-08-15', '2024-09-01', '2024-09-15', '2024-10-01',
          '2024-10-15', '2024-11-01', '2024-11-15', '2024-12-01',
          '2024-12-15', '2025-01-01', '2025-01-15', '2025-02-01',
          '2025-02-15', '2025-03-01',
        ],
        prices: [
          3.30, 3.35, 3.32, 3.40, 3.42, 3.38,
          3.34, 3.32, 3.28, 3.50, 4.10, 4.30,
          4.53, 4.30, 3.90, 3.60, 3.70, 3.78,
        ],
      },
      analystTargets: { low: 3.5, mean: 4.06, high: 5.0 },
      controversy: 1, // 0 (nenhuma) – 5 (altíssima)
    };
    // ---------------------------------------------------------------------

    res.setHeader('Access-Control-Allow-Origin', '*'); // se precisar CORS
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return fail('Failed to fetch stock data');
  }
}
