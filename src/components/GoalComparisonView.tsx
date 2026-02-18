import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  ChartLine,
  Calendar,
  CurrencyDollar,
  TrendUp,
  Target,
  Warning,
  CheckCircle,
  X,
  Sparkle,
} from '@phosphor-icons/react'
import type { Goal } from '@/lib/types'
import { format, differenceInMonths } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface GoalComparisonViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goals: Goal[]
  onGenerateInsights?: () => void
}

export function GoalComparisonView({ open, onOpenChange, goals, onGenerateInsights }: GoalComparisonViewProps) {
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])

  const selectedGoals = goals.filter(g => selectedGoalIds.includes(g.id))
  const canCompare = selectedGoals.length >= 2 && selectedGoals.length <= 4

  const toggleGoal = (goalId: string) => {
    if (selectedGoalIds.includes(goalId)) {
      setSelectedGoalIds(selectedGoalIds.filter(id => id !== goalId))
    } else if (selectedGoalIds.length < 4) {
      setSelectedGoalIds([...selectedGoalIds, goalId])
    }
  }

  const compareMetrics = selectedGoals.map(goal => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100
    const monthsRemaining = differenceInMonths(new Date(goal.targetDate), new Date())
    const requiredMonthly = monthsRemaining > 0 
      ? Math.max(0, (goal.targetAmount - goal.currentAmount) / monthsRemaining)
      : 0
    const isOnTrack = goal.monthlyContribution >= requiredMonthly * 0.9

    return {
      goal,
      progress,
      monthsRemaining: Math.max(0, monthsRemaining),
      requiredMonthly,
      isOnTrack,
      gap: Math.max(0, goal.targetAmount - goal.currentAmount),
    }
  })

  const chartData = compareMetrics.map(m => ({
    name: m.goal.name.length > 15 ? m.goal.name.substring(0, 15) + '...' : m.goal.name,
    'Current Amount': m.goal.currentAmount,
    'Remaining Amount': m.gap,
    'Target Amount': m.goal.targetAmount,
  }))

  const totalMonthlyNeeded = compareMetrics.reduce((sum, m) => sum + m.requiredMonthly, 0)
  const totalCurrentContributions = selectedGoals.reduce((sum, g) => sum + g.monthlyContribution, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ChartLine size={28} weight="duotone" className="text-accent" />
            Compare Financial Goals
          </DialogTitle>
          <DialogDescription>
            Select 2-4 goals to compare side-by-side and analyze trade-offs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!canCompare && (
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Target size={24} className="text-accent flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-accent-foreground mb-1">
                      Select Goals to Compare
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Choose between 2 and 4 goals from the list below to see a detailed comparison.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Available Goals ({goals.length})
            </h3>
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
              {goals.map(goal => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                const isSelected = selectedGoalIds.includes(goal.id)
                const isDisabled = !isSelected && selectedGoalIds.length >= 4

                return (
                  <Card
                    key={goal.id}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-accent shadow-md bg-accent/5' 
                        : isDisabled 
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-accent/50 hover:shadow'
                    }`}
                    onClick={() => !isDisabled && toggleGoal(goal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{goal.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}</span>
                          </div>
                          <Progress value={progress} className="h-1.5 mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {canCompare && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg">
                    Visual Comparison
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGoalIds([])}
                    className="gap-1"
                  >
                    <X size={16} />
                    Clear Selection
                  </Button>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 155)" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: 'oklch(0.50 0.01 155)', fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fill: 'oklch(0.50 0.01 155)', fontSize: 12 }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                          contentStyle={{
                            backgroundColor: 'oklch(1 0 0)',
                            border: '1px solid oklch(0.88 0.01 155)',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Current Amount" stackId="a" fill="oklch(0.55 0.15 145)" />
                        <Bar dataKey="Remaining Amount" stackId="a" fill="oklch(0.88 0.01 155)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg">
                  Side-by-Side Metrics
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-sm text-muted-foreground">
                          Metric
                        </th>
                        {selectedGoals.map(goal => (
                          <th key={goal.id} className="text-left p-3 font-semibold">
                            {goal.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium text-sm">Target Amount</td>
                        {selectedGoals.map(goal => (
                          <td key={goal.id} className="p-3 font-display font-bold text-lg">
                            ${goal.targetAmount.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium text-sm">Current Savings</td>
                        {selectedGoals.map(goal => (
                          <td key={goal.id} className="p-3">
                            ${goal.currentAmount.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium text-sm">Progress</td>
                        {compareMetrics.map(metric => (
                          <td key={metric.goal.id} className="p-3">
                            <div className="flex items-center gap-2">
                              <Progress value={metric.progress} className="h-2 flex-1" />
                              <span className="text-sm font-semibold min-w-[3rem] text-right">
                                {metric.progress.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium text-sm">Target Date</td>
                        {selectedGoals.map(goal => (
                          <td key={goal.id} className="p-3">
                            {format(new Date(goal.targetDate), 'MMM yyyy')}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium text-sm">Months Remaining</td>
                        {compareMetrics.map(metric => (
                          <td key={metric.goal.id} className="p-3">
                            <Badge variant={metric.monthsRemaining < 12 ? 'destructive' : 'secondary'}>
                              {metric.monthsRemaining} months
                            </Badge>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium text-sm">Current Monthly</td>
                        {selectedGoals.map(goal => (
                          <td key={goal.id} className="p-3">
                            ${goal.monthlyContribution.toLocaleString()}/mo
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium text-sm">Required Monthly</td>
                        {compareMetrics.map(metric => (
                          <td key={metric.goal.id} className="p-3">
                            <span className={metric.goal.monthlyContribution < metric.requiredMonthly ? 'text-warning font-semibold' : ''}>
                              ${metric.requiredMonthly.toLocaleString()}/mo
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="p-3 font-medium text-sm">On Track</td>
                        {compareMetrics.map(metric => (
                          <td key={metric.goal.id} className="p-3">
                            {metric.isOnTrack ? (
                              <div className="flex items-center gap-1.5 text-success">
                                <CheckCircle size={18} weight="fill" />
                                <span className="text-sm font-semibold">Yes</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-warning">
                                <Warning size={18} weight="fill" />
                                <span className="text-sm font-semibold">Behind</span>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendUp size={22} weight="duotone" className="text-primary" />
                    Combined Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Total Monthly Needed
                      </p>
                      <p className="text-2xl font-display font-bold text-primary">
                        ${totalMonthlyNeeded.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Current Monthly Total
                      </p>
                      <p className="text-2xl font-display font-bold">
                        ${totalCurrentContributions.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {totalCurrentContributions < totalMonthlyNeeded && (
                    <div className="flex gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <Warning size={20} className="text-warning flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-warning-foreground mb-1">
                          Monthly Shortfall: ${(totalMonthlyNeeded - totalCurrentContributions).toLocaleString()}
                        </p>
                        <p className="text-muted-foreground">
                          You're contributing ${(totalMonthlyNeeded - totalCurrentContributions).toLocaleString()} less per month than needed across these goals.
                        </p>
                      </div>
                    </div>
                  )}

                  {onGenerateInsights && (
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={onGenerateInsights}
                    >
                      <Sparkle size={18} weight="duotone" />
                      Get AI Insights on These Goals
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
