import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  CurrencyCircleDollar,
  TrendUp,
  TrendDown,
  Globe,
  ArrowsClockwise,
  Sparkle,
  ChartPie,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Portfolio, Holding, Instrument, CurrencyAccount } from '@/lib/types'
import {
  getExchangeRates,
  convertCurrency,
  formatCurrencyWithCode,
  getCurrencySymbol,
  getCurrencyName,
  CURRENCY_DATABASE,
} from '@/lib/currency-utils'
import { useDataStore } from '@/lib/data-store'

interface MultiCurrencyPortfolioProps {
  portfolio: Portfolio
  holdings: Holding[]
  instruments: Instrument[]
  currencyAccounts?: CurrencyAccount[]
}

const ASSET_CLASS_COLORS: Record<string, string> = {
  EQUITY: 'oklch(0.45 0.12 155)',
  FIXED_INCOME: 'oklch(0.35 0.08 240)',
  CASH: 'oklch(0.50 0.01 155)',
  ALTERNATIVE: 'oklch(0.70 0.15 75)',
  REAL_ESTATE: 'oklch(0.65 0.15 195)',
}

export function MultiCurrencyPortfolio({
  portfolio,
  holdings,
  instruments,
  currencyAccounts = [],
}: MultiCurrencyPortfolioProps) {
  const [baseCurrency, setBaseCurrency] = useState<string>(portfolio.baseCurrency || 'USD')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [enableConversion, setEnableConversion] = useState(true)
  const [selectedView, setSelectedView] = useState<'consolidated' | 'by-currency'>('consolidated')

  const availableCurrencies = useMemo(() => {
    const currencies = new Set<string>()
    
    if (portfolio.currency) currencies.add(portfolio.currency)
    holdings.forEach(h => {
      const instrument = instruments.find(i => i.id === h.instrumentId)
      if (instrument?.currency) currencies.add(instrument.currency)
      if (h.currency) currencies.add(h.currency)
    })
    currencyAccounts.forEach(ca => currencies.add(ca.currency))
    
    return Array.from(currencies).sort()
  }, [portfolio, holdings, instruments, currencyAccounts])

  useEffect(() => {
    const loadRates = async () => {
      setIsLoadingRates(true)
      try {
        const rates = await getExchangeRates(baseCurrency)
        setExchangeRates(rates)
        toast.success(`Exchange rates updated for ${baseCurrency}`)
      } catch (error) {
        toast.error('Failed to load exchange rates')
      } finally {
        setIsLoadingRates(false)
      }
    }

    if (enableConversion) {
      loadRates()
    }
  }, [baseCurrency, enableConversion])

  const portfolioData = useMemo(() => {
    const convert = (amount: number, fromCurrency?: string) => {
      if (!enableConversion || !fromCurrency || Object.keys(exchangeRates).length === 0) {
        return amount
      }
      return convertCurrency(amount, fromCurrency, baseCurrency, exchangeRates)
    }

    let totalValue = 0
    let totalCash = convert(portfolio.cash, portfolio.currency || 'USD')
    const holdingsByAssetClass: Record<string, { value: number; holdings: any[] }> = {}
    const holdingsByCurrency: Record<string, { value: number; originalValue: number; holdings: any[] }> = {}

    holdings.forEach(holding => {
      const instrument = instruments.find(i => i.id === holding.instrumentId)
      if (!instrument) return

      const holdingCurrency = holding.currency || instrument.currency || 'USD'
      const currentValue = holding.quantity * instrument.currentPrice
      const convertedValue = convert(currentValue, holdingCurrency)
      const costBasis = holding.quantity * holding.averageCost
      const convertedCost = convert(costBasis, holdingCurrency)

      totalValue += convertedValue

      if (!holdingsByAssetClass[instrument.assetClass]) {
        holdingsByAssetClass[instrument.assetClass] = { value: 0, holdings: [] }
      }
      holdingsByAssetClass[instrument.assetClass].value += convertedValue
      holdingsByAssetClass[instrument.assetClass].holdings.push({
        ...holding,
        instrument,
        currentValue,
        convertedValue,
        costBasis,
        convertedCost,
        currency: holdingCurrency,
      })

      if (!holdingsByCurrency[holdingCurrency]) {
        holdingsByCurrency[holdingCurrency] = { value: 0, originalValue: 0, holdings: [] }
      }
      holdingsByCurrency[holdingCurrency].value += convertedValue
      holdingsByCurrency[holdingCurrency].originalValue += currentValue
      holdingsByCurrency[holdingCurrency].holdings.push({
        ...holding,
        instrument,
        currentValue,
        convertedValue,
        currency: holdingCurrency,
      })
    })

    currencyAccounts.forEach(account => {
      const convertedBalance = convert(account.balance, account.currency)
      totalCash += convertedBalance

      if (!holdingsByCurrency[account.currency]) {
        holdingsByCurrency[account.currency] = { value: 0, originalValue: 0, holdings: [] }
      }
      holdingsByCurrency[account.currency].value += convertedBalance
      holdingsByCurrency[account.currency].originalValue += account.balance
    })

    totalValue += totalCash

    const allocationData = Object.entries(holdingsByAssetClass).map(([assetClass, data]) => ({
      assetClass,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
    }))

    allocationData.push({
      assetClass: 'CASH',
      value: totalCash,
      percentage: (totalCash / totalValue) * 100,
    })

    const currencyData = Object.entries(holdingsByCurrency).map(([currency, data]) => ({
      currency,
      value: data.value,
      originalValue: data.originalValue,
      percentage: (data.value / totalValue) * 100,
      holdings: data.holdings,
    }))

    return {
      totalValue,
      totalCash,
      allocationData: allocationData.filter(a => a.value > 0),
      currencyData: currencyData.filter(c => c.value > 0),
      holdingsByAssetClass,
      holdingsByCurrency,
    }
  }, [portfolio, holdings, instruments, currencyAccounts, baseCurrency, exchangeRates, enableConversion])

  const handleRefreshRates = async () => {
    setIsLoadingRates(true)
    try {
      const rates = await getExchangeRates(baseCurrency)
      setExchangeRates(rates)
      toast.success('Exchange rates refreshed')
    } catch (error) {
      toast.error('Failed to refresh rates')
    } finally {
      setIsLoadingRates(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Globe size={24} weight="duotone" className="text-accent" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Multi-Currency Portfolio
                  {isLoadingRates && <ArrowsClockwise size={18} className="animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  Tracking {availableCurrencies.length} {availableCurrencies.length === 1 ? 'currency' : 'currencies'}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshRates}
              disabled={isLoadingRates}
              className="gap-2"
            >
              <ArrowsClockwise size={16} />
              Refresh Rates
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4">
              <Switch
                id="enable-conversion"
                checked={enableConversion}
                onCheckedChange={setEnableConversion}
              />
              <Label htmlFor="enable-conversion" className="cursor-pointer">
                Enable Currency Conversion
              </Label>
            </div>

            {enableConversion && (
              <div className="flex items-center gap-2">
                <Label htmlFor="base-currency" className="whitespace-nowrap">
                  Base Currency:
                </Label>
                <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                  <SelectTrigger id="base-currency" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_DATABASE).map(([code, info]) => (
                      <SelectItem key={code} value={code}>
                        {info.symbol} {code} - {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Label htmlFor="view-mode" className="whitespace-nowrap">
                View:
              </Label>
              <Select value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
                <SelectTrigger id="view-mode" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consolidated">Consolidated</SelectItem>
                  <SelectItem value="by-currency">By Currency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
                <p className="text-4xl font-display font-bold wealth-number text-primary">
                  {enableConversion
                    ? formatCurrencyWithCode(portfolioData.totalValue, baseCurrency, false)
                    : `$${portfolioData.totalValue.toLocaleString()}`}
                </p>
                {enableConversion && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Converted to {getCurrencyName(baseCurrency)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Available Cash</p>
                <p className="text-2xl font-display font-bold wealth-number">
                  {enableConversion
                    ? formatCurrencyWithCode(portfolioData.totalCash, baseCurrency, false)
                    : `$${portfolioData.totalCash.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedView === 'consolidated' ? (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Portfolio breakdown by asset class</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={portfolioData.allocationData}
                      dataKey="value"
                      nameKey="assetClass"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ percentage }) => `${percentage.toFixed(1)}%`}
                    >
                      {portfolioData.allocationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={ASSET_CLASS_COLORS[entry.assetClass] || 'oklch(0.50 0.05 200)'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        enableConversion
                          ? formatCurrencyWithCode(value, baseCurrency)
                          : `$${value.toLocaleString()}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Currency Distribution</CardTitle>
                <CardDescription>Portfolio value by currency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={portfolioData.currencyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="currency" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        enableConversion
                          ? formatCurrencyWithCode(value, baseCurrency)
                          : `$${value.toLocaleString()}`
                      }
                    />
                    <Bar dataKey="value" fill="oklch(0.65 0.15 195)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Holdings Details</CardTitle>
              <CardDescription>
                All positions {enableConversion && `converted to ${getCurrencyName(baseCurrency)}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(portfolioData.holdingsByAssetClass).flatMap(data =>
                    data.holdings.map(holding => {
                      const gainLoss = holding.convertedValue - holding.convertedCost
                      const gainLossPercent = (gainLoss / holding.convertedCost) * 100

                      return (
                        <TableRow key={holding.id}>
                          <TableCell className="font-bold">{holding.instrument.symbol}</TableCell>
                          <TableCell>{holding.instrument.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{holding.currency}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{holding.quantity}</TableCell>
                          <TableCell className="text-right">
                            {enableConversion
                              ? formatCurrencyWithCode(
                                  convertCurrency(
                                    holding.instrument.currentPrice,
                                    holding.currency,
                                    baseCurrency,
                                    exchangeRates
                                  ),
                                  baseCurrency,
                                  false
                                )
                              : formatCurrencyWithCode(holding.instrument.currentPrice, holding.currency, false)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {enableConversion
                              ? formatCurrencyWithCode(holding.convertedValue, baseCurrency)
                              : formatCurrencyWithCode(holding.currentValue, holding.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className={`flex items-center justify-end gap-1 ${gainLoss >= 0 ? 'text-success' : 'text-destructive'}`}
                            >
                              {gainLoss >= 0 ? <TrendUp size={16} /> : <TrendDown size={16} />}
                              <span className="font-semibold">
                                {enableConversion
                                  ? formatCurrencyWithCode(Math.abs(gainLoss), baseCurrency, false)
                                  : formatCurrencyWithCode(Math.abs(gainLoss), holding.currency, false)}{' '}
                                ({gainLossPercent >= 0 ? '+' : ''}
                                {gainLossPercent.toFixed(2)}%)
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-6">
          {portfolioData.currencyData.map(currencyGroup => (
            <Card key={currencyGroup.currency}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CurrencyCircleDollar size={24} weight="duotone" />
                      {getCurrencyName(currencyGroup.currency)} ({currencyGroup.currency})
                    </CardTitle>
                    <CardDescription>
                      {currencyGroup.holdings.length} {currencyGroup.holdings.length === 1 ? 'position' : 'positions'}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-display font-bold wealth-number">
                      {formatCurrencyWithCode(currencyGroup.originalValue, currencyGroup.currency)}
                    </p>
                    {enableConversion && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {formatCurrencyWithCode(currencyGroup.value, baseCurrency)}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currencyGroup.holdings.map(holding => (
                    <div
                      key={holding.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{holding.instrument.symbol}</p>
                        <p className="text-sm text-muted-foreground">{holding.instrument.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrencyWithCode(holding.currentValue, currencyGroup.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {holding.quantity} @ {formatCurrencyWithCode(holding.instrument.currentPrice, currencyGroup.currency, false)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {enableConversion && Object.keys(exchangeRates).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Exchange Rates</CardTitle>
            <CardDescription>
              Rates relative to 1 {getCurrencyName(baseCurrency)} ({baseCurrency})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {availableCurrencies
                .filter(c => c !== baseCurrency)
                .map(currency => (
                  <div key={currency} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-sm text-muted-foreground">{getCurrencyName(currency)}</p>
                    <p className="text-lg font-semibold">
                      1 {baseCurrency} = {(exchangeRates[currency] || 0).toFixed(4)} {currency}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
