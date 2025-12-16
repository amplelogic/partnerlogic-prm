// src/lib/currencyUtils.js
import { createClient } from '@/lib/supabase/client'

// Fallback currencies if database is unavailable
export const FALLBACK_CURRENCIES = {
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
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
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

// Cache for database currencies
let cachedCurrencies = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Load currencies from database with caching
 */
export async function loadCurrenciesFromDB() {
  // Return cached data if still valid
  if (cachedCurrencies && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedCurrencies
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      console.warn('No currencies in database, using fallback')
      return FALLBACK_CURRENCIES
    }

    // Convert database format to CURRENCIES format
    const dbCurrencies = {}
    data.forEach(currency => {
      dbCurrencies[currency.code] = {
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name
      }
    })

    // Update cache
    cachedCurrencies = dbCurrencies
    cacheTimestamp = Date.now()

    return dbCurrencies
  } catch (error) {
    console.error('Error loading currencies from database:', error)
    return FALLBACK_CURRENCIES
  }
}

/**
 * Get all currencies (attempts DB first, falls back to hardcoded)
 */
export async function getCurrencies() {
  return await loadCurrenciesFromDB()
}

/**
 * Synchronous access to currencies (uses cache or fallback)
 * Use this for immediate access, but call getCurrencies() first to populate cache
 */
export const CURRENCIES = new Proxy({}, {
  get: function(target, prop) {
    // If we have cached currencies, use them
    if (cachedCurrencies && cachedCurrencies[prop]) {
      return cachedCurrencies[prop]
    }
    // Otherwise use fallback
    return FALLBACK_CURRENCIES[prop]
  }
})

/**
 * Clear the currency cache
 * Call this after updating currencies in the database
 */
export function clearCurrencyCache() {
  cachedCurrencies = null
  cacheTimestamp = null
}

export const formatCurrency = (amount, currencyCode = 'USD') => {
  if (!amount && amount !== 0) {
    const symbol = (cachedCurrencies && cachedCurrencies[currencyCode]?.symbol) || 
                   FALLBACK_CURRENCIES[currencyCode]?.symbol || 
                   '$'
    return `${symbol}0`
  }
  
  const currency = (cachedCurrencies && cachedCurrencies[currencyCode]) || 
                   FALLBACK_CURRENCIES[currencyCode] || 
                   FALLBACK_CURRENCIES.USD
  
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
  return (cachedCurrencies && cachedCurrencies[currencyCode]?.symbol) || 
         FALLBACK_CURRENCIES[currencyCode]?.symbol || 
         '$'
}

export const getCurrencyName = (currencyCode = 'USD') => {
  return (cachedCurrencies && cachedCurrencies[currencyCode]?.name) || 
         FALLBACK_CURRENCIES[currencyCode]?.name || 
         'US Dollar'
}

// Helper to get sorted currency list for dropdowns
export const getCurrencyOptions = async () => {
  const currencies = await getCurrencies()
  
  return Object.entries(currencies)
    .map(([code, info]) => ({
      value: code,
      label: `${code} - ${info.name} (${info.symbol})`
    }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

// Synchronous version for immediate use (uses cache or fallback)
export const getCurrencyOptionsSync = () => {
  const currencies = cachedCurrencies || FALLBACK_CURRENCIES
  
  return Object.entries(currencies)
    .map(([code, info]) => ({
      value: code,
      label: `${code} - ${info.name} (${info.symbol})`
    }))
    .sort((a, b) => a.value.localeCompare(b.value))
}