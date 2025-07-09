/* -------------------------------------------------------------------------- */
/*  currency.js – fetch & cache FX rates                                      */
/*  Uses:  https://api.exchangerate.host/latest                               */
/* -------------------------------------------------------------------------- */

const CACHE_KEY   = 'wallet360:fxRates';
const CACHE_TTL   = 1000 * 60 * 60 * 12;   // 12 hours
const FALLBACK    = { USD: 1, EUR: 0.92 };

export async function getExchangeRates(base = 'USD', symbols = ['USD', 'EUR']) {
  /* 1 ) return cached value if fresh ------------------------------------ */
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.rates;

  /* 2 ) fetch from API --------------------------------------------------- */
  try {
    const url  = `https://api.exchangerate.host/latest?base=${base}&symbols=${symbols.join(',')}`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();

    /* 3 ) store & return ------------------------------------------------- */
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), rates: data.rates }));
    return data.rates;
  } catch (err) {
    console.warn('[FX] Using fallback rates:', err.message);
    return FALLBACK;
  }
}
