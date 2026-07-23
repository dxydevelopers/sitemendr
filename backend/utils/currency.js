const https = require('https');
const logger = require('../config/logger');

// Used only if the live rate fetch has never succeeded (first boot failure, network
// outage, etc). Not the primary source of truth anymore - see fetchLiveRates below.
const FALLBACK_USD_RATES = {
  USD: 1,
  KES: 129.55,
  NGN: 1500,
  GHS: 14.5,
  ZAR: 18,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.37,
  AUD: 1.52
};

const TRACKED_CURRENCIES = ['usd', 'kes', 'ngn', 'ghs', 'zar', 'gbp', 'eur', 'cad', 'aud'];
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000; // refresh twice a day - rates don't need to be more real-time than this for display/quoting purposes

const rateCache = {
  rates: FALLBACK_USD_RATES,
  source: 'fallback',
  lastFetchedAt: 0
};

// free, no API key required, updated daily, no rate limits: https://github.com/fawazahmed0/exchange-api
const LIVE_RATES_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';

const fetchLiveRates = () => new Promise((resolve, reject) => {
  const req = https.get(LIVE_RATES_URL, { timeout: 8000 }, (res) => {
    if (res.statusCode !== 200) {
      res.resume();
      reject(new Error(`Live rate fetch failed with status ${res.statusCode}`));
      return;
    }
    let raw = '';
    res.on('data', (chunk) => { raw += chunk; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(raw);
        const usdRates = parsed.usd;
        if (!usdRates || typeof usdRates !== 'object') {
          reject(new Error('Live rate response missing expected "usd" object'));
          return;
        }
        const nextRates = {};
        TRACKED_CURRENCIES.forEach((code) => {
          const value = Number(usdRates[code]);
          if (Number.isFinite(value) && value > 0) {
            nextRates[code.toUpperCase()] = value;
          }
        });
        if (!nextRates.USD) nextRates.USD = 1;
        resolve(nextRates);
      } catch (err) {
        reject(err);
      }
    });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(new Error('Live rate fetch timed out')); });
});

const refreshRateCache = async () => {
  try {
    const liveRates = await fetchLiveRates();
    rateCache.rates = liveRates;
    rateCache.source = 'live';
    rateCache.lastFetchedAt = Date.now();
    logger.info('Currency rates refreshed from live source', { source: LIVE_RATES_URL });
  } catch (err) {
    // Keep serving whatever is already cached (live or fallback) - a failed refresh
    // should never make pricing/quoting break, it should just serve slightly stale data.
    logger.warn('Currency rate refresh failed, keeping previous rates', {
      error: err.message,
      currentSource: rateCache.source
    });
  }
};

// Kick off an initial fetch on module load, then keep refreshing in the background.
// getUsdRates() below stays fully synchronous throughout - callers never wait on this.
refreshRateCache();
setInterval(refreshRateCache, REFRESH_INTERVAL_MS).unref();

const parseConfiguredRates = () => {
  if (!process.env.USD_EXCHANGE_RATES_JSON) return {};
  try {
    return JSON.parse(process.env.USD_EXCHANGE_RATES_JSON);
  } catch {
    return {};
  }
};

// Manual overrides via USD_EXCHANGE_RATES_JSON still win if ever set - useful as an
// emergency manual correction without a deploy, but no longer the primary mechanism.
const getUsdRates = () => ({
  ...rateCache.rates,
  ...parseConfiguredRates()
});

const normalizeCurrency = (currency) => (currency || 'USD').toUpperCase();

const roundCurrencyAmount = (amount, currency) => {
  const normalized = normalizeCurrency(currency);
  const zeroDecimalCurrencies = new Set(['JPY', 'KRW', 'VND', 'KES', 'NGN', 'UGX', 'TZS', 'RWF']);
  const decimals = zeroDecimalCurrencies.has(normalized) ? 0 : 2;
  const factor = 10 ** decimals;
  return Math.round((Number(amount) || 0) * factor) / factor;
};

const convertCurrencyAmount = (amount, fromCurrency, toCurrency) => {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || !numericAmount) return amount;
  if (from === to) return roundCurrencyAmount(numericAmount, to);

  const rates = getUsdRates();
  const fromRate = Number(rates[from]);
  const toRate = Number(rates[to]);

  if (!fromRate || !toRate) return numericAmount;

  return roundCurrencyAmount((numericAmount / fromRate) * toRate, to);
};

const replaceCurrencyAmountInText = (text, toCurrency, convertedAmount) => {
  if (!text || !convertedAmount) return text;
  const nextAmount = `${normalizeCurrency(toCurrency)} ${convertedAmount}`;
  return text
    .replace(/Deposit of [A-Z]{3}\s*[\d,]+(\.\d+)?/i, `Deposit of ${nextAmount}`)
    .replace(/Pay [A-Z]{3}\s*[\d,]+(\.\d+)?/i, `Pay ${nextAmount}`);
};

module.exports = {
  convertCurrencyAmount,
  normalizeCurrency,
  replaceCurrencyAmountInText,
  roundCurrencyAmount
};