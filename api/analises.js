import yahooFinance from 'yahoo-finance2';
import { RSI, SMA, EMA, MACD, BollingerBands, ATR } from 'technicalindicators';

// Configuration constants
const CONFIG = {
  DEFAULT_STOCKS: [
    'SNDL','NOK','SOFI','PLTR','NIO','F','WISH','BBD','ITUB','VALE',
    'KO','PFE','BAC','GE','T'
  ],
  ANALYSIS_PERIODS: {
    RSI: 14,
    SMA: 14,
    EMA: 14,
    MACD: { fast: 12, slow: 26, signal: 9 },
    BOLLINGER: { period: 20, stdDev: 2 },
    ATR: 14
  },
  DCF_DEFAULTS: {
    discountRate: 0.10,
    growthRate: 0.03
  },
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  MAX_SEARCH_RESULTS: 20
};

// Simple in-memory cache
const cache = new Map();

// Utility functions
function toNum(value, defaultValue = null) {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : defaultValue;
}

function validateSymbol(symbol) {
  return typeof symbol === 'string' && 
         symbol.length > 0 && 
         symbol.length <= 10 && 
         /^[A-Z0-9.-]+$/i.test(symbol);
}

function getCacheKey(type, symbol, params = {}) {
  return `${type}:${symbol}:${JSON.stringify(params)}`;
}

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

function mapQuote(quote) {
  const summary = quote.summaryDetail || {};
  const financial = quote.financialData || {};
  
  return {
    symbol: quote.symbol,
    name: quote.shortName || quote.longName || '',
    exchange: quote.fullExchangeName || quote.exchangeName || '',
    price: toNum(quote.regularMarketPrice, 0),
    changePercent: toNum(quote.regularMarketChangePercent, 0),
    volume: toNum(quote.regularMarketVolume, 0),
    marketCap: toNum(quote.marketCap, 0),
    currency: quote.currency || 'USD',
    forwardPE: toNum(summary.forwardPE?.raw, null),
    forwardSales: toNum(financial.priceToSalesTrailing12Months, null)
  };
}

// Analysis functions
async function performRSIAnalysis(symbol, closes, dates) {
  const period = CONFIG.ANALYSIS_PERIODS.RSI;
  const rsi = RSI.calculate({ values: closes, period });
  
  const currentRSI = rsi[rsi.length - 1];
  let signal = 'HOLD';
  
  if (currentRSI > 70) signal = 'SELL';
  else if (currentRSI < 30) signal = 'BUY';
  
  return {
    summary: { 
      latest: currentRSI, 
      period, 
      signal,
      interpretation: getRSIInterpretation(currentRSI)
    },
    chart: { x: dates.slice(period - 1), y: rsi }
  };
}

async function performSMAAnalysis(symbol, closes, dates) {
  const period = CONFIG.ANALYSIS_PERIODS.SMA;
  const sma = SMA.calculate({ values: closes, period });
  const currentPrice = closes[closes.length - 1];
  const currentSMA = sma[sma.length - 1];
  
  return {
    summary: { 
      latest: currentSMA, 
      period,
      currentPrice,
      signal: currentPrice > currentSMA ? 'BUY' : 'SELL',
      difference: ((currentPrice - currentSMA) / currentSMA * 100).toFixed(2)
    },
    chart: { x: dates.slice(period - 1), y: sma }
  };
}

async function performEMAAnalysis(symbol, closes, dates) {
  const period = CONFIG.ANALYSIS_PERIODS.EMA;
  const ema = EMA.calculate({ values: closes, period });
  const currentPrice = closes[closes.length - 1];
  const currentEMA = ema[ema.length - 1];
  
  return {
    summary: { 
      latest: currentEMA, 
      period,
      currentPrice,
      signal: currentPrice > currentEMA ? 'BUY' : 'SELL',
      difference: ((currentPrice - currentEMA) / currentEMA * 100).toFixed(2)
    },
    chart: { x: dates.slice(period - 1), y: ema }
  };
}

async function performMACDAnalysis(symbol, closes, dates) {
  const { fast, slow, signal } = CONFIG.ANALYSIS_PERIODS.MACD;
  const macdData = MACD.calculate({
    values: closes,
    fastPeriod: fast,
    slowPeriod: slow,
    signalPeriod: signal,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  
  const latest = macdData[macdData.length - 1];
  const previous = macdData[macdData.length - 2];
  
  let trend = 'NEUTRAL';
  if (latest && previous) {
    if (latest.MACD > latest.signal && previous.MACD <= previous.signal) {
      trend = 'BULLISH_CROSSOVER';
    } else if (latest.MACD < latest.signal && previous.MACD >= previous.signal) {
      trend = 'BEARISH_CROSSOVER';
    }
  }
  
  return {
    summary: { 
      ...latest, 
      trend,
      fastPeriod: fast,
      slowPeriod: slow,
      signalPeriod: signal
    },
    chart: {
      x: dates.slice(slow - 1),
      y: macdData.map(m => m.MACD),
      signal: macdData.map(m => m.signal),
      histogram: macdData.map(m => m.histogram)
    }
  };
}

async function performBollingerAnalysis(symbol, closes, dates) {
  const { period, stdDev } = CONFIG.ANALYSIS_PERIODS.BOLLINGER;
  const bb = BollingerBands.calculate({ values: closes, period, stdDev });
  
  const latest = bb[bb.length - 1];
  const currentPrice = closes[closes.length - 1];
  
  let position = 'MIDDLE';
  if (currentPrice >= latest.upper) position = 'UPPER';
  else if (currentPrice <= latest.lower) position = 'LOWER';
  
  return {
    summary: { 
      latest, 
      period, 
      stdDev,
      currentPrice,
      position,
      bandwidth: ((latest.upper - latest.lower) / latest.middle * 100).toFixed(2)
    },
    chart: {
      x: dates.slice(period - 1),
      middle: bb.map(b => b.middle),
      upper: bb.map(b => b.upper),
      lower: bb.map(b => b.lower)
    }
  };
}

async function performATRAnalysis(symbol, highs, lows, closes, dates) {
  const period = CONFIG.ANALYSIS_PERIODS.ATR;
  const atr = ATR.calculate({ high: highs, low: lows, close: closes, period });
  
  const currentATR = atr[atr.length - 1];
  const currentPrice = closes[closes.length - 1];
  const volatilityPercent = (currentATR / currentPrice * 100).toFixed(2);
  
  return {
    summary: { 
      latest: currentATR, 
      period,
      currentPrice,
      volatilityPercent,
      interpretation: getATRInterpretation(parseFloat(volatilityPercent))
    },
    chart: { x: dates.slice(period), y: atr }
  };
}

async function performDCFAnalysis(symbol) {
  const finData = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
    modules: ['financialData', 'defaultKeyStatistics']
  });
  
  const fcf = finData.financialData?.freeCashflow?.raw || 0;
  const sharesOutstanding = finData.defaultKeyStatistics?.sharesOutstanding?.raw || 0;
  const { discountRate, growthRate } = CONFIG.DCF_DEFAULTS;
  
  if (fcf <= 0 || sharesOutstanding <= 0) {
    return {
      summary: { 
        error: 'Insufficient data for DCF calculation',
        freeCashflow: fcf,
        sharesOutstanding
      },
      chart: {}
    };
  }
  
  const dcfValue = fcf * (1 + growthRate) / (discountRate - growthRate);
  const valuePerShare = dcfValue / sharesOutstanding;
  
  return {
    summary: { 
      freeCashflow: fcf,
      sharesOutstanding,
      discountRate,
      growthRate,
      dcfValue,
      valuePerShare,
      assumptions: 'Perpetual growth model with constant FCF growth'
    },
    chart: {}
  };
}

// Helper functions for interpretations
function getRSIInterpretation(rsi) {
  if (rsi > 70) return 'Overbought - potential sell signal';
  if (rsi < 30) return 'Oversold - potential buy signal';
  return 'Neutral territory';
}

function getATRInterpretation(volatilityPercent) {
  if (volatilityPercent > 5) return 'High volatility';
  if (volatilityPercent < 2) return 'Low volatility';
  return 'Moderate volatility';
}

// Main handler
export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const { symbol, tipo, query, events } = req.query;

    // 🔍 AUTOCOMPLETE SEARCH
    if (query) {
      const cacheKey = getCacheKey('search', query);
      let cachedResult = getCachedData(cacheKey);
      
      if (cachedResult) {
        return res.status(200).json(cachedResult);
      }
      
      const searchResults = await yahooFinance.search(query, {
        quotesCount: CONFIG.MAX_SEARCH_RESULTS
      });
      
      const suggestions = (searchResults?.quotes || [])
        .filter(q => q.symbol && q.shortname)
        .slice(0, CONFIG.MAX_SEARCH_RESULTS)
        .map(q => ({
          symbol: q.symbol,
          name: q.shortname,
          exchange: q.exchange,
          type: q.quoteType
        }));
      
      setCachedData(cacheKey, suggestions);
      return res.status(200).json(suggestions);
    }

    // Validate symbol for other operations
    if (symbol && !validateSymbol(symbol)) {
      return res.status(400).json({ error: 'Invalid symbol format' });
    }

    // 📆 EVENTS FOR SYMBOL
    if (symbol && events) {
      const cacheKey = getCacheKey('events', symbol);
      let cachedResult = getCachedData(cacheKey);
      
      if (cachedResult) {
        return res.status(200).json(cachedResult);
      }
      
      const evts = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
        modules: ['calendarEvents']
      });
      
      const result = {
        symbol: symbol.toUpperCase(),
        earningsDate: evts.calendarEvents?.earnings?.earningsDate || [],
        dividendDate: evts.calendarEvents?.dividendDate || null,
        exDividendDate: evts.calendarEvents?.exDividendDate || null
      };
      
      setCachedData(cacheKey, result);
      return res.status(200).json(result);
    }

    // 📊 TECHNICAL AND FUNDAMENTAL ANALYSIS
    if (symbol && tipo) {
      const cacheKey = getCacheKey('analysis', symbol, { tipo });
      let cachedResult = getCachedData(cacheKey);
      
      if (cachedResult) {
        return res.status(200).json(cachedResult);
      }
      
      let result;
      
      if (tipo === 'perfil') {
        const profile = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
          modules: ['assetProfile']
        });
        const ap = profile.assetProfile;
        
        result = {
          summary: {
            businessSummary: ap?.longBusinessSummary || 'N/A',
            sector: ap?.sector || 'N/A',
            industry: ap?.industry || 'N/A',
            website: ap?.website || 'N/A',
            employees: ap?.fullTimeEmployees || 'N/A',
            country: ap?.country || 'N/A',
            city: ap?.city || 'N/A'
          },
          chart: {}
        };
      } else if (tipo === 'dcf') {
        result = await performDCFAnalysis(symbol);
      } else {
        // Get historical data for technical analysis
        const to = new Date();
        const from = new Date();
        from.setFullYear(to.getFullYear() - 1);
        
        const hist = await yahooFinance.historical(symbol.toUpperCase(), {
          period1: from,
          period2: to,
          interval: '1d',
          events: tipo === 'dividendos' ? 'dividends' : undefined
        });
        
        if (!hist || hist.length === 0) {
          return res.status(404).json({ error: 'No historical data found' });
        }
        
        const dates = hist.map(d => d.date.toISOString().split('T')[0]);
        const closes = hist.map(d => d.close);
        const highs = hist.map(d => d.high);
        const lows = hist.map(d => d.low);
        
        switch (tipo) {
          case 'rsi':
            result = await performRSIAnalysis(symbol, closes, dates);
            break;
          case 'sma':
            result = await performSMAAnalysis(symbol, closes, dates);
            break;
          case 'ema':
            result = await performEMAAnalysis(symbol, closes, dates);
            break;
          case 'macd':
            result = await performMACDAnalysis(symbol, closes, dates);
            break;
          case 'bollinger':
            result = await performBollingerAnalysis(symbol, closes, dates);
            break;
          case 'atr':
            result = await performATRAnalysis(symbol, highs, lows, closes, dates);
            break;
          case 'dividendos':
            const dividends = hist
              .filter(d => d.dividends && d.dividends > 0)
              .map(d => ({ 
                date: d.date.toISOString().split('T')[0], 
                dividend: d.dividends 
              }));
            
            const totalDividends = dividends.reduce((sum, d) => sum + d.dividend, 0);
            const avgDividend = dividends.length > 0 ? totalDividends / dividends.length : 0;
            
            result = {
              summary: { 
                latest: dividends[dividends.length - 1] || null,
                count: dividends.length,
                totalDividends,
                avgDividend,
                annualizedYield: dividends.length > 0 ? (totalDividends / closes[closes.length - 1] * 100).toFixed(2) : 0
              },
              chart: { 
                x: dividends.map(d => d.date), 
                y: dividends.map(d => d.dividend) 
              }
            };
            break;
          default:
            return res.status(400).json({ error: 'Unsupported analysis type' });
        }
      }
      
      setCachedData(cacheKey, result);
      return res.status(200).json(result);
    }

    // Invalid request
    return res.status(400).json({ 
      error: 'Invalid request. Please provide either query for search, symbol with events=true for events, or symbol with tipo for analysis' 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    // Return appropriate error based on error type
    if (error.message?.includes('not found') || error.message?.includes('Invalid symbol')) {
      return res.status(404).json({ error: 'Symbol not found' });
    }
    
    if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
