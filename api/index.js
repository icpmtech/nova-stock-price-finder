
import yahooFinance from 'yahoo-finance2';

const DEFAULT_STOCKS = [ 'SNDL', 'NOK', 'SOFI', 'PLTR', 'NIO', 'F', 'WISH', 'BBD', 'ITUB', 'VALE', 'KO', 'PFE', 'BAC', 'GE', 'T' ];

function toNum(v, def = null) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

function mapQuote(q) {
  const summary = q.summaryDetail || {};
  const fin = q.financialData || {};
  return {
    symbol:        q.symbol,
    name:          q.shortName || q.longName || '',
    exchange:      q.fullExchangeName || q.exchangeName || '',
    price:         toNum(q.regularMarketPrice, 0),
    changePercent: toNum(q.regularMarketChangePercent, 0),
    volume:        toNum(q.regularMarketVolume, 0),
    marketCap:     toNum(q.marketCap, 0),
    currency:      q.currency || 'USD',
    forwardPE:     toNum(summary.forwardPE?.raw, null),
    forwardSales:  toNum(fin.priceToSalesTrailing12Months, null)
  };
}

export default async function handler(req, res) {
  const { symbol, max, min, exchange, minVolume, cap, query } = req.query;

  // ROTA DE AUTOCOMPLETE: /api/stocks?query=apple
  if (query) {
    try {
      const searchResults = await yahooFinance.search(query);
      const suggestions = (searchResults?.quotes || [])
        .filter(q => q.symbol && q.shortname)
        .map(q => ({
          symbol: q.symbol,
          name: q.shortname,
          exchange: q.exchange
        }));
      return res.status(200).json(suggestions);
    } catch (err) {
      console.error('Autocomplete error:', err);
      return res.status(500).json({ error: 'Failed to search for stock symbol' });
    }
  }

  // ROTA DE DETALHE POR SÍMBOLO
  if (symbol) {
    try {
      const q = await yahooFinance.quote(symbol.toUpperCase(), {
        modules: ['summaryDetail', 'financialData']
      });

      if (!q || q.regularMarketPrice == null) {
        return res.status(404).json({ error: 'Stock not found' });
      }

      const industryData = await Promise.all(
        DEFAULT_STOCKS.map(t =>
          yahooFinance.quote(t, { modules: ['summaryDetail', 'financialData'] }).catch(() => null)
        )
      );

      const mapped = industryData.filter(x => x).map(mapQuote);
      const avgPEs = mapped.map(m => m.forwardPE).filter(v => v != null);
      const avgSales = mapped.map(m => m.forwardSales).filter(v => v != null);

      const industryAvgPE = avgPEs.length ? avgPEs.reduce((a, b) => a + b, 0) / avgPEs.length : null;
      const industryAvgSales = avgSales.length ? avgSales.reduce((a, b) => a + b, 0) / avgSales.length : null;

      return res.status(200).json({
        ...mapQuote(q),
        industryAvgPE,
        industryAvgSales
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch stock data' });
    }
  }

  // ROTA DE LISTAGEM FILTRADA
  try {
    const maxP = toNum(max, 5);
    const minP = toNum(min, 0);
    const minVol = toNum(minVolume, 0);
    const capKey = (cap || '').toLowerCase();

    const rawQuotes = await Promise.all(
      DEFAULT_STOCKS.map(t =>
        yahooFinance.quote(t, { modules: ['summaryDetail', 'financialData'] }).catch(() => null)
      )
    );

    const results = rawQuotes
      .filter(x => x)
      .map(mapQuote)
      .filter(M => {
        if (M.price == null || M.price > maxP || M.price < minP) return false;
        if (M.volume < minVol) return false;
        if (exchange && !M.exchange.toLowerCase().includes(exchange.toLowerCase())) return false;

        switch (capKey) {
          case 'micro': if (M.marketCap >= 3e8) return false; break;
          case 'small': if (M.marketCap < 3e8 || M.marketCap >= 2e9) return false; break;
          case 'mid':   if (M.marketCap < 2e9 || M.marketCap >= 1e10) return false; break;
          case 'large': if (M.marketCap < 1e10) return false; break;
        }

        return true;
      });

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}
