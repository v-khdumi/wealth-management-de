import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import {
  ChartLine,
  ChartPie,
  ArrowsClockwise,
  Funnel,
  TrendUp,
  Globe,
  CalendarBlank,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BankStatement } from '@/lib/types'
import {
  getExchangeRates,
  convertCurrency,
  formatCurrencyWithCode,
  getCurrencyName,
  detectUniqueCurrencies,
  CURRENCY_DATABASE,
} from '@/lib/currency-utils'

interface MultiCurrencySpendingComparisonProps {
  statements: BankStatement[]
}

const COLORS = [
  'oklch(0.45 0.12 155)',
  'oklch(0.65 0.15 195)',
  'oklch(0.35 0.08 240)',
  'oklch(0.70 0.15 75)',
  'oklch(0.55 0.15 145)',
  'oklch(0.55 0.22 25)',
  'oklch(0.60 0.10 300)',
  'oklch(0.50 0.08 180)',
]

export function MultiCurrencySpendingComparison({ statements }: MultiCurrencySpendingComparisonProps) {
  const [baseCurrency, setBaseCurrency] = useState<string>('USD')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [enableConversion, setEnableConversion] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL')
  const [chartView, setChartView] = useState<'by-currency' | 'by-category' | 'timeline' | 'radar'>('by-currency')

  const availableCurrencies = useMemo(() => detectUniqueCurrencies(statements), [statements])

  const completedStatements = useMemo(
    () => statements.filter(s => s.status === 'COMPLETED' && s.extractedData),
    [statements]
  )

  useEffect(() => {
    const loadRates = async () => {
      setIsLoadingRates(true)
      try {
        const rates = await getExchangeRates(baseCurrency)
        setExchangeRates(rates)
      } catch (error) {
        console.error('Failed to load exchange rates:', error)
      } finally {
        setIsLoadingRates(false)
      }
    }

    if (enableConversion && availableCurrencies.length > 1) {
      loadRates()
    }
  }, [baseCurrency, enableConversion, availableCurrencies.length])

  const comparisonData = useMemo(() => {
    if (completedStatements.length === 0) return null

    let filteredStatements = completedStatements
    if (selectedCurrency !== 'ALL') {
      filteredStatements = completedStatements.filter(s => s.extractedData?.currency === selectedCurrency)
    }

    if (filteredStatements.length === 0) return null

    const convert = (amount: number, fromCurrency?: string) => {
      if (!enableConversion || !fromCurrency || Object.keys(exchangeRates).length === 0) {
        return amount
      }
      return convertCurrency(amount, fromCurrency, baseCurrency, exchangeRates)
    }

    const byCurrency: Record<string, { totalIncome: number; totalExpenses: number; netSavings: number; count: number }> = {}
    const byCategory: Record<string, { amount: number; count: number; currencies: Set<string> }> = {}
    const byMonth: Record<string, { income: number; expenses: number; savings: number }> = {}

    filteredStatements.forEach(statement => {
      const data = statement.extractedData!
      const currency = data.currency || 'USD'
      const income = convert(data.totalIncome || 0, currency)
      const expenses = convert(data.totalExpenses || 0, currency)
      const net = income - expenses

      if (!byCurrency[currency]) {
        byCurrency[currency] = { totalIncome: 0, totalExpenses: 0, netSavings: 0, count: 0 }
      }
      byCurrency[currency].totalIncome += income
      byCurrency[currency].totalExpenses += expenses
      byCurrency[currency].netSavings += net
      byCurrency[currency].count += 1

      data.categorySummary?.forEach(cat => {
        const convertedAmount = convert(cat.amount, currency)
        if (!byCategory[cat.category]) {
          byCategory[cat.category] = { amount: 0, count: 0, currencies: new Set() }
        }
        byCategory[cat.category].amount += convertedAmount
        byCategory[cat.category].count += cat.transactionCount
        byCategory[cat.category].currencies.add(currency)
      })

      if (data.statementDate) {
        const date = new Date(data.statementDate)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!byMonth[monthKey]) {
          byMonth[monthKey] = { income: 0, expenses: 0, savings: 0 }
        }
        byMonth[monthKey].income += income
        byMonth[monthKey].expenses += expenses
        byMonth[monthKey].savings += net
      }
    })

    const currencyData = Object.entries(byCurrency).map(([currency, data]) => ({
      currency,
      income: data.totalIncome,
      expenses: data.totalExpenses,
      netSavings: data.netSavings,
      statements: data.count,
    }))

    const categoryData = Object.entries(byCategory)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        transactions: data.count,
        currencies: Array.from(data.currencies),
      }))
      .sort((a, b) => b.amount - a.amount)

    const monthlyData = Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        netSavings: data.savings,
      }))

    const radarData = categoryData.slice(0, 8).map(cat => ({
      category: cat.category,
      spending: cat.amount,
    }))

    const totalIncome = currencyData.reduce((sum, c) => sum + c.income, 0)
    const totalExpenses = currencyData.reduce((sum, c) => sum + c.expenses, 0)
    const totalNet = totalIncome - totalExpenses

    return {
      currencyData,
      categoryData,
      monthlyData,
      radarData,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        netSavings: totalNet,
        savingsRate: totalIncome > 0 ? (totalNet / totalIncome) * 100 : 0,
      },
    }
  }, [completedStatements, selectedCurrency, baseCurrency, exchangeRates, enableConversion])

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

  if (completedStatements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <ChartLine size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">No Data Available</p>
          <p className="text-sm">Upload bank statements to see spending comparisons</p>
        </CardContent>
      </Card>
    )
  }

  if (!comparisonData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Funnel size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">No Results</p>
          <p className="text-sm">No statements match the selected filter</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <ChartLine size={24} weight="duotone" className="text-accent" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Multi-Currency Spending Comparison
                  {isLoadingRates && <ArrowsClockwise size={18} className="animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  Analyze spending patterns across {availableCurrencies.length}{' '}
                  {availableCurrencies.length === 1 ? 'currency' : 'currencies'}
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
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-4">
              <Switch
                id="enable-conversion-compare"
                checked={enableConversion}
                onCheckedChange={setEnableConversion}
              />
              <Label htmlFor="enable-conversion-compare" className="cursor-pointer text-sm">
                Enable Currency Conversion
              </Label>
            </div>

            {enableConversion && (
              <div className="flex items-center gap-2">
                <Label htmlFor="base-currency-compare" className="whitespace-nowrap text-sm">
                  Base:
                </Label>
                <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                  <SelectTrigger id="base-currency-compare" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_DATABASE).map(([code, info]) => (
                      <SelectItem key={code} value={code}>
                        {info.symbol} {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Label htmlFor="currency-filter" className="whitespace-nowrap text-sm">
                <Funnel size={16} className="inline mr-1" />
                Filter:
              </Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger id="currency-filter" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Currencies</SelectItem>
                  {availableCurrencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency} - {getCurrencyName(currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="chart-view" className="whitespace-nowrap text-sm">
                View:
              </Label>
              <Select value={chartView} onValueChange={(v) => setChartView(v as any)}>
                <SelectTrigger id="chart-view" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="by-currency">By Currency</SelectItem>
                  <SelectItem value="by-category">By Category</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="radar">Radar View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                <p className="text-2xl font-display font-bold wealth-number text-primary">
                  {enableConversion
                    ? formatCurrencyWithCode(comparisonData.totals.income, baseCurrency, false)
                    : `$${comparisonData.totals.income.toLocaleString()}`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-2xl font-display font-bold wealth-number text-destructive">
                  {enableConversion
                    ? formatCurrencyWithCode(comparisonData.totals.expenses, baseCurrency, false)
                    : `$${comparisonData.totals.expenses.toLocaleString()}`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-success/10 border-success/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Net Savings</p>
                <p className="text-2xl font-display font-bold wealth-number text-success">
                  {enableConversion
                    ? formatCurrencyWithCode(comparisonData.totals.netSavings, baseCurrency, false)
                    : `$${comparisonData.totals.netSavings.toLocaleString()}`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Savings Rate</p>
                <p className="text-2xl font-display font-bold wealth-number text-accent flex items-center gap-2">
                  <TrendUp size={24} />
                  {comparisonData.totals.savingsRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {chartView === 'by-currency' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe size={24} weight="duotone" />
              Spending by Currency
            </CardTitle>
            <CardDescription>Income, expenses, and net savings comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData.currencyData}>
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
                <Legend />
                <Bar dataKey="income" fill="oklch(0.55 0.15 145)" name="Income" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="oklch(0.55 0.22 25)" name="Expenses" radius={[8, 8, 0, 0]} />
                <Bar dataKey="netSavings" fill="oklch(0.65 0.15 195)" name="Net Savings" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {chartView === 'by-category' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartPie size={24} weight="duotone" />
                Category Distribution
              </CardTitle>
              <CardDescription>Spending breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={comparisonData.categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {comparisonData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      enableConversion
                        ? formatCurrencyWithCode(value, baseCurrency)
                        : `$${value.toLocaleString()}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
              <CardDescription>Highest spending categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.categoryData.slice(0, 10).map((cat, index) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{cat.category}</span>
                        <div className="flex gap-1">
                          {cat.currencies.map(curr => (
                            <Badge key={curr} variant="outline" className="text-xs">
                              {curr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <span className="font-semibold">
                        {enableConversion
                          ? formatCurrencyWithCode(cat.amount, baseCurrency, false)
                          : `$${cat.amount.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cat.transactions} {cat.transactions === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartView === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarBlank size={24} weight="duotone" />
              Monthly Trends
            </CardTitle>
            <CardDescription>Income, expenses, and savings over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={comparisonData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    enableConversion
                      ? formatCurrencyWithCode(value, baseCurrency)
                      : `$${value.toLocaleString()}`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="oklch(0.55 0.15 145)"
                  strokeWidth={2}
                  name="Income"
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="oklch(0.55 0.22 25)"
                  strokeWidth={2}
                  name="Expenses"
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="netSavings"
                  stroke="oklch(0.65 0.15 195)"
                  strokeWidth={2}
                  name="Net Savings"
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {chartView === 'radar' && (
        <Card>
          <CardHeader>
            <CardTitle>Spending Pattern Analysis</CardTitle>
            <CardDescription>Radar view of top spending categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={500}>
              <RadarChart data={comparisonData.radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis />
                <Radar
                  name="Spending"
                  dataKey="spending"
                  stroke="oklch(0.65 0.15 195)"
                  fill="oklch(0.65 0.15 195)"
                  fillOpacity={0.6}
                />
                <Tooltip
                  formatter={(value: number) =>
                    enableConversion
                      ? formatCurrencyWithCode(value, baseCurrency)
                      : `$${value.toLocaleString()}`
                  }
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
