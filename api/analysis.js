import yahooFinance from 'yahoo-finance2';
import { RSI, SMA, EMA, MACD, BollingerBands, ATR } from 'technicalindicators';

const DEFAULT_STOCKS = [
  'SNDL','NOK','SOFI','PLTR','NIO','F','WISH','BBD','ITUB','VALE',
  'KO','PFE','BAC','GE','T'
];

function toNum(v, def = null) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

function mapQuote(q) {
  const summary = q.summaryDetail || {};
  const fin     = q.financialData  || {};
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
  const { symbol, tipo, max, min, exchange, minVolume, cap, query, events } = req.query;

  // 🔍 AUTOCOMPLETE
  if (query) {
    try {
      const searchResults = await yahooFinance.search(query);
      const suggestions = (searchResults?.quotes || [])
        .filter(q => q.symbol && q.shortname)
        .map(q => ({
          symbol:   q.symbol,
          name:     q.shortname,
          exchange: q.exchange
        }));
      return res.status(200).json(suggestions);
    } catch (err) {
      console.error('Autocomplete error:', err);
      return res.status(500).json({ error: 'Failed to search for stock symbol' });
    }
  }

  // 📆 EVENTOS PARA SÍMBOLO
  if (symbol && events) {
    try {
      const evts = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
        modules: ['calendarEvents']
      });
      return res.status(200).json({
        symbol,
        earningsDate:   evts.calendarEvents?.earnings?.earningsDate || [],
        dividendDate:   evts.calendarEvents?.dividendDate || null,
        exDividendDate: evts.calendarEvents?.exDividendDate || null
      });
    } catch (err) {
      console.error('Event fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  }

  // 📊 ANÁLISES TÉCNICAS E FUNDAMENTAIS
  if (symbol && tipo) {
    try {
      // Histórico diário de 1 ano
      const to   = new Date();
      const from = new Date(); from.setFullYear(to.getFullYear() - 1);
      const hist = await yahooFinance.historical(symbol.toUpperCase(), {
        period1: from,
        period2: to,
        interval: '1d',
        events: 'dividends'
      });

      const dates  = hist.map(d => d.date.toISOString().split('T')[0]);
      const closes = hist.map(d => d.close);
      const highs  = hist.map(d => d.high);
      const lows   = hist.map(d => d.low);

      let summary = {};
      let chart   = {};

      switch (tipo) {
        case 'rsi': {
          const rsi = RSI.calculate({ values: closes, period: 14 });
          summary = { latest: rsi.slice(-1)[0], period: 14 };
          chart   = { x: dates.slice(13), y: rsi };
          break;
        }
        case 'sma': {
          const sma = SMA.calculate({ values: closes, period: 14 });
          summary = { latest: sma.slice(-1)[0], period: 14 };
          chart   = { x: dates.slice(13), y: sma };
          break;
        }
        case 'ema': {
          const ema = EMA.calculate({ values: closes, period: 14 });
          summary = { latest: ema.slice(-1)[0], period: 14 };
          chart   = { x: dates.slice(13), y: ema };
          break;
        }
        case 'macd': {
          const macdArr = MACD.calculate({
            values: closes,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false
          });
          summary = macdArr.slice(-1)[0];
          chart   = {
            x:      dates.slice(25),
            y:      macdArr.map(m => m.MACD),
            signal: macdArr.map(m => m.signal)
          };
          break;
        }
        case 'bollinger': {
          const bb = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 });
          summary = { latest: bb.slice(-1)[0], period: 20 };
          chart   = {
            x:      dates.slice(19),
            middle: bb.map(b => b.middle),
            upper:  bb.map(b => b.upper),
            lower:  bb.map(b => b.lower)
          };
          break;
        }
        case 'atr': {
          const atr = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
          summary = { latest: atr.slice(-1)[0], period: 14 };
          chart   = { x: dates.slice(14), y: atr };
          break;
        }
        case 'dcf': {
          // DCF simplificado: FCF perpetuidade
          const finData = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
            modules: ['financialData']
          });
          const fcf = finData.financialData.freeCashflow?.raw || 0;
          const r   = 0.10;  // taxa de desconto padrão
          const g   = 0.03;  // taxa de crescimento perpétuo
          const dcfValue = fcf * (1 + g) / (r - g);
          summary = { freeCashflow: fcf, discountRate: r, growthRate: g, dcfValue };
          chart   = {};
          break;
        }
        case 'dividendos': {
          const divs = hist
            .filter(d => d.dividends)
            .map(d => ({ date: d.date.toISOString().split('T')[0], dividend: d.dividends }));
          summary = { latest: divs.slice(-1)[0] || null };
          chart   = { x: divs.map(d => d.date), y: divs.map(d => d.dividend) };
          break;
        }
        case 'perfil': {
          const profile = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
            modules: ['assetProfile']
          });
          const ap = profile.assetProfile;
          summary = {
            businessSummary: ap.longBusinessSummary,
            sector:          ap.sector,
            industry:        ap.industry,
            website:         ap.website
          };
          chart = {};
          break;
        }
        default:
          return res.status(400).json({ error: 'Tipo de análise não suportado' });
      }

      return res.status(200).json({ summary, chart });
    } catch (err) {
      console.error('Analysis error:', err);
      return res.status(500).json({ error: 'Failed to perform analysis' });
    }
  }

  // Se não for autocomplete, eventos ou análise, é rota inválida:
  return res.status(400).json({ error: 'Requisição inválida' });
}
