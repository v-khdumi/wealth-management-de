import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  Sparkle,
  TrendUp,
  Target,
  Warning,
  CheckCircle,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BankStatement, Goal } from '@/lib/types'

interface BankStatementGoalIntegrationProps {
  userId: string
  statements: BankStatement[]
  goals: Goal[]
  onUpdateGoal: (goalId: string, newContribution: number) => void
}

interface SpendingInsight {
  category: string
  monthlyAverage: number
  potentialSavings: number
  recommendation: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export function BankStatementGoalIntegration({
  userId,
  statements,
  goals,
  onUpdateGoal,
}: BankStatementGoalIntegrationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInsights, setAiInsights] = useState<string>('')

  const completedStatements = useMemo(() =>
    statements.filter(s => s.status === 'COMPLETED' && s.extractedData),
    [statements]
  )

  const spendingInsights = useMemo((): SpendingInsight[] => {
    if (completedStatements.length === 0) return []

    const categoryAverages = new Map<string, number[]>()
    
    completedStatements.forEach(stmt => {
      stmt.extractedData?.categorySummary?.forEach(cat => {
        if (!categoryAverages.has(cat.category)) {
          categoryAverages.set(cat.category, [])
        }
        categoryAverages.get(cat.category)!.push(cat.amount)
      })
    })

    const insights: SpendingInsight[] = []

    const discretionaryCategories = [
      'Dining & Restaurants',
      'Entertainment',
      'Shopping',
      'Subscriptions',
      'Travel',
      'Coffee & Snacks'
    ]

    categoryAverages.forEach((amounts, category) => {
      const monthlyAverage = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
      
      if (discretionaryCategories.includes(category) && monthlyAverage > 100) {
        const potentialSavings = monthlyAverage * 0.2

        insights.push({
          category,
          monthlyAverage,
          potentialSavings,
          recommendation: `Reduce ${category} spending by 20% to free up $${potentialSavings.toFixed(0)}/month`,
          confidence: monthlyAverage > 500 ? 'HIGH' : monthlyAverage > 200 ? 'MEDIUM' : 'LOW'
        })
      }
    })

    return insights.sort((a, b) => b.potentialSavings - a.potentialSavings)
  }, [completedStatements])

  const totalPotentialSavings = useMemo(() => 
    spendingInsights.reduce((sum, insight) => sum + insight.potentialSavings, 0),
    [spendingInsights]
  )

  const goalsNeedingAttention = useMemo(() => 
    goals.filter(g => {
      const progress = (g.currentAmount / g.targetAmount) * 100
      return progress < 50 && new Date(g.targetDate) < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2)
    }),
    [goals]
  )

  const generateAIInsights = async () => {
    setIsGenerating(true)
    
    try {
      const totalIncome = completedStatements.reduce((sum, s) => 
        sum + (s.extractedData?.totalIncome || 0), 0) / completedStatements.length
      const totalExpenses = completedStatements.reduce((sum, s) => 
        sum + (s.extractedData?.totalExpenses || 0), 0) / completedStatements.length

      const promptText = `You are a financial advisor analyzing spending patterns and goals.

User's Financial Data:
- Average Monthly Income: $${totalIncome.toFixed(0)}
- Average Monthly Expenses: $${totalExpenses.toFixed(0)}
- Potential Savings from Spending Optimization: $${totalPotentialSavings.toFixed(0)}/month

Spending Insights:
${spendingInsights.map(i => `- ${i.category}: $${i.monthlyAverage.toFixed(0)}/month (can save $${i.potentialSavings.toFixed(0)})`).join('\n')}

Goals Needing Attention:
${goalsNeedingAttention.map(g => `- ${g.name}: $${g.currentAmount.toLocaleString()} of $${g.targetAmount.toLocaleString()} (${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}% complete, target: ${new Date(g.targetDate).toLocaleDateString()})`).join('\n')}

Provide 3-5 specific, actionable recommendations on how this user can optimize their spending to better fund their goals. Be encouraging but realistic. Focus on the highest-impact changes.`

      const response = await window.spark.llm(promptText, 'gpt-4o-mini')
      setAiInsights(response)
      
      toast.success('AI insights generated', {
        description: 'Review recommendations below'
      })
    } catch (error) {
      toast.error('Failed to generate insights', {
        description: 'Please try again'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyRecommendation = (goalId: string, additionalAmount: number) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    onUpdateGoal(goalId, goal.monthlyContribution + additionalAmount)
    
    toast.success('Goal updated', {
      description: `Monthly contribution increased by $${additionalAmount.toLocaleString()}`
    })
  }

  if (completedStatements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle size={24} className="text-accent" />
            Spending-to-Goals Integration
          </CardTitle>
          <CardDescription>Get AI-powered recommendations based on your spending patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No bank statements uploaded</p>
            <p className="text-sm mt-1">Upload statements to get personalized goal recommendations</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkle size={24} className="text-accent" />
              Spending-to-Goals Integration
            </CardTitle>
            <CardDescription>
              AI-powered insights from {completedStatements.length} statement{completedStatements.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button
            onClick={generateAIInsights}
            disabled={isGenerating}
            className="gap-2"
          >
            <Sparkle size={16} />
            {isGenerating ? 'Generating...' : 'Generate AI Insights'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {spendingInsights.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Spending Optimization Opportunities</h4>
                <Badge variant="secondary" className="gap-1">
                  <TrendUp size={14} />
                  ${totalPotentialSavings.toFixed(0)}/mo potential
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {spendingInsights.slice(0, 5).map((insight, index) => (
                  <Card key={index} className="border-l-4 border-l-accent">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{insight.category}</span>
                            <Badge variant={
                              insight.confidence === 'HIGH' ? 'default' :
                              insight.confidence === 'MEDIUM' ? 'secondary' :
                              'outline'
                            } className="text-xs">
                              {insight.confidence}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Currently: ${insight.monthlyAverage.toFixed(0)}/month
                          </p>
                          <p className="text-sm">{insight.recommendation}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-success">
                            +${insight.potentialSavings.toFixed(0)}
                          </p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {goalsNeedingAttention.length > 0 && spendingInsights.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Target size={18} />
                Recommended Goal Adjustments
              </h4>
              
              <div className="grid gap-3">
                {goalsNeedingAttention.map(goal => {
                  const suggestedIncrease = Math.min(totalPotentialSavings / goalsNeedingAttention.length, totalPotentialSavings)
                  const newContribution = goal.monthlyContribution + suggestedIncrease

                  return (
                    <Card key={goal.id} className="border-primary/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium mb-1">{goal.name}</p>
                            <p className="text-sm text-muted-foreground mb-2">
                              Currently contributing ${goal.monthlyContribution.toLocaleString()}/month
                            </p>
                            <p className="text-sm">
                              Increase to <span className="font-semibold">${newContribution.toFixed(0)}/month</span> using optimized spending
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleApplyRecommendation(goal.id, suggestedIncrease)}
                            className="gap-2"
                          >
                            <CheckCircle size={16} />
                            Apply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {aiInsights && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Sparkle size={18} className="text-accent" />
                AI-Powered Recommendations
              </h4>
              <Card className="bg-accent/5 border-accent/30">
                <CardContent className="pt-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{aiInsights}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {spendingInsights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle size={48} className="mx-auto mb-3 opacity-50 text-success" />
              <p className="font-medium">Great spending habits!</p>
              <p className="text-sm mt-1">No immediate optimization opportunities found in your current spending</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
