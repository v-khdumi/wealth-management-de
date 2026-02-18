import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  ChartLine,
  TrendUp,
  TrendDown,
  CalendarBlank,
  Minus,
} from '@phosphor-icons/react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { BankStatement } from '@/lib/types'

interface MultiStatementComparisonProps {
  statements: BankStatement[]
}

export function MultiStatementComparison({ statements }: MultiStatementComparisonProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const completedStatements = useMemo(() =>
    statements
      .filter(s => s.status === 'COMPLETED' && s.extractedData)
      .sort((a, b) => {
        const dateA = new Date(a.extractedData?.statementDate || 0)
        const dateB = new Date(b.extractedData?.statementDate || 0)
        return dateA.getTime() - dateB.getTime()
      }),
    [statements]
  )

  const monthlyData = useMemo(() => {
    return completedStatements.map(stmt => ({
      month: stmt.extractedData?.statementDate 
        ? new Date(stmt.extractedData.statementDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : 'N/A',
      income: stmt.extractedData?.totalIncome || 0,
      expenses: stmt.extractedData?.totalExpenses || 0,
      net: (stmt.extractedData?.totalIncome || 0) - (stmt.extractedData?.totalExpenses || 0),
      savingsRate: stmt.extractedData?.totalIncome 
        ? (((stmt.extractedData.totalIncome - (stmt.extractedData.totalExpenses || 0)) / stmt.extractedData.totalIncome) * 100)
        : 0
    }))
  }, [completedStatements])

  const categoryTrends = useMemo(() => {
    const categoryMap = new Map<string, number[]>()
    
    completedStatements.forEach(stmt => {
      stmt.extractedData?.categorySummary?.forEach(cat => {
        if (!categoryMap.has(cat.category)) {
          categoryMap.set(cat.category, Array(completedStatements.length).fill(0))
        }
        const index = completedStatements.indexOf(stmt)
        categoryMap.get(cat.category)![index] = cat.amount
      })
    })

    return Array.from(categoryMap.entries()).map(([category, values]) => ({
      category,
      values,
      total: values.reduce((sum, v) => sum + v, 0),
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
      trend: values.length >= 2 ? 
        (values[values.length - 1] - values[values.length - 2]) / values[values.length - 2] * 100 : 0
    })).sort((a, b) => b.total - a.total)
  }, [completedStatements])

  const categoryComparisonData = useMemo(() => {
    if (!selectedCategory) return []

    return completedStatements.map((stmt, index) => ({
      month: stmt.extractedData?.statementDate 
        ? new Date(stmt.extractedData.statementDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : 'N/A',
      amount: stmt.extractedData?.categorySummary?.find(c => c.category === selectedCategory)?.amount || 0,
    }))
  }, [completedStatements, selectedCategory])

  const overallStats = useMemo(() => {
    if (completedStatements.length === 0) return null

    const totalIncome = completedStatements.reduce((sum, s) => sum + (s.extractedData?.totalIncome || 0), 0)
    const totalExpenses = completedStatements.reduce((sum, s) => sum + (s.extractedData?.totalExpenses || 0), 0)
    const avgIncome = totalIncome / completedStatements.length
    const avgExpenses = totalExpenses / completedStatements.length
    const avgSavingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100

    const firstMonth = completedStatements[0]
    const lastMonth = completedStatements[completedStatements.length - 1]
    
    const expensesChange = lastMonth.extractedData && firstMonth.extractedData
      ? ((lastMonth.extractedData.totalExpenses || 0) - (firstMonth.extractedData.totalExpenses || 0)) / 
        (firstMonth.extractedData.totalExpenses || 1) * 100
      : 0

    return {
      totalIncome,
      totalExpenses,
      avgIncome,
      avgExpenses,
      avgSavingsRate,
      expensesChange,
      statementCount: completedStatements.length
    }
  }, [completedStatements])

  if (completedStatements.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine size={24} />
            Multi-Statement Comparison
          </CardTitle>
          <CardDescription>Compare spending trends across multiple statements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <ChartLine size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">Need at least 2 statements</p>
            <p className="text-sm mt-1">Upload more statements to see comparison trends</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine size={24} />
            Multi-Statement Comparison
          </CardTitle>
          <CardDescription>
            Analyzing {completedStatements.length} statements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Monthly Income</p>
              <p className="text-2xl font-bold">${overallStats?.avgIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Monthly Expenses</p>
              <p className="text-2xl font-bold">${overallStats?.avgExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Savings Rate</p>
              <p className="text-2xl font-bold">{overallStats?.avgSavingsRate.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Expense Trend
                {overallStats && overallStats.expensesChange > 0 ? (
                  <TrendUp size={16} className="text-destructive" />
                ) : overallStats && overallStats.expensesChange < 0 ? (
                  <TrendDown size={16} className="text-success" />
                ) : (
                  <Minus size={16} className="text-muted-foreground" />
                )}
              </p>
              <p className={`text-2xl font-bold ${
                overallStats && overallStats.expensesChange > 0 ? 'text-destructive' :
                overallStats && overallStats.expensesChange < 0 ? 'text-success' :
                'text-muted-foreground'
              }`}>
                {overallStats?.expensesChange.toFixed(1)}%
              </p>
            </div>
          </div>

          <Tabs defaultValue="monthly" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
              <TabsTrigger value="categories">Category Trends</TabsTrigger>
              <TabsTrigger value="savings">Savings Rate</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="hsl(var(--success))" name="Income" />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Category Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-80 overflow-auto">
                    {categoryTrends.map(cat => (
                      <div
                        key={cat.category}
                        onClick={() => setSelectedCategory(cat.category)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCategory === cat.category 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{cat.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              ${cat.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                            </span>
                            <Badge variant={
                              cat.trend > 10 ? 'destructive' :
                              cat.trend < -10 ? 'default' :
                              'secondary'
                            }>
                              {cat.trend > 0 ? '+' : ''}{cat.trend.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {selectedCategory ? `${selectedCategory} Trend` : 'Select a category'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCategory ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={categoryComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: number) => `$${value.toLocaleString()}`}
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="amount" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={{ fill: 'hsl(var(--primary))' }}
                              name={selectedCategory}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <CalendarBlank size={48} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Click a category to view trend</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="savings" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => value.toFixed(1) + '%'}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="savingsRate" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--success))' }}
                      name="Savings Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {monthlyData.map((month, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-1">{month.month}</p>
                      <p className="text-xl font-bold">{month.savingsRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${month.net.toLocaleString()} saved
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
