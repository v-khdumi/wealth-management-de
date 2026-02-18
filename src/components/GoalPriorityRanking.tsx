import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  ArrowUp,
  ArrowDown,
  ArrowsDownUp,
  Sparkle,
  Target,
  Info,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Goal } from '@/lib/types'

interface GoalPriorityRankingProps {
  goals: Goal[]
  onUpdatePriority: (goalId: string, newRank: number) => void
  onAutoRank?: () => void
}

export function GoalPriorityRanking({ goals, onUpdatePriority, onAutoRank }: GoalPriorityRankingProps) {
  const [isAutoRanking, setIsAutoRanking] = useState(false)

  const sortedGoals = [...goals].sort((a, b) => {
    const rankA = a.priority?.rank ?? 999
    const rankB = b.priority?.rank ?? 999
    return rankA - rankB
  })

  const handleMoveUp = (goalId: string, currentRank: number) => {
    if (currentRank <= 1) return
    onUpdatePriority(goalId, currentRank - 1)
    toast.success('Goal priority updated')
  }

  const handleMoveDown = (goalId: string, currentRank: number, maxRank: number) => {
    if (currentRank >= maxRank) return
    onUpdatePriority(goalId, currentRank + 1)
    toast.success('Goal priority updated')
  }

  const handleAutoRank = async () => {
    if (!onAutoRank) return
    
    setIsAutoRanking(true)
    try {
      await onAutoRank()
      toast.success('Goals auto-ranked by AI', {
        description: 'Priorities set based on urgency, progress, and timeline'
      })
    } catch (error) {
      toast.error('Failed to auto-rank goals')
    } finally {
      setIsAutoRanking(false)
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-destructive/10 text-destructive border-destructive/30'
    if (rank <= 3) return 'bg-warning/10 text-warning-foreground border-warning/30'
    return 'bg-muted text-muted-foreground border-muted'
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No goals to prioritize. Create some goals first!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Goal Priority Ranking</h3>
          <p className="text-sm text-muted-foreground">
            Organize your goals by importance to focus your efforts
          </p>
        </div>
        {onAutoRank && (
          <Button
            variant="outline"
            onClick={handleAutoRank}
            disabled={isAutoRanking}
            className="gap-2"
          >
            <Sparkle size={16} weight="fill" />
            {isAutoRanking ? 'Ranking...' : 'AI Auto-Rank'}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sortedGoals.map((goal, index) => {
          const rank = goal.priority?.rank ?? index + 1
          const isAutoRanked = goal.priority?.autoRanked ?? false
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
          
          return (
            <div
              key={goal.id}
              className="p-4 rounded-lg border bg-card flex items-center gap-4"
            >
              <div className="flex flex-col gap-2">
                <Badge variant="outline" className={getRankBadgeColor(rank)}>
                  #{rank}
                </Badge>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(goal.id, rank)}
                    disabled={rank <= 1}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowUp size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(goal.id, rank, goals.length)}
                    disabled={rank >= goals.length}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowDown size={12} />
                  </Button>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={16} weight="duotone" className="text-primary" />
                  <h4 className="font-semibold">{goal.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {goal.type}
                  </Badge>
                  {isAutoRanked && (
                    <Badge variant="outline" className="text-xs gap-1 bg-accent/10 text-accent border-accent/30">
                      <Sparkle size={10} weight="fill" />
                      AI Ranked
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span>${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</span>
                  <span>•</span>
                  <span>{progress.toFixed(0)}% complete</span>
                  <span>•</span>
                  <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                </div>

                {goal.priority?.reasoning && (
                  <div className="flex items-start gap-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                    <Info size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{goal.priority.reasoning}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
