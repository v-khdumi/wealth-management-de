import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Progress } from './ui/progress'
import { 
  GitBranch, 
  Link as LinkIcon,
  LockKey, 
  Lightbulb, 
  ArrowRight,
  Plus,
  Trash,
  Target,
  Warning,
  CheckCircle,
} from '@phosphor-icons/react'
import type { Goal, GoalDependency } from '@/lib/types'
import { toast } from 'sonner'

interface GoalDependenciesProps {
  goal: Goal
  allGoals: Goal[]
  onUpdateGoal: (updates: Partial<Goal>) => void
}

export function GoalDependencies({ goal, allGoals, onUpdateGoal }: GoalDependenciesProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [relationshipType, setRelationshipType] = useState<'BLOCKS' | 'ENABLES' | 'RELATED'>('RELATED')
  const [description, setDescription] = useState('')

  const availableGoals = useMemo(() => {
    const existingDependencyIds = new Set(goal.dependencies?.map(d => d.dependsOnGoalId) || [])
    return allGoals.filter(g => g.id !== goal.id && !existingDependencyIds.has(g.id))
  }, [allGoals, goal])

  const dependencyGoalsMap = useMemo(() => {
    const map = new Map<string, Goal>()
    allGoals.forEach(g => map.set(g.id, g))
    return map
  }, [allGoals])

  const handleAddDependency = () => {
    if (!selectedGoalId) {
      toast.error('Please select a goal')
      return
    }

    const newDependency: GoalDependency = {
      id: `dep_${Date.now()}`,
      goalId: goal.id,
      dependsOnGoalId: selectedGoalId,
      relationshipType,
      description: description || getDefaultDescription(relationshipType, dependencyGoalsMap.get(selectedGoalId)?.name || ''),
    }

    const updatedDependencies = [...(goal.dependencies || []), newDependency]
    onUpdateGoal({ dependencies: updatedDependencies })

    toast.success('Dependency Added', {
      description: `Linked to ${dependencyGoalsMap.get(selectedGoalId)?.name}`,
    })

    setSelectedGoalId('')
    setRelationshipType('RELATED')
    setDescription('')
    setShowAddDialog(false)
  }

  const handleRemoveDependency = (dependencyId: string) => {
    const updatedDependencies = (goal.dependencies || []).filter(d => d.id !== dependencyId)
    onUpdateGoal({ dependencies: updatedDependencies })
    toast.success('Dependency removed')
  }

  const getDefaultDescription = (type: string, relatedGoalName: string): string => {
    switch (type) {
      case 'BLOCKS':
        return `Must complete ${relatedGoalName} first to maintain financial stability`
      case 'ENABLES':
        return `Success with ${relatedGoalName} will accelerate progress on this goal`
      case 'RELATED':
        return `Coordinating with ${relatedGoalName} for better financial planning`
      default:
        return ''
    }
  }

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'BLOCKS':
        return <LockKey className="text-destructive" size={20} />
      case 'ENABLES':
        return <Lightbulb className="text-success" size={20} />
      case 'RELATED':
        return <LinkIcon className="text-accent" size={20} />
      default:
        return <LinkIcon className="text-accent" size={20} />
    }
  }

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'BLOCKS':
        return 'destructive'
      case 'ENABLES':
        return 'default'
      case 'RELATED':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const insights = useMemo(() => {
    const results: Array<{ type: 'warning' | 'info' | 'success'; text: string }> = []
    
    if (!goal.dependencies || goal.dependencies.length === 0) {
      return results
    }

    const blockedBy = goal.dependencies.filter(d => d.relationshipType === 'BLOCKS')
    const blockedByIncomplete = blockedBy.filter(d => {
      const depGoal = dependencyGoalsMap.get(d.dependsOnGoalId)
      return depGoal && (depGoal.currentAmount / depGoal.targetAmount) < 1
    })

    if (blockedByIncomplete.length > 0) {
      const depGoal = dependencyGoalsMap.get(blockedByIncomplete[0].dependsOnGoalId)
      results.push({
        type: 'warning',
        text: `Blocked: Complete "${depGoal?.name}" first to maintain financial stability`,
      })
    }

    const enabledBy = goal.dependencies.filter(d => d.relationshipType === 'ENABLES')
    const enabledByComplete = enabledBy.filter(d => {
      const depGoal = dependencyGoalsMap.get(d.dependsOnGoalId)
      return depGoal && (depGoal.currentAmount / depGoal.targetAmount) >= 1
    })

    if (enabledByComplete.length > 0) {
      const depGoal = dependencyGoalsMap.get(enabledByComplete[0].dependsOnGoalId)
      results.push({
        type: 'success',
        text: `Unlocked: "${depGoal?.name}" is complete! You can now accelerate this goal`,
      })
    }

    const relatedGoals = goal.dependencies.filter(d => d.relationshipType === 'RELATED')
    if (relatedGoals.length >= 2) {
      results.push({
        type: 'info',
        text: `Part of a larger financial plan with ${relatedGoals.length} related goals`,
      })
    }

    return results
  }, [goal.dependencies, dependencyGoalsMap])

  const dependenciesCount = goal.dependencies?.length || 0
  const blockedCount = useMemo(() => {
    if (!goal.dependencies) return 0
    return goal.dependencies.filter(d => {
      if (d.relationshipType !== 'BLOCKS') return false
      const depGoal = dependencyGoalsMap.get(d.dependsOnGoalId)
      return depGoal && (depGoal.currentAmount / depGoal.targetAmount) < 1
    }).length
  }, [goal.dependencies, dependencyGoalsMap])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="text-accent" />
            Goal Dependencies
          </CardTitle>
          <CardDescription>
            Track related financial milestones and goal relationships
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length > 0 && (
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    insight.type === 'warning'
                      ? 'bg-destructive/5 border-destructive/20'
                      : insight.type === 'success'
                      ? 'bg-success/5 border-success/20'
                      : 'bg-accent/5 border-accent/20'
                  }`}
                >
                  {insight.type === 'warning' ? (
                    <Warning className="text-destructive mt-0.5 shrink-0" size={20} />
                  ) : insight.type === 'success' ? (
                    <CheckCircle className="text-success mt-0.5 shrink-0" size={20} />
                  ) : (
                    <Lightbulb className="text-accent mt-0.5 shrink-0" size={20} />
                  )}
                  <p className="text-sm text-foreground">{insight.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-display font-bold text-foreground">{dependenciesCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Dependencies</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-display font-bold text-destructive">{blockedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Active Blocks</p>
            </div>
          </div>

          <Button 
            onClick={() => setShowAddDialog(true)} 
            className="w-full gap-2"
            variant="outline"
            disabled={availableGoals.length === 0}
          >
            <Plus />
            Add Dependency
          </Button>

          {dependenciesCount > 0 ? (
            <div className="space-y-3 mt-6">
              <h4 className="text-sm font-semibold text-foreground">Linked Goals</h4>
              <div className="space-y-3">
                {goal.dependencies?.map((dep) => {
                  const relatedGoal = dependencyGoalsMap.get(dep.dependsOnGoalId)
                  if (!relatedGoal) return null

                  const progress = (relatedGoal.currentAmount / relatedGoal.targetAmount) * 100
                  const isComplete = progress >= 100
                  const isBlocking = dep.relationshipType === 'BLOCKS' && !isComplete

                  return (
                    <div
                      key={dep.id}
                      className={`p-4 rounded-lg border ${
                        isBlocking
                          ? 'bg-destructive/5 border-destructive/20'
                          : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          {getRelationshipIcon(dep.relationshipType)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm text-foreground">
                                {relatedGoal.name}
                              </p>
                              <Badge variant={getRelationshipColor(dep.relationshipType) as any} className="text-xs">
                                {dep.relationshipType}
                              </Badge>
                              {isComplete && (
                                <CheckCircle className="text-success" size={16} weight="fill" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {dep.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDependency(dep.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{relatedGoal.currentAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
                          <span>{relatedGoal.targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No dependencies yet</p>
              <p className="text-xs mt-1">Link related goals to track dependencies and relationships</p>
            </div>
          )}

          {availableGoals.length === 0 && dependenciesCount === 0 && (
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="text-xs text-muted-foreground text-center">
                Create more goals to start linking them together
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Goal Dependency</DialogTitle>
            <DialogDescription>
              Link this goal to another milestone to track relationships
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="relatedGoal">Related Goal</Label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger id="relatedGoal">
                  <SelectValue placeholder="Select a goal..." />
                </SelectTrigger>
                <SelectContent>
                  {availableGoals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <div className="flex items-center gap-2">
                        <Target size={14} />
                        {g.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship Type</Label>
              <Select 
                value={relationshipType} 
                onValueChange={(v) => setRelationshipType(v as any)}
              >
                <SelectTrigger id="relationship">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BLOCKS">
                    <div className="flex items-center gap-2">
                      <LockKey size={14} className="text-destructive" />
                      <div>
                        <p className="font-medium">Blocks</p>
                        <p className="text-xs text-muted-foreground">Must complete first</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ENABLES">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={14} className="text-success" />
                      <div>
                        <p className="font-medium">Enables</p>
                        <p className="text-xs text-muted-foreground">Helps accelerate progress</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="RELATED">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={14} className="text-accent" />
                      <div>
                        <p className="font-medium">Related</p>
                        <p className="text-xs text-muted-foreground">Part of same plan</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder={selectedGoalId ? getDefaultDescription(relationshipType, dependencyGoalsMap.get(selectedGoalId)?.name || '') : 'Describe the relationship...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {selectedGoalId && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{goal.name}</span>
                  <ArrowRight size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{relationshipType.toLowerCase()}</span>
                  <ArrowRight size={14} className="text-muted-foreground" />
                  <span className="font-medium">{dependencyGoalsMap.get(selectedGoalId)?.name}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDependency} disabled={!selectedGoalId}>
              Add Dependency
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
