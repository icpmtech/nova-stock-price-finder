import yahooFinance from 'yahoo-finance2';

const nasdaqTickers = {
  "Adobe": "ADBE",
  "Advanced Micro Devices": "AMD",
  "Airbnb": "ABNB",
  "Alphabet A": "GOOGL",
  "Alphabet C": "GOOG",
  "American Electric Power": "AEP",
  "Amgen": "AMGN",
  "Analog Devices": "ADI",
  "Ansys": "ANSS",
  "Apple": "AAPL",
  "Applied Materials": "AMAT",
  "AppLovin": "APP",
  "Arm Holdings": "ARM",
  "ASML": "ASML",
  "AstraZeneca": "AZN",
  "Atlassian": "TEAM",
  "Autodesk": "ADSK",
  "Automatic Data Processing": "ADP",
  "Axon Enterprise": "AXON",
  "Baker Hughes": "BKR",
  "Biogen": "BIIB",
  "Booking Holdings": "BKNG",
  "Broadcom": "AVGO",
  "Cadence Design Systems": "CDNS",
  "CDW Corp": "CDW",
  "Charter Communications": "CHTR",
  "Cintas": "CTAS",
  "Cisco": "CSCO",
  "Coca‑Cola Europacific Partners": "CCEP",
  "Cognizant": "CTSH",
  "Comcast": "CMCSA",
  "Constellation Energy": "CEG",
  "Copart": "CPRT",
  "CoStar Group": "CSGP",
  "Costco": "COST",
  "CrowdStrike": "CRWD",
  "CSX Corp": "CSX",
  "Datadog": "DDOG",
  "DexCom": "DXCM",
  "Diamondback Energy": "FANG",
  "DoorDash": "DASH",
  "Electronic Arts": "EA",
  "Exelon": "EXC",
  "Fastenal": "FAST",
  "Fortinet": "FTNT",
  "GE HealthCare": "GEHC",
  "Gilead Sciences": "GILD",
  "GlobalFoundries": "GFS",
  "Honeywell": "HON",
  "Idexx Labs": "IDXX",
  "Intel": "INTC",
  "Intuit": "INTU",
  "Intuitive Surgical": "ISRG",
  "Keurig Dr Pepper": "KDP",
  "KLA": "KLAC",
  "Kraft Heinz": "KHC",
  "Lam Research": "LRCX",
  "Linde": "LIN",
  "Lululemon": "LULU",
  "Marriott": "MAR",
  "Marvell": "MRVL",
  "MercadoLibre": "MELI",
  "Meta Platforms": "META",
  "Microchip": "MCHP",
  "Micron": "MU",
  "Microsoft": "MSFT",
  "MicroStrategy": "MSTR",
  "Mondelez": "MDLZ",
  "Monster Beverage": "MNST",
  "Netflix": "NFLX",
  "Nvidia": "NVDA",
  "NXP Semiconductors": "NXPI",
  "O'Reilly Automotive": "ORLY",
  "Old Dominion Freight": "ODFL",
  "Onsemi": "ON",
  "Paccar": "PCAR",
  "Palantir": "PLTR",
  "Palo Alto Networks": "PANW",
  "Paychex": "PAYX",
  "PayPal": "PYPL",
  "PDD Holdings": "PDD",
  "PepsiCo": "PEP",
  "Qualcomm": "QCOM",
  "Regeneron": "REGN",
  "Roper Technologies": "ROP",
  "Ross Stores": "ROST",
  "Shopify": "SHOP",
  "Starbucks": "SBUX",
  "Synopsys": "SNPS",
  "Take‑Two Interactive": "TTWO",
  "T‑Mobile US": "TMUS",
  "Tesla": "TSLA",
  "Texas Instruments": "TXN",
  "The Trade Desk": "TTD",
  "Verisk Analytics": "VRSK",
  "Vertex Pharma": "VRTX",
  "Warner Bros Discovery": "WBD",
  "Workday": "WDAY",
  "Xcel Energy": "XEL",
  "Zscaler": "ZS"
};

export default async function handler(req, res) {
  try {
    const results = [];
    for (const [name, symbol] of Object.entries(nasdaqTickers)) {
      const q = await yahooFinance.quote(symbol);
      const price = q.regularMarketPrice;
      const prev = q.regularMarketPreviousClose;
      const diff = price - prev;
      const pct = (diff / prev) * 100;
      results.push({ name, symbol, price: price.toFixed(2), diff: diff.toFixed(2), percent: pct.toFixed(2) });
    }
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dados da NASDAQ' });
  }
}
