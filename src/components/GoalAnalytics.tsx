import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartLine, TrendUp, TrendDown, Calendar, CurrencyDollar, Target } from '@phosphor-icons/react'
import type { Goal, GoalProgressSnapshot } from '@/lib/types'
import { format, parseISO, differenceInMonths } from 'date-fns'

interface GoalAnalyticsProps {
  goal: Goal
}

export function GoalAnalytics({ goal }: GoalAnalyticsProps) {
  const progressData = useMemo(() => {
    if (!goal.progressHistory || goal.progressHistory.length === 0) {
      return []
    }

    return goal.progressHistory
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(snapshot => ({
        date: format(parseISO(snapshot.timestamp), 'MMM yyyy'),
        fullDate: snapshot.timestamp,
        current: snapshot.currentAmount,
        target: snapshot.targetAmount,
        contribution: snapshot.monthlyContribution,
        progressPct: (snapshot.currentAmount / snapshot.targetAmount) * 100,
      }))
  }, [goal.progressHistory])

  const trendData = useMemo(() => {
    if (progressData.length < 2) return null

    const recent = progressData.slice(-6)
    const growthRates = recent.slice(1).map((point, idx) => {
      const prev = recent[idx]
      const monthsDiff = differenceInMonths(parseISO(point.fullDate), parseISO(prev.fullDate))
      if (monthsDiff === 0) return 0
      return ((point.current - prev.current) / monthsDiff)
    })

    const avgMonthlyGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
    const totalGrowth = recent[recent.length - 1].current - recent[0].current
    const isAccelerating = growthRates[growthRates.length - 1] > avgMonthlyGrowth

    return {
      avgMonthlyGrowth,
      totalGrowth,
      isAccelerating,
      recentGrowthRate: growthRates[growthRates.length - 1],
    }
  }, [progressData])

  const projectionData = useMemo(() => {
    if (progressData.length === 0 || !trendData) return []

    const lastSnapshot = progressData[progressData.length - 1]
    const monthsRemaining = differenceInMonths(parseISO(goal.targetDate), new Date())
    
    const projected: Array<{
      date: string
      fullDate: string
      current: number | null
      projected: number | null
      target: number
    }> = []
    let currentAmount = lastSnapshot.current
    
    for (let i = 1; i <= Math.min(monthsRemaining, 24); i++) {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + i)
      
      currentAmount += trendData.avgMonthlyGrowth
      
      projected.push({
        date: format(futureDate, 'MMM yyyy'),
        fullDate: futureDate.toISOString(),
        current: null,
        projected: Math.min(currentAmount, goal.targetAmount),
        target: goal.targetAmount,
      })
    }

    return [...progressData.map(p => ({ ...p, projected: null as number | null })), ...projected]
  }, [progressData, trendData, goal.targetDate, goal.targetAmount])

  const insights = useMemo(() => {
    if (!trendData || progressData.length < 2) return []

    const results: Array<{ type: 'positive' | 'warning' | 'neutral'; text: string }> = []
    const currentProgress = (goal.currentAmount / goal.targetAmount) * 100
    const monthsRemaining = differenceInMonths(parseISO(goal.targetDate), new Date())
    const requiredMonthly = monthsRemaining > 0 ? (goal.targetAmount - goal.currentAmount) / monthsRemaining : 0

    if (trendData.isAccelerating) {
      results.push({
        type: 'positive',
        text: `Your savings rate is accelerating! Recent growth is ${Math.abs(trendData.recentGrowthRate - trendData.avgMonthlyGrowth).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}/mo above average.`,
      })
    }

    if (trendData.avgMonthlyGrowth > requiredMonthly) {
      const ahead = Math.round((trendData.avgMonthlyGrowth - requiredMonthly) / requiredMonthly * 100)
      results.push({
        type: 'positive',
        text: `You're ahead of schedule! Current pace is ${ahead}% faster than needed to reach your goal on time.`,
      })
    } else if (requiredMonthly > trendData.avgMonthlyGrowth) {
      const shortfall = requiredMonthly - trendData.avgMonthlyGrowth
      results.push({
        type: 'warning',
        text: `Consider increasing contributions by ${shortfall.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}/mo to stay on track.`,
      })
    }

    if (currentProgress >= 25 && currentProgress < 50) {
      results.push({
        type: 'neutral',
        text: `Quarter way there! You've built strong momentum in the first 25% of your goal.`,
      })
    } else if (currentProgress >= 50 && currentProgress < 75) {
      results.push({
        type: 'positive',
        text: `Halfway milestone reached! The finish line is coming into view.`,
      })
    } else if (currentProgress >= 75) {
      results.push({
        type: 'positive',
        text: `Final stretch! You're in the last quarter of your journey to this goal.`,
      })
    }

    return results
  }, [trendData, progressData, goal])

  if (!goal.progressHistory || goal.progressHistory.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine className="text-accent" />
            Goal Analytics
          </CardTitle>
          <CardDescription>
            Historical progress tracking and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <ChartLine size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Not enough data yet</p>
            <p className="text-xs mt-2">Make a few more contributions to see progress trends and projections</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartLine className="text-accent" />
          Goal Analytics
        </CardTitle>
        <CardDescription>
          Historical progress tracking and future projections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {insights.length > 0 && (
          <div className="grid gap-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  insight.type === 'positive'
                    ? 'bg-success/5 border-success/20'
                    : insight.type === 'warning'
                    ? 'bg-warning/5 border-warning/20'
                    : 'bg-muted/50 border-border'
                }`}
              >
                {insight.type === 'positive' ? (
                  <TrendUp className="text-success mt-0.5 shrink-0" size={20} />
                ) : insight.type === 'warning' ? (
                  <TrendDown className="text-warning mt-0.5 shrink-0" size={20} />
                ) : (
                  <Target className="text-accent mt-0.5 shrink-0" size={20} />
                )}
                <p className="text-sm text-foreground">{insight.text}</p>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress">Progress History</TabsTrigger>
            <TabsTrigger value="projection">Future Projection</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Monthly Growth</p>
                <p className="text-lg font-display font-bold text-foreground">
                  {trendData?.avgMonthlyGrowth.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Recent 6mo Growth</p>
                <p className="text-lg font-display font-bold text-success">
                  {trendData?.totalGrowth.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Data Points</p>
                <p className="text-lg font-display font-bold text-foreground">
                  {progressData.length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Trend</p>
                <Badge variant={trendData?.isAccelerating ? 'default' : 'secondary'}>
                  {trendData?.isAccelerating ? 'Accelerating' : 'Steady'}
                </Badge>
              </div>
            </div>

            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="oklch(0.65 0.15 195)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 155)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="oklch(0.50 0.01 155)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="oklch(0.50 0.01 155)"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.88 0.01 155)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [
                      value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                      'Amount'
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke="oklch(0.65 0.15 195)"
                    strokeWidth={2}
                    fill="url(#colorCurrent)"
                    name="Current Amount"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="oklch(0.45 0.12 155)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Target Amount"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="projection" className="space-y-4 mt-6">
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
              <Calendar className="text-accent shrink-0 mt-0.5" size={20} />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-foreground">Projection Methodology</p>
                <p className="text-xs text-muted-foreground">
                  Based on your last 6 months of average growth ({trendData?.avgMonthlyGrowth.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}/mo), 
                  we project your future progress. Actual results may vary based on market conditions and contribution changes.
                </p>
              </div>
            </div>

            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 155)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="oklch(0.50 0.01 155)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="oklch(0.50 0.01 155)"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.88 0.01 155)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => {
                      if (value === null || value === undefined) return ['—', '']
                      const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                      if (isNaN(numValue)) return ['—', '']
                      return [
                        numValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                        ''
                      ]
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="oklch(0.65 0.15 195)"
                    strokeWidth={2}
                    name="Historical"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="oklch(0.65 0.15 195)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Projected"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="oklch(0.45 0.12 155)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
