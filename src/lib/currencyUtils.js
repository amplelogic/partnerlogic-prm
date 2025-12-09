// src/lib/currencyUtils.js

export const CURRENCIES = {
  // Major Currencies
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  
  // Asia Pacific
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  
  // Gulf Countries (GCC)
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  QAR: { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
  KWD: { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  BHD: { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
  OMR: { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
  
  // Other Middle East
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  JOD: { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar' },
  LBP: { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound' },
  
  // Europe
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  
  // Americas
  MXN: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  ARS: { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso' },
  CLP: { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso' },
  
  // Africa
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
}

export const formatCurrency = (amount, currencyCode = 'USD') => {
  if (!amount && amount !== 0) return `${CURRENCIES[currencyCode]?.symbol || '$'}0`
  
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  } catch (error) {
    // Fallback if currency code is not supported by Intl
    return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
}

export const getCurrencySymbol = (currencyCode = 'USD') => {
  return CURRENCIES[currencyCode]?.symbol || '$'
}

export const getCurrencyName = (currencyCode = 'USD') => {
  return CURRENCIES[currencyCode]?.name || 'US Dollar'
}

// Helper to get sorted currency list for dropdowns
export const getCurrencyOptions = () => {
  return Object.entries(CURRENCIES).map(([code, info]) => ({
    value: code,
    label: `${code} - ${info.name} (${info.symbol})`
  }))
}