import { useMemo } from 'react'
import { convertCurrency, getDefaultExchangeRates } from '@/lib/currency-utils'

/**
 * Hook that returns a conversion function to convert amounts from any source currency
 * to the specified target currency using default exchange rates.
 */
export function useCurrencyConversion(targetCurrency: string) {
  return useMemo(() => {
    const rates = getDefaultExchangeRates('USD')
    return (amount: number, fromCurrency: string): number => {
      if (fromCurrency === targetCurrency) return amount
      return convertCurrency(amount, fromCurrency, targetCurrency, rates)
    }
  }, [targetCurrency])
}
