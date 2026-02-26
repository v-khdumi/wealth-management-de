import { createContext, useContext, useState, type ReactNode } from 'react'
import { CURRENCY_DATABASE, getCurrencySymbol } from './currency-utils'

interface CurrencyContextType {
  currency: string
  symbol: string
  setCurrency: (code: string) => void
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  symbol: '$',
  setCurrency: () => {},
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState(() => {
    try {
      return localStorage.getItem('app-currency') || 'USD'
    } catch {
      return 'USD'
    }
  })

  const setCurrency = (code: string) => {
    if (CURRENCY_DATABASE[code]) {
      setCurrencyState(code)
      try {
        localStorage.setItem('app-currency', code)
      } catch {}
    }
  }

  const symbol = getCurrencySymbol(currency)

  return (
    <CurrencyContext.Provider value={{ currency, symbol, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useGlobalCurrency() {
  return useContext(CurrencyContext)
}
