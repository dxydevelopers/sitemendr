const DEFAULT_USD_RATES = {
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

const parseConfiguredRates = () => {
  if (!process.env.USD_EXCHANGE_RATES_JSON) return {};
  try {
    return JSON.parse(process.env.USD_EXCHANGE_RATES_JSON);
  } catch {
    return {};
  }
};

const getUsdRates = () => ({
  ...DEFAULT_USD_RATES,
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
