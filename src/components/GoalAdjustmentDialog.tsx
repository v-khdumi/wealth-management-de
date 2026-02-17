import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Target,
  TrendUp,
  Calendar,
  CurrencyDollar,
  CheckCircle,
  Warning,
  Sparkle,
  ArrowRight,
} from '@phosphor-icons/react'
import type { Goal } from '@/lib/types'
import { calculateGoalGap, calculateRequiredMonthlyContribution } from '@/lib/business-logic'
import { toast } from 'sonner'

interface GoalAdjustmentDialogProps {
  goal: Goal
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (goalId: string, newContribution: number) => void
}

export function GoalAdjustmentDialog({
  goal,
  open,
  onOpenChange,
  onSave,
}: GoalAdjustmentDialogProps) {
  const gap = useMemo(() => calculateGoalGap(goal), [goal])
  const requiredMonthly = useMemo(() => calculateRequiredMonthlyContribution(goal), [goal])
  
  const [newContribution, setNewContribution] = useState(goal.monthlyContribution)
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false)

  const monthsRemaining = useMemo(() => {
    const targetDate = new Date(goal.targetDate)
    return Math.max(1, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
  }, [goal.targetDate])

  const projectedTotal = useMemo(() => {
    return goal.currentAmount + (newContribution * monthsRemaining)
  }, [goal.currentAmount, newContribution, monthsRemaining])

  const projectedGap = useMemo(() => {
    return Math.max(0, goal.targetAmount - projectedTotal)
  }, [goal.targetAmount, projectedTotal])

  const projectedProgress = useMemo(() => {
    return Math.min(100, (projectedTotal / goal.targetAmount) * 100)
  }, [projectedTotal, goal.targetAmount])

  const shortfall = requiredMonthly - newContribution

  const minContribution = 0
  const maxContribution = Math.max(requiredMonthly * 2, goal.monthlyContribution * 3, 5000)

  const getStatusColor = () => {
    if (shortfall <= 0) return 'text-success'
    if (shortfall <= 200) return 'text-warning'
    return 'text-destructive'
  }

  const getStatusBadge = () => {
    if (shortfall <= 0) {
      return <Badge className="bg-success text-success-foreground gap-1">
        <CheckCircle size={14} weight="fill" />
        On Track
      </Badge>
    }
    if (shortfall <= 200) {
      return <Badge variant="secondary" className="gap-1">
        <Warning size={14} weight="fill" />
        Minor Adjustment
      </Badge>
    }
    return <Badge variant="destructive" className="gap-1">
      <Warning size={14} weight="fill" />
      Needs Attention
    </Badge>
  }

  const handleSave = () => {
    onSave(goal.id, newContribution)
    toast.success('Goal Updated', {
      description: `Monthly contribution set to $${newContribution.toLocaleString()}`,
    })
    onOpenChange(false)
  }

  const handleSetToRecommended = () => {
    setNewContribution(Math.ceil(requiredMonthly))
    toast.info('Set to Recommended', {
      description: 'Adjusted to meet your target date',
    })
  }

  const handleAIOptimize = async () => {
    setIsAIAnalyzing(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const optimized = Math.ceil(requiredMonthly * 1.05)
    setNewContribution(optimized)
    
    toast.success('AI Optimization Complete', {
      description: `Suggested $${optimized.toLocaleString()}/month with 5% buffer`,
    })
    
    setIsAIAnalyzing(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Target size={28} weight="duotone" className="text-primary" />
            Adjust Monthly Contribution
          </DialogTitle>
          <DialogDescription>
            Fine-tune your savings to reach your goal: <strong>{goal.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Target size={18} className="text-primary" />
                <p className="text-sm text-muted-foreground">Target Amount</p>
              </div>
              <p className="text-2xl font-display font-bold text-primary wealth-number">
                ${goal.targetAmount.toLocaleString()}
              </p>
            </div>

            <div className="p-4 border-2 border-accent/20 rounded-lg bg-accent/5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-accent" />
                <p className="text-sm text-muted-foreground">Time Remaining</p>
              </div>
              <p className="text-2xl font-display font-bold text-accent wealth-number">
                {monthsRemaining} months
              </p>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl space-y-4 border-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CurrencyDollar size={20} weight="duotone" className="text-foreground" />
                <p className="font-semibold">Current Savings</p>
              </div>
              <p className="text-xl font-bold wealth-number">
                ${goal.currentAmount.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendUp size={20} weight="duotone" className={shortfall <= 0 ? 'text-success' : 'text-warning'} />
                <p className="font-semibold">Required Monthly</p>
              </div>
              <p className="text-xl font-bold wealth-number">
                ${Math.ceil(requiredMonthly).toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="contribution-slider" className="text-base font-semibold">
                New Monthly Contribution
              </Label>
              {getStatusBadge()}
            </div>

            <div className="space-y-6">
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-display font-bold text-primary wealth-number">
                  ${newContribution.toLocaleString()}
                </p>
                <p className="text-xl text-muted-foreground">/month</p>
              </div>

              <Slider
                id="contribution-slider"
                min={minContribution}
                max={maxContribution}
                step={50}
                value={[newContribution]}
                onValueChange={(values) => setNewContribution(values[0])}
                className="w-full"
              />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>${minContribution.toLocaleString()}</span>
                <span>${maxContribution.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetToRecommended}
                className="gap-2"
              >
                <Target size={16} />
                Set to Recommended
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAIOptimize}
                disabled={isAIAnalyzing}
                className="gap-2 ai-glow"
              >
                {isAIAnalyzing ? (
                  <>
                    <Sparkle size={16} weight="fill" className="animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkle size={16} weight="duotone" />
                    AI Optimize
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="font-semibold text-base">Projection with New Contribution</p>
            
            <div className="p-5 border-2 border-primary/30 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Projected Progress</span>
                  <span className={`font-bold text-xl wealth-number ${getStatusColor()}`}>
                    {projectedProgress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={projectedProgress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Projected Total</p>
                  <p className="text-xl font-bold wealth-number text-primary">
                    ${projectedTotal.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Remaining Gap</p>
                  <p className={`text-xl font-bold wealth-number ${projectedGap === 0 ? 'text-success' : 'text-warning'}`}>
                    ${projectedGap.toLocaleString()}
                  </p>
                </div>
              </div>

              {projectedGap === 0 && (
                <div className="bg-success/10 border border-success/30 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle size={20} weight="fill" className="text-success mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-success text-sm">Perfect! You'll reach your goal</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      With this contribution, you'll meet your target by {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {projectedGap > 0 && shortfall <= 200 && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                  <Warning size={20} weight="fill" className="text-warning mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-warning text-sm">Close, but needs adjustment</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll be ${projectedGap.toLocaleString()} short. Consider increasing by $
                      {Math.ceil(shortfall).toLocaleString()}/month.
                    </p>
                  </div>
                </div>
              )}

              {shortfall > 200 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
                  <Warning size={20} weight="fill" className="text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-destructive text-sm">Needs significant adjustment</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Increase by ${Math.ceil(shortfall).toLocaleString()}/month to reach your goal on time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            Save Changes
            <ArrowRight size={16} weight="bold" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
