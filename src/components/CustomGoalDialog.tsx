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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Target,
  Calendar,
  CurrencyDollar,
  TrendUp,
  ArrowRight,
  Sparkle,
} from '@phosphor-icons/react'
import type { GoalType } from '@/lib/types'

interface CustomGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateGoal: (goalData: {
    name: string
    type: GoalType
    targetAmount: number
    targetYears: number
  }) => void
}

export function CustomGoalDialog({ open, onOpenChange, onCreateGoal }: CustomGoalDialogProps) {
  const [goalName, setGoalName] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('OTHER')
  const [targetAmount, setTargetAmount] = useState(50000)
  const [targetYears, setTargetYears] = useState(5)

  const monthlyContribution = useMemo(() => {
    if (targetYears === 0) return 0
    return Math.ceil(targetAmount / (targetYears * 12))
  }, [targetAmount, targetYears])

  const handleCreate = () => {
    if (!goalName.trim()) {
      return
    }

    onCreateGoal({
      name: goalName,
      type: goalType,
      targetAmount,
      targetYears,
    })

    setGoalName('')
    setGoalType('OTHER')
    setTargetAmount(50000)
    setTargetYears(5)
    onOpenChange(false)
  }

  const goalTypeIcons: Record<GoalType, string> = {
    RETIREMENT: '🏖️',
    HOUSE: '🏡',
    EDUCATION: '🎓',
    OTHER: '✨',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkle size={28} weight="duotone" className="text-primary" />
            Create Custom Goal
          </DialogTitle>
          <DialogDescription>
            Design a personalized financial goal tailored to your unique dreams
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name" className="text-base font-semibold">
              Goal Name
            </Label>
            <Input
              id="goal-name"
              placeholder="e.g., Build a recording studio, Launch an app, Travel Asia..."
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-type" className="text-base font-semibold">
              Goal Category
            </Label>
            <Select value={goalType} onValueChange={(value) => setGoalType(value as GoalType)}>
              <SelectTrigger id="goal-type" className="text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RETIREMENT">
                  <div className="flex items-center gap-2">
                    <span>🏖️</span>
                    <span>Retirement</span>
                  </div>
                </SelectItem>
                <SelectItem value="HOUSE">
                  <div className="flex items-center gap-2">
                    <span>🏡</span>
                    <span>Home & Property</span>
                  </div>
                </SelectItem>
                <SelectItem value="EDUCATION">
                  <div className="flex items-center gap-2">
                    <span>🎓</span>
                    <span>Education</span>
                  </div>
                </SelectItem>
                <SelectItem value="OTHER">
                  <div className="flex items-center gap-2">
                    <span>✨</span>
                    <span>Other</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label htmlFor="target-amount" className="text-base font-semibold mb-3 block">
                Target Amount
              </Label>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-display font-bold text-primary wealth-number">
                  ${targetAmount.toLocaleString()}
                </span>
              </div>
              <Slider
                id="target-amount"
                min={1000}
                max={2000000}
                step={targetAmount > 100000 ? 10000 : 5000}
                value={[targetAmount]}
                onValueChange={(values) => setTargetAmount(values[0])}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                <span>$1,000</span>
                <span>$2,000,000</span>
              </div>
            </div>

            <div>
              <Label htmlFor="target-years" className="text-base font-semibold mb-3 block">
                Time Horizon
              </Label>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-display font-bold text-secondary wealth-number">
                  {targetYears}
                </span>
                <span className="text-2xl text-muted-foreground">years</span>
              </div>
              <Slider
                id="target-years"
                min={1}
                max={40}
                step={1}
                value={[targetYears]}
                onValueChange={(values) => setTargetYears(values[0])}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                <span>1 year</span>
                <span>40 years</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="p-6 border-2 border-primary/30 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={18} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Target Date</p>
                </div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {new Date(Date.now() + targetYears * 365.25 * 24 * 60 * 60 * 1000).getFullYear()}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendUp size={18} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Monthly Contribution</p>
                </div>
                <p className="text-2xl font-display font-bold text-primary wealth-number">
                  ${monthlyContribution.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              This is a simplified calculation. Actual returns will vary based on market performance.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            className="gap-2"
            disabled={!goalName.trim()}
          >
            Create Goal
            <ArrowRight size={16} weight="bold" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
