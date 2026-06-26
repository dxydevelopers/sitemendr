export const countryCodes = ['AF','AL','DZ','AS','AD','AO','AI','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BA','BW','BR','BN','BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE','GH','GI','GR','GD','GT','GN','GW','GY','HT','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PL','PT','QA','RO','RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK','SD','SR','SE','CH','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','UG','UA','AE','GB','US','UY','UZ','VU','VN','YE','ZM','ZW'];

export const countryCurrencyByCode: Record<string, string> = {
  KE: 'KES', US: 'USD', GB: 'GBP', NG: 'NGN', GH: 'GHS', ZA: 'ZAR', CA: 'CAD', AU: 'AUD', NZ: 'NZD', IN: 'INR', AE: 'AED', SA: 'SAR',
  UG: 'UGX', TZ: 'TZS', RW: 'RWF', BI: 'BIF', ET: 'ETB', EG: 'EGP', MA: 'MAD', DZ: 'DZD', TN: 'TND', SN: 'XOF', CI: 'XOF', CM: 'XAF',
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR', IE: 'EUR', FI: 'EUR', AT: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF', PL: 'PLN', CZ: 'CZK', RO: 'RON', HU: 'HUF', TR: 'TRY',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU', PY: 'PYG',
  CN: 'CNY', HK: 'HKD', JP: 'JPY', KR: 'KRW', SG: 'SGD', MY: 'MYR', ID: 'IDR', PH: 'PHP', TH: 'THB', VN: 'VND', TW: 'TWD',
};

export const countryDialCodeByCode: Record<string, string> = {
  US: '+1', CA: '+1', GB: '+44', KE: '+254', NG: '+234', GH: '+233', ZA: '+27', AU: '+61', NZ: '+64', IN: '+91', PK: '+92', BD: '+880', AE: '+971', SA: '+966',
  UG: '+256', TZ: '+255', RW: '+250', BI: '+257', ET: '+251', EG: '+20', MA: '+212', DZ: '+213', TN: '+216', CM: '+237', CI: '+225', SN: '+221',
  FR: '+33', DE: '+49', IT: '+39', ES: '+34', PT: '+351', NL: '+31', BE: '+32', CH: '+41', AT: '+43', IE: '+353', NO: '+47', SE: '+46', DK: '+45', FI: '+358',
  BR: '+55', MX: '+52', AR: '+54', CL: '+56', CO: '+57', PE: '+51', CN: '+86', HK: '+852', JP: '+81', KR: '+82', SG: '+65', MY: '+60', ID: '+62', PH: '+63', TH: '+66', VN: '+84',
};

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const countryOptions = countryCodes
  .map(code => ({
    code,
    name: displayNames.of(code) || code,
    currency: countryCurrencyByCode[code] || 'USD',
    dialCode: countryDialCodeByCode[code] || '',
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const accountTypes = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business' },
  { value: 'organization', label: 'Organization' },
  { value: 'agency', label: 'Agency' },
];

export const personalEmailDomains = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
]);

export const getDefaultCurrencyForCountry = (country?: string) => (
  countryOptions.find(option => option.code === country)?.currency || 'USD'
);

export const getDialCodeForCountry = (country?: string) => (
  countryOptions.find(option => option.code === country)?.dialCode || ''
);

export const normalizePhoneForCountry = (phone: string, country?: string) => {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  const dialCode = getDialCodeForCountry(country);
  const localDigits = digits.replace(/\D/g, '').replace(/^0+/, '');
  return dialCode ? `${dialCode}${localDigits}` : localDigits;
};

export const getLocalPhoneForCountry = (phone: string, country?: string) => {
  const dialCode = getDialCodeForCountry(country);
  const trimmed = phone.trim();
  if (dialCode && trimmed.startsWith(dialCode)) {
    return trimmed.slice(dialCode.length).replace(/^0+/, '');
  }
  return trimmed;
};

export const isValidProfilePhone = (phone: string, country?: string) => {
  if (!phone.trim()) return true;
  const normalized = normalizePhoneForCountry(phone, country);
  const digitCount = normalized.replace(/\D/g, '').length;
  const dialCode = getDialCodeForCountry(country);
  return digitCount >= 8 && digitCount <= 15 && (!dialCode || normalized.startsWith(dialCode));
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const getEmailDomain = (email: string) => normalizeEmail(email).split('@')[1] || '';
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
