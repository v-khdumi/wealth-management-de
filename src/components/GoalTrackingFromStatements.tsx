import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Target, TrendUp, TrendDown, Lightbulb, ArrowRight, CheckCircle, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BankStatement, Goal } from '@/lib/types'
import { getCurrencySymbol } from '@/lib/currency-utils'

interface GoalTrackingFromStatementsProps {
  statements: BankStatement[]
  goals: Goal[]
  onUpdateGoal?: (goalId: string, newContribution: number) => void
  onCreateGoal?: () => void
}

export function GoalTrackingFromStatements({ 
  statements, 
  goals, 
  onUpdateGoal,
  onCreateGoal 
}: GoalTrackingFromStatementsProps) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null)

  const spendingAnalysis = useMemo(() => {
    const completedStatements = statements.filter(s => s.status === 'COMPLETED' && s.extractedData)
    if (completedStatements.length === 0) return null

    const totalMonths = completedStatements.length
    const avgMonthlyIncome = completedStatements.reduce((sum, s) => sum + (s.extractedData?.totalIncome || 0), 0) / totalMonths
    const avgMonthlyExpenses = completedStatements.reduce((sum, s) => sum + (s.extractedData?.totalExpenses || 0), 0) / totalMonths
    const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpenses

    const categorizedSpending = new Map<string, number>()
    completedStatements.forEach(stmt => {
      stmt.extractedData?.categorySummary?.forEach(cat => {
        categorizedSpending.set(
          cat.category,
          (categorizedSpending.get(cat.category) || 0) + cat.amount
        )
      })
    })

    const avgCategorySpending = new Map<string, number>()
    categorizedSpending.forEach((total, category) => {
      avgCategorySpending.set(category, total / totalMonths)
    })

    const topSpendingCategories = Array.from(avgCategorySpending.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const currency = completedStatements[0]?.extractedData?.currency || 'USD'
    const currencySymbol = completedStatements[0]?.extractedData?.currencySymbol || getCurrencySymbol(currency)

    return {
      avgMonthlyIncome,
      avgMonthlyExpenses,
      avgMonthlySavings,
      savingsRate: avgMonthlyIncome > 0 ? (avgMonthlySavings / avgMonthlyIncome) * 100 : 0,
      topSpendingCategories,
      totalMonths,
      currency,
      currencySymbol
    }
  }, [statements])

  const goalInsights = useMemo(() => {
    if (!spendingAnalysis || goals.length === 0) return []

    return goals.map(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100
      const remaining = goal.targetAmount - goal.currentAmount
      const monthsUntilTarget = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
      const requiredMonthly = monthsUntilTarget > 0 ? remaining / monthsUntilTarget : 0
      const currentContribution = goal.monthlyContribution
      const potentialSavings = spendingAnalysis.avgMonthlySavings
      const shortfall = Math.max(0, requiredMonthly - currentContribution)
      const surplus = Math.max(0, potentialSavings - currentContribution)
      
      let status: 'on-track' | 'at-risk' | 'ahead' = 'on-track'
      let recommendation = ''
      
      if (currentContribution >= requiredMonthly) {
        status = 'ahead'
        const ahead = currentContribution - requiredMonthly
        recommendation = `You're ahead! Your current contribution is ${spendingAnalysis.currencySymbol}${ahead.toFixed(0)}/mo more than needed.`
      } else if (surplus >= shortfall) {
        status = 'at-risk'
        recommendation = `Your spending data shows you have ${spendingAnalysis.currencySymbol}${surplus.toFixed(0)}/mo available. Consider increasing by ${spendingAnalysis.currencySymbol}${shortfall.toFixed(0)}/mo to stay on track.`
      } else {
        status = 'at-risk'
        const potentialIncrease = Math.min(shortfall, surplus)
        if (potentialIncrease > 0) {
          recommendation = `Based on spending patterns, you could increase by ${spendingAnalysis.currencySymbol}${potentialIncrease.toFixed(0)}/mo. Full requirement is ${spendingAnalysis.currencySymbol}${shortfall.toFixed(0)}/mo more.`
        } else {
          recommendation = `Review spending to free up ${spendingAnalysis.currencySymbol}${shortfall.toFixed(0)}/mo needed to reach this goal on time.`
        }
      }

      const optimizationOpportunities: Array<{ category: string; amount: number; potential: number }> = []
      spendingAnalysis.topSpendingCategories.forEach(cat => {
        const reduction = cat.amount * 0.15
        if (reduction > 10) {
          optimizationOpportunities.push({
            category: cat.category,
            amount: cat.amount,
            potential: reduction
          })
        }
      })

      return {
        goal,
        progress,
        remaining,
        monthsUntilTarget,
        requiredMonthly,
        currentContribution,
        shortfall,
        surplus,
        status,
        recommendation,
        optimizationOpportunities: optimizationOpportunities.slice(0, 3),
        affordability: surplus > 0 ? Math.min(100, (surplus / shortfall) * 100) : 0
      }
    })
  }, [goals, spendingAnalysis])

  const handleOptimizeGoal = (goalId: string, newContribution: number) => {
    if (onUpdateGoal) {
      onUpdateGoal(goalId, newContribution)
      toast.success('Goal updated!', {
        description: `Monthly contribution set to ${spendingAnalysis?.currencySymbol}${newContribution.toFixed(0)}`
      })
    }
  }

  if (!spendingAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={24} weight="duotone" />
            Goal Tracking from Bank Data
          </CardTitle>
          <CardDescription>
            Connect your spending patterns to goal progress
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Target size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" weight="duotone" />
          <p className="text-sm text-muted-foreground">
            Upload and process bank statements to see goal recommendations
          </p>
        </CardContent>
      </Card>
    )
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={24} weight="duotone" />
            Goal Tracking from Bank Data
          </CardTitle>
          <CardDescription>
            Connect your spending patterns to goal progress
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Target size={48} className="mx-auto mb-4 text-accent" weight="duotone" />
          <p className="text-sm font-medium mb-2">Ready to set financial goals!</p>
          <p className="text-sm text-muted-foreground mb-4">
            Your spending analysis shows {spendingAnalysis.currencySymbol}{spendingAnalysis.avgMonthlySavings.toFixed(0)}/mo available for savings
          </p>
          {onCreateGoal && (
            <Button onClick={onCreateGoal} className="gap-2">
              <Target size={16} weight="bold" />
              Create Your First Goal
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target size={24} weight="duotone" className="text-accent" />
          Goal Tracking from Bank Data
        </CardTitle>
        <CardDescription>
          Smart recommendations based on {spendingAnalysis.totalMonths} month{spendingAnalysis.totalMonths !== 1 ? 's' : ''} of spending data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Monthly Savings</p>
            <p className="text-2xl font-display font-bold text-primary">
              {spendingAnalysis.currencySymbol}{spendingAnalysis.avgMonthlySavings.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
            <p className="text-2xl font-display font-bold text-accent">
              {spendingAnalysis.savingsRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Active Goals</p>
            <p className="text-2xl font-display font-bold text-foreground">
              {goals.length}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {goalInsights.map(insight => (
            <div key={insight.goal.id} className="border-2 rounded-xl overflow-hidden">
              <div 
                className={`p-4 cursor-pointer transition-colors ${
                  insight.status === 'ahead' ? 'bg-success/5 border-b-2 border-success/20' :
                  insight.status === 'at-risk' ? 'bg-warning/5 border-b-2 border-warning/20' :
                  'bg-muted/20'
                }`}
                onClick={() => setExpandedGoalId(expandedGoalId === insight.goal.id ? null : insight.goal.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{insight.goal.name}</h3>
                      <Badge 
                        variant={insight.status === 'ahead' ? 'default' : insight.status === 'at-risk' ? 'destructive' : 'secondary'}
                        className="gap-1"
                      >
                        {insight.status === 'ahead' && <CheckCircle size={12} weight="fill" />}
                        {insight.status === 'at-risk' && <Warning size={12} weight="fill" />}
                        {insight.status === 'ahead' ? 'On Track' : insight.status === 'at-risk' ? 'Needs Attention' : 'Review'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Progress</p>
                        <p className="font-semibold">{insight.progress.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current/Month</p>
                        <p className="font-semibold">{spendingAnalysis.currencySymbol}{insight.currentContribution.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Required/Month</p>
                        <p className="font-semibold">{spendingAnalysis.currencySymbol}{insight.requiredMonthly.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Months Left</p>
                        <p className="font-semibold">{insight.monthsUntilTarget}</p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <Progress value={insight.progress} className="h-2" />
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedGoalId(expandedGoalId === insight.goal.id ? null : insight.goal.id)
                    }}
                  >
                    <ArrowRight 
                      size={20} 
                      className={`transition-transform ${expandedGoalId === insight.goal.id ? 'rotate-90' : ''}`}
                    />
                  </Button>
                </div>
              </div>

              {expandedGoalId === insight.goal.id && (
                <div className="p-4 space-y-4 bg-card">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <Lightbulb size={20} className="text-accent mt-0.5 flex-shrink-0" weight="duotone" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">Recommendation</p>
                      <p className="text-sm text-foreground">{insight.recommendation}</p>
                    </div>
                  </div>

                  {insight.shortfall > 0 && insight.optimizationOpportunities.length > 0 && (
                    <div className="space-y-3">
                      <p className="font-semibold text-sm flex items-center gap-2">
                        <TrendDown size={16} className="text-warning" />
                        Spending Optimization Opportunities
                      </p>
                      <div className="space-y-2">
                        {insight.optimizationOpportunities.map(opp => (
                          <div key={opp.category} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                              <p className="font-medium text-sm">{opp.category}</p>
                              <p className="text-xs text-muted-foreground">
                                Current: {spendingAnalysis.currencySymbol}{opp.amount.toFixed(0)}/mo
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-success">
                                Save {spendingAnalysis.currencySymbol}{opp.potential.toFixed(0)}/mo
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Reduce by 15%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {insight.optimizationOpportunities.length > 0 && (
                        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                          <p className="text-sm">
                            <span className="font-semibold">Total potential savings: </span>
                            {spendingAnalysis.currencySymbol}{insight.optimizationOpportunities.reduce((sum, o) => sum + o.potential, 0).toFixed(0)}/mo
                            {insight.optimizationOpportunities.reduce((sum, o) => sum + o.potential, 0) >= insight.shortfall && (
                              <span className="text-success ml-2">✓ Covers the {spendingAnalysis.currencySymbol}{insight.shortfall.toFixed(0)} shortfall</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {insight.status === 'at-risk' && insight.surplus > 0 && onUpdateGoal && (
                    <div className="pt-3 border-t">
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleOptimizeGoal(insight.goal.id, insight.requiredMonthly)}
                      >
                        <TrendUp size={16} weight="bold" />
                        Update to Recommended {spendingAnalysis.currencySymbol}{insight.requiredMonthly.toFixed(0)}/mo
                      </Button>
                    </div>
                  )}

                  {insight.status === 'ahead' && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                      <CheckCircle size={20} className="text-success mt-0.5 flex-shrink-0" weight="fill" />
                      <div>
                        <p className="font-semibold text-sm text-success mb-1">On Track!</p>
                        <p className="text-sm">
                          Your current pace will reach this goal on time. Keep up the great work!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
