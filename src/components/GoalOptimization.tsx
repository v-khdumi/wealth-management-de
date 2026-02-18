import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Sparkle,
  TrendUp,
  Check,
  X,
  Info,
  ArrowRight,
  Lightning,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { GoalOptimization as GoalOptimizationType, Goal } from '@/lib/types'

interface GoalOptimizationProps {
  goal: Goal
  onAcceptOptimization: (optimizationId: string) => void
  onRejectOptimization: (optimizationId: string) => void
  onGenerateOptimizations?: (goalId: string) => void
}

export function GoalOptimization({ 
  goal, 
  onAcceptOptimization, 
  onRejectOptimization,
  onGenerateOptimizations 
}: GoalOptimizationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  
  const activeOptimizations = (goal.optimizations || []).filter(
    opt => !opt.acceptedAt && !opt.rejectedAt
  )
  const acceptedOptimizations = (goal.optimizations || []).filter(opt => opt.acceptedAt)

  const handleGenerate = async () => {
    if (!onGenerateOptimizations) return
    
    setIsGenerating(true)
    try {
      await onGenerateOptimizations(goal.id)
      toast.success('AI optimizations generated', {
        description: 'Review the personalized recommendations below'
      })
    } catch (error) {
      toast.error('Failed to generate optimizations')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAccept = (optimizationId: string) => {
    onAcceptOptimization(optimizationId)
    toast.success('Optimization accepted', {
      description: 'Your goal has been updated with the new strategy'
    })
  }

  const handleReject = (optimizationId: string) => {
    onRejectOptimization(optimizationId)
    toast.info('Optimization dismissed')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-destructive/10 text-destructive border-destructive/30'
      case 'MEDIUM':
        return 'bg-warning/10 text-warning-foreground border-warning/30'
      case 'LOW':
        return 'bg-muted text-muted-foreground border-muted'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CONTRIBUTION_INCREASE':
        return <TrendUp size={16} weight="duotone" />
      case 'REALLOCATION':
        return <ArrowRight size={16} weight="duotone" />
      case 'RISK_ALIGNMENT':
        return <Lightning size={16} weight="duotone" />
      default:
        return <Sparkle size={16} weight="duotone" />
    }
  }

  if (!goal.optimizations || goal.optimizations.length === 0) {
    return (
      <Card className="ai-glow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-primary">
                <Sparkle size={20} weight="duotone" className="text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Goal Optimization</CardTitle>
                <CardDescription>
                  Get personalized recommendations to reach this goal faster
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Sparkle size={32} weight="duotone" className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              No optimizations yet. Generate AI-powered recommendations to improve your strategy.
            </p>
            {onGenerateOptimizations && (
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="gap-2"
              >
                <Sparkle size={16} weight="fill" />
                {isGenerating ? 'Analyzing...' : 'Generate Optimizations'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="ai-glow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-primary">
              <Sparkle size={20} weight="duotone" className="text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Goal Optimization</CardTitle>
              <CardDescription>
                {activeOptimizations.length} active recommendation{activeOptimizations.length !== 1 ? 's' : ''}
                {acceptedOptimizations.length > 0 && ` • ${acceptedOptimizations.length} applied`}
              </CardDescription>
            </div>
          </div>
          {onGenerateOptimizations && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <Sparkle size={14} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeOptimizations.length > 0 && (
          <div className="space-y-3">
            {activeOptimizations.map((optimization) => (
              <div
                key={optimization.id}
                className="p-4 rounded-lg border bg-card space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getTypeIcon(optimization.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{optimization.title}</h4>
                        <Badge variant="outline" className={getPriorityColor(optimization.priority)}>
                          {optimization.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {optimization.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Current:</span>
                          <span className="font-semibold">
                            ${optimization.currentMonthly.toLocaleString()}/mo
                          </span>
                        </div>
                        <ArrowRight size={12} className="text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Suggested:</span>
                          <span className="font-semibold text-primary">
                            ${optimization.suggestedMonthly.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>
                      {optimization.potentialGain > 0 && (
                        <div className="mt-2 flex items-center gap-2 p-2 rounded bg-success/10 text-success text-xs">
                          <TrendUp size={14} weight="fill" />
                          <span>
                            Potential gain: ${optimization.potentialGain.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {optimization.reasoning}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(optimization.id)}
                    className="gap-2"
                  >
                    <X size={14} />
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(optimization.id)}
                    className="gap-2"
                  >
                    <Check size={14} />
                    Apply Recommendation
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {acceptedOptimizations.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Check size={16} className="text-success" />
              Applied Optimizations ({acceptedOptimizations.length})
            </h4>
            <div className="space-y-2">
              {acceptedOptimizations.map((optimization) => (
                <div
                  key={optimization.id}
                  className="p-3 rounded-lg bg-success/5 border border-success/20 text-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-success mb-1">{optimization.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Applied on {new Date(optimization.acceptedAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
