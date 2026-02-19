import { useMemo } from 'react'
import { getUserPrimaryCurrency, getCurrencySymbol } from '@/lib/currency-utils'
import type { BankStatement } from '@/lib/types'

export function useUserCurrency(
  userId: string,
  bankStatements: BankStatement[]
): { currency: string; symbol: string } {
  return useMemo(() => {
    const userStatements = bankStatements.filter(s => s.userId === userId)
    const detectedCurrency = getUserPrimaryCurrency(userStatements)
    
    const currency = detectedCurrency || 'USD'
    const symbol = getCurrencySymbol(currency)
    
    return { currency, symbol }
  }, [userId, bankStatements])
}
