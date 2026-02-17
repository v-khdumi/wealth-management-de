import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  X,
  Target,
  ChartLine,
  ShareNetwork,
  GitBranch,
  CalendarBlank,
  CurrencyDollar,
} from '@phosphor-icons/react'
import { GoalAnalytics } from './GoalAnalytics'
import { GoalSharing } from './GoalSharing'
import { GoalDependencies } from './GoalDependencies'
import type { Goal } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface GoalDetailViewProps {
  goal: Goal | null
  allGoals: Goal[]
  isOpen: boolean
  onClose: () => void
  onUpdateGoal: (goalId: string, updates: Partial<Goal>) => void
}

export function GoalDetailView({ goal, allGoals, isOpen, onClose, onUpdateGoal }: GoalDetailViewProps) {
  const [activeTab, setActiveTab] = useState('analytics')

  if (!goal) return null

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount)
  const achievedMilestones = (goal.milestones || []).filter(m => m.achievedAt).length
  const totalMilestones = goal.milestones?.length || 0
  const hasProgressData = goal.progressHistory && goal.progressHistory.length >= 2
  const sharedCount = goal.sharedWith?.length || 0
  const dependenciesCount = goal.dependencies?.length || 0
  const unreadFeedback = goal.sharedWith?.filter(f => f.message && !f.readAt).length || 0

  const handleUpdate = (updates: Partial<Goal>) => {
    onUpdateGoal(goal.id, updates)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-display mb-2">
                {goal.name}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{goal.type}</Badge>
                {goal.isCustom && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    Custom Goal
                  </Badge>
                )}
                {achievedMilestones > 0 && (
                  <Badge variant="outline" className="gap-1 bg-accent/10 text-accent border-accent/30">
                    <Target size={12} weight="fill" />
                    {achievedMilestones}/{totalMilestones} milestones
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className="text-xl font-display font-bold text-primary">
                ${goal.currentAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Target</p>
              <p className="text-xl font-display font-bold text-foreground">
                ${goal.targetAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Monthly</p>
              <p className="text-xl font-display font-bold text-foreground">
                ${goal.monthlyContribution.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <CalendarBlank size={12} />
                Target Date
              </p>
              <p className="text-lg font-semibold text-foreground">
                {format(parseISO(goal.targetDate), 'MMM yyyy')}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall Progress</span>
              <span className="font-bold text-primary">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>${goal.currentAmount.toLocaleString()} saved</span>
              <span>${remainingAmount.toLocaleString()} remaining</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analytics" className="gap-2">
                <ChartLine size={16} />
                Analytics
                {hasProgressData && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                    {goal.progressHistory?.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sharing" className="gap-2">
                <ShareNetwork size={16} />
                Sharing
                {unreadFeedback > 0 && (
                  <Badge variant="default" className="ml-1 text-xs h-5 px-1.5">
                    {unreadFeedback}
                  </Badge>
                )}
                {sharedCount > 0 && unreadFeedback === 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                    {sharedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="gap-2">
                <GitBranch size={16} />
                Dependencies
                {dependenciesCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                    {dependenciesCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="mt-6">
              <GoalAnalytics goal={goal} />
            </TabsContent>

            <TabsContent value="sharing" className="mt-6">
              <GoalSharing goal={goal} onUpdateGoal={handleUpdate} />
            </TabsContent>

            <TabsContent value="dependencies" className="mt-6">
              <GoalDependencies 
                goal={goal} 
                allGoals={allGoals.filter(g => g.id !== goal.id)} 
                onUpdateGoal={handleUpdate} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
