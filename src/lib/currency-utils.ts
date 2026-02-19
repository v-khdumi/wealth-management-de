export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  exchangeRate: number
}

export const CURRENCY_DATABASE: Record<string, Omit<CurrencyInfo, 'exchangeRate'>> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  RON: { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
}

export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  const promptText = `You are a currency exchange rate provider. Provide current approximate exchange rates from ${baseCurrency} to the following currencies: EUR, GBP, RON, JPY, CHF, CAD, AUD, CNY, INR, BRL, MXN, ZAR, SGD, HKD, NZD, SEK, NOK, DKK, PLN, CZK, HUF.

Return the data as a valid JSON object where the keys are currency codes and values are the exchange rates (how many of the target currency equals 1 ${baseCurrency}).

Format:
{
  "EUR": 0.92,
  "GBP": 0.79,
  "RON": 4.56,
  ...
}

Make sure to return realistic, current exchange rates. Return ONLY the JSON object, no additional text.`

  try {
    const response = await window.spark.llm(promptText, 'gpt-4o-mini', true)
    const rates = JSON.parse(response)
    
    return {
      [baseCurrency]: 1,
      ...rates
    }
  } catch (error) {
    return getDefaultExchangeRates(baseCurrency)
  }
}

function getDefaultExchangeRates(baseCurrency: string): Record<string, number> {
  const defaultRatesFromUSD: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    RON: 4.56,
    JPY: 149.50,
    CHF: 0.88,
    CAD: 1.36,
    AUD: 1.53,
    CNY: 7.24,
    INR: 83.12,
    BRL: 4.98,
    MXN: 17.15,
    ZAR: 18.75,
    SGD: 1.34,
    HKD: 7.83,
    NZD: 1.67,
    SEK: 10.58,
    NOK: 10.87,
    DKK: 6.87,
    PLN: 4.02,
    CZK: 23.15,
    HUF: 358.50,
  }

  if (baseCurrency === 'USD') {
    return defaultRatesFromUSD
  }

  const baseRate = defaultRatesFromUSD[baseCurrency] || 1
  const converted: Record<string, number> = {}
  
  Object.entries(defaultRatesFromUSD).forEach(([currency, rate]) => {
    converted[currency] = rate / baseRate
  })
  
  return converted
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount
  
  const fromRate = exchangeRates[fromCurrency] || 1
  const toRate = exchangeRates[toCurrency] || 1
  
  const amountInBase = amount / fromRate
  return amountInBase * toRate
}

export function formatCurrencyWithCode(
  amount: number,
  currencyCode: string,
  showCode: boolean = true
): string {
  const currencyInfo = CURRENCY_DATABASE[currencyCode]
  const symbol = currencyInfo?.symbol || currencyCode
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  if (showCode && currencyInfo) {
    return `${symbol}${formattedAmount} ${currencyCode}`
  }
  
  return `${symbol}${formattedAmount}`
}

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_DATABASE[currencyCode]?.symbol || currencyCode
}

export function getCurrencyName(currencyCode: string): string {
  return CURRENCY_DATABASE[currencyCode]?.name || currencyCode
}

export function detectUniqueCurrencies(statements: Array<{ extractedData?: { currency?: string } }>): string[] {
  const currencies = new Set<string>()
  
  statements.forEach(statement => {
    const currency = statement.extractedData?.currency
    if (currency) {
      currencies.add(currency)
    }
  })
  
  return Array.from(currencies).sort()
}

export function getUserPrimaryCurrency(statements: Array<{ extractedData?: { currency?: string } }>): string | null {
  const currencies = detectUniqueCurrencies(statements)
  if (currencies.length === 0) return null
  
  const currencyFrequency = new Map<string, number>()
  statements.forEach(statement => {
    const currency = statement.extractedData?.currency
    if (currency) {
      currencyFrequency.set(currency, (currencyFrequency.get(currency) || 0) + 1)
    }
  })
  
  let mostFrequentCurrency = currencies[0]
  let maxCount = 0
  currencyFrequency.forEach((count, currency) => {
    if (count > maxCount) {
      maxCount = count
      mostFrequentCurrency = currency
    }
  })
  
  return mostFrequentCurrency
}
