import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendUp, TrendDown, CurrencyCircleDollar, ChartLine, Calendar, DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BankStatement } from '@/lib/types'
import { getCurrencySymbol, getCurrencyName, detectUniqueCurrencies } from '@/lib/currency-utils'

interface CurrencySpendingTrendsProps {
  statements: BankStatement[]
}

const COLORS = [
  'oklch(0.45 0.12 155)',
  'oklch(0.65 0.15 195)',
  'oklch(0.35 0.08 240)',
  'oklch(0.70 0.15 75)',
  'oklch(0.55 0.15 145)',
  'oklch(0.55 0.22 25)',
]

export function CurrencySpendingTrends({ statements }: CurrencySpendingTrendsProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL')
  const [timeRange, setTimeRange] = useState<'3M' | '6M' | '12M' | 'ALL'>('6M')

  const availableCurrencies = useMemo(() => detectUniqueCurrencies(statements), [statements])

  const currencyData = useMemo(() => {
    const completedStatements = statements.filter(s => s.status === 'COMPLETED' && s.extractedData)
    
    const currencyMap = new Map<string, {
      currency: string
      totalIncome: number
      totalExpenses: number
      netSavings: number
      savingsRate: number
      statementCount: number
      categories: Map<string, number>
      monthlyTrends: Array<{
        month: string
        date: string
        income: number
        expenses: number
        net: number
      }>
    }>()

    completedStatements.forEach(stmt => {
      const currency = stmt.extractedData?.currency || 'USD'
      const currencySymbol = stmt.extractedData?.currencySymbol || getCurrencySymbol(currency)
      
      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, {
          currency,
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0,
          savingsRate: 0,
          statementCount: 0,
          categories: new Map(),
          monthlyTrends: []
        })
      }

      const data = currencyMap.get(currency)!
      data.totalIncome += stmt.extractedData?.totalIncome || 0
      data.totalExpenses += stmt.extractedData?.totalExpenses || 0
      data.statementCount += 1

      stmt.extractedData?.categorySummary?.forEach(cat => {
        data.categories.set(
          cat.category,
          (data.categories.get(cat.category) || 0) + cat.amount
        )
      })

      const stmtDate = stmt.extractedData?.statementDate 
        ? new Date(stmt.extractedData.statementDate)
        : new Date(stmt.uploadedAt)
      
      data.monthlyTrends.push({
        month: stmtDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        date: stmt.extractedData?.statementDate || stmt.uploadedAt,
        income: stmt.extractedData?.totalIncome || 0,
        expenses: stmt.extractedData?.totalExpenses || 0,
        net: (stmt.extractedData?.totalIncome || 0) - (stmt.extractedData?.totalExpenses || 0)
      })
    })

    currencyMap.forEach((data, currency) => {
      data.netSavings = data.totalIncome - data.totalExpenses
      data.savingsRate = data.totalIncome > 0 ? ((data.netSavings / data.totalIncome) * 100) : 0
      data.monthlyTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })

    return currencyMap
  }, [statements])

  const filteredData = useMemo(() => {
    if (selectedCurrency === 'ALL') {
      return Array.from(currencyData.values())
    }
    const data = currencyData.get(selectedCurrency)
    return data ? [data] : []
  }, [currencyData, selectedCurrency])

  const categoryBreakdown = useMemo(() => {
    if (filteredData.length === 0) return []
    
    const allCategories = new Map<string, number>()
    filteredData.forEach(data => {
      data.categories.forEach((amount, category) => {
        allCategories.set(category, (allCategories.get(category) || 0) + amount)
      })
    })

    return Array.from(allCategories.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredData])

  const trendData = useMemo(() => {
    if (filteredData.length === 0) return []
    
    const allTrends = new Map<string, { income: number; expenses: number; net: number }>()
    
    filteredData.forEach(data => {
      data.monthlyTrends.forEach(trend => {
        const existing = allTrends.get(trend.month) || { income: 0, expenses: 0, net: 0 }
        allTrends.set(trend.month, {
          income: existing.income + trend.income,
          expenses: existing.expenses + trend.expenses,
          net: existing.net + trend.net
        })
      })
    })

    const sorted = Array.from(allTrends.entries())
      .map(([month, data]) => ({ month, ...data }))
    
    const monthLimit = timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : timeRange === '12M' ? 12 : sorted.length
    return sorted.slice(-monthLimit)
  }, [filteredData, timeRange])

  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) return null

    const totalIncome = filteredData.reduce((sum, d) => sum + d.totalIncome, 0)
    const totalExpenses = filteredData.reduce((sum, d) => sum + d.totalExpenses, 0)
    const netSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0
    const statementCount = filteredData.reduce((sum, d) => sum + d.statementCount, 0)

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      statementCount,
      currencySymbol: selectedCurrency !== 'ALL' ? getCurrencySymbol(selectedCurrency) : '$',
      currencyCode: selectedCurrency !== 'ALL' ? selectedCurrency : 'Mixed'
    }
  }, [filteredData, selectedCurrency])

  const handleExportCurrencyReport = () => {
    if (!summaryStats) {
      toast.error('No data to export')
      return
    }

    const csvLines = [
      'Currency Spending Trends Report',
      `Generated: ${new Date().toLocaleString()}`,
      `Currency Filter: ${selectedCurrency === 'ALL' ? 'All Currencies' : `${selectedCurrency} - ${getCurrencyName(selectedCurrency)}`}`,
      `Time Range: ${timeRange}`,
      '',
      'SUMMARY',
      `Total Income,${summaryStats.totalIncome.toFixed(2)}`,
      `Total Expenses,${summaryStats.totalExpenses.toFixed(2)}`,
      `Net Savings,${summaryStats.netSavings.toFixed(2)}`,
      `Savings Rate,${summaryStats.savingsRate.toFixed(2)}%`,
      `Statements Analyzed,${summaryStats.statementCount}`,
      '',
      'MONTHLY TRENDS',
      'Month,Income,Expenses,Net Savings',
      ...trendData.map(t => `${t.month},${t.income.toFixed(2)},${t.expenses.toFixed(2)},${t.net.toFixed(2)}`),
      '',
      'CATEGORY BREAKDOWN',
      'Category,Amount',
      ...categoryBreakdown.map(c => `${c.category},${c.amount.toFixed(2)}`),
      '',
    ]

    if (selectedCurrency === 'ALL') {
      csvLines.push('BREAKDOWN BY CURRENCY')
      csvLines.push('Currency,Income,Expenses,Net Savings,Savings Rate')
      Array.from(currencyData.values()).forEach(data => {
        csvLines.push(`${data.currency},${data.totalIncome.toFixed(2)},${data.totalExpenses.toFixed(2)},${data.netSavings.toFixed(2)},${data.savingsRate.toFixed(2)}%`)
      })
    }

    const csvContent = csvLines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `currency-spending-trends-${selectedCurrency}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Report exported successfully')
  }

  if (availableCurrencies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CurrencyCircleDollar size={24} weight="duotone" />
            Currency Spending Trends
          </CardTitle>
          <CardDescription>Analyze spending patterns by currency</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <CurrencyCircleDollar size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" weight="duotone" />
          <p className="text-sm text-muted-foreground">
            Upload bank statements to see currency-specific spending trends
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CurrencyCircleDollar size={24} weight="duotone" className="text-accent" />
              Currency Spending Trends
            </CardTitle>
            <CardDescription>
              Analyze spending patterns across {availableCurrencies.length} {availableCurrencies.length === 1 ? 'currency' : 'currencies'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCurrencyReport} className="gap-2">
            <DownloadSimple size={16} />
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-2 block">Currency</label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Currencies</SelectItem>
                {availableCurrencies.map(currency => (
                  <SelectItem key={currency} value={currency}>
                    {getCurrencySymbol(currency)} {currency} - {getCurrencyName(currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-2 block">Time Range</label>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3M">Last 3 Months</SelectItem>
                <SelectItem value="6M">Last 6 Months</SelectItem>
                <SelectItem value="12M">Last 12 Months</SelectItem>
                <SelectItem value="ALL">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {summaryStats && (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendUp size={14} className="text-success" />
                    Total Income
                  </div>
                  <p className="text-2xl font-display font-bold text-success">
                    {summaryStats.currencySymbol}{summaryStats.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {selectedCurrency !== 'ALL' && (
                    <p className="text-xs text-muted-foreground mt-1">{summaryStats.currencyCode}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-destructive/10 to-transparent border-destructive/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendDown size={14} className="text-destructive" />
                    Total Expenses
                  </div>
                  <p className="text-2xl font-display font-bold text-destructive">
                    {summaryStats.currencySymbol}{summaryStats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {selectedCurrency !== 'ALL' && (
                    <p className="text-xs text-muted-foreground mt-1">{summaryStats.currencyCode}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Net Savings</div>
                  <p className="text-2xl font-display font-bold text-primary">
                    {summaryStats.currencySymbol}{summaryStats.netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {selectedCurrency !== 'ALL' && (
                    <p className="text-xs text-muted-foreground mt-1">{summaryStats.currencyCode}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Savings Rate</div>
                  <p className="text-2xl font-display font-bold text-accent">
                    {summaryStats.savingsRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summaryStats.statementCount} statement{summaryStats.statementCount !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="trends" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="currencies">By Currency</TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Income vs Expenses Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `${summaryStats.currencySymbol}${(value / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value: number) => [
                            `${summaryStats.currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                            ''
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="income" 
                          stroke="oklch(0.55 0.15 145)" 
                          strokeWidth={2}
                          name="Income"
                          dot={{ fill: 'oklch(0.55 0.15 145)', r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="oklch(0.55 0.22 25)" 
                          strokeWidth={2}
                          name="Expenses"
                          dot={{ fill: 'oklch(0.55 0.22 25)', r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="net" 
                          stroke="oklch(0.45 0.12 155)" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Net Savings"
                          dot={{ fill: 'oklch(0.45 0.12 155)', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Spending by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryBreakdown.slice(0, 6)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.category}: ${((entry.amount / summaryStats.totalExpenses) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {categoryBreakdown.slice(0, 6).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [
                              `${summaryStats.currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                              ''
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categoryBreakdown.slice(0, 8).map((cat, index) => {
                          const percentage = (cat.amount / summaryStats.totalExpenses) * 100
                          return (
                            <div key={cat.category}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{cat.category}</span>
                                <span className="text-sm font-semibold">
                                  {summaryStats.currencySymbol}{cat.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-500"
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: COLORS[index % COLORS.length]
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="currencies" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Comparison by Currency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from(currencyData.entries()).map(([currency, data]) => (
                        <div key={currency} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <CurrencyCircleDollar size={20} weight="duotone" className="text-accent" />
                              <div>
                                <p className="font-semibold">{currency} - {getCurrencyName(currency)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {data.statementCount} statement{data.statementCount !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <Badge variant={data.netSavings >= 0 ? 'default' : 'destructive'}>
                              {data.savingsRate.toFixed(1)}% savings rate
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Income</p>
                              <p className="font-semibold text-success">
                                {getCurrencySymbol(currency)}{data.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Expenses</p>
                              <p className="font-semibold text-destructive">
                                {getCurrencySymbol(currency)}{data.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Net</p>
                              <p className={`font-semibold ${data.netSavings >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                {getCurrencySymbol(currency)}{data.netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}
