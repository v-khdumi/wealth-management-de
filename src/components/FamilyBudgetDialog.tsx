import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Users,
  Plus,
  UserPlus,
  CurrencyDollar,
  Trash,
  Check,
  Warning,
  TrendUp,
  Confetti,
} from '@phosphor-icons/react'
import type { Goal, FamilyMember } from '@/lib/types'
import { toast } from 'sonner'

interface FamilyBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal
  onSave: (isFamilyGoal: boolean, members?: FamilyMember[]) => void
}

export function FamilyBudgetDialog({ open, onOpenChange, goal, onSave }: FamilyBudgetDialogProps) {
  const [isFamilyGoal, setIsFamilyGoal] = useState(goal.familyGoal?.isFamily || false)
  const [members, setMembers] = useState<FamilyMember[]>(goal.familyGoal?.members || [])
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberContribution, setNewMemberContribution] = useState('')

  const totalFamilyContribution = members.reduce((sum, m) => sum + m.monthlyContribution, 0)
  const totalFamilyContributed = members.reduce((sum, m) => sum + m.totalContributed, 0)
  const combinedProgress = ((goal.currentAmount + totalFamilyContributed) / goal.targetAmount) * 100

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberContribution) {
      toast.error('Please fill in all fields')
      return
    }

    const contribution = parseFloat(newMemberContribution)
    if (isNaN(contribution) || contribution < 0) {
      toast.error('Please enter a valid contribution amount')
      return
    }

    const newMember: FamilyMember = {
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      monthlyContribution: contribution,
      totalContributed: 0,
      avatarUrl: undefined,
    }

    setMembers([...members, newMember])
    setNewMemberName('')
    setNewMemberEmail('')
    setNewMemberContribution('')
    toast.success(`${newMember.name} added to family goal`)
  }

  const handleRemoveMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    setMembers(members.filter(m => m.id !== memberId))
    if (member) {
      toast.success(`${member.name} removed from family goal`)
    }
  }

  const handleSimulateContribution = (memberId: string) => {
    setMembers(currentMembers =>
      currentMembers.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            totalContributed: m.totalContributed + m.monthlyContribution,
            lastContributionDate: new Date().toISOString(),
          }
        }
        return m
      })
    )
    const member = members.find(m => m.id === memberId)
    if (member) {
      toast.success(`${member.name} contributed $${member.monthlyContribution}`)
    }
  }

  const handleSave = () => {
    if (isFamilyGoal && members.length === 0) {
      toast.error('Add at least one family member for a family goal')
      return
    }

    onSave(isFamilyGoal, isFamilyGoal ? members : [])
    toast.success(isFamilyGoal ? 'Family goal settings saved' : 'Converted to personal goal')
    onOpenChange(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users size={28} weight="duotone" className="text-accent" />
            Family Budgeting for {goal.name}
          </DialogTitle>
          <DialogDescription>
            Collaborate with family members to reach shared financial goals together
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="family-toggle" className="text-base font-semibold">
                    Make this a family goal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share this goal with family members who can contribute toward it
                  </p>
                </div>
                <Switch
                  id="family-toggle"
                  checked={isFamilyGoal}
                  onCheckedChange={setIsFamilyGoal}
                />
              </div>
            </CardContent>
          </Card>

          {isFamilyGoal && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg">
                    Family Members ({members.length})
                  </h3>
                </div>

                {members.length > 0 && (
                  <div className="space-y-3">
                    {members.map(member => (
                      <Card key={member.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{member.name}</h4>
                                <p className="text-sm text-muted-foreground truncate">
                                  {member.email}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Monthly Pledge</p>
                                    <p className="font-display font-bold text-primary">
                                      ${member.monthlyContribution.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Contributed</p>
                                    <p className="font-semibold">
                                      ${member.totalContributed.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSimulateContribution(member.id)}
                                className="gap-1.5"
                              >
                                <Check size={14} />
                                Contribute
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveMember(member.id)}
                                className="gap-1.5 text-destructive hover:text-destructive"
                              >
                                <Trash size={14} />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <Card className="border-dashed border-2 border-muted">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserPlus size={20} weight="duotone" />
                      Add Family Member
                    </CardTitle>
                    <CardDescription>
                      Invite a family member to contribute to this goal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="member-name">Name</Label>
                        <Input
                          id="member-name"
                          placeholder="e.g. Sarah Johnson"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member-email">Email</Label>
                        <Input
                          id="member-email"
                          type="email"
                          placeholder="sarah@example.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="member-contribution">Monthly Contribution</Label>
                      <div className="relative">
                        <CurrencyDollar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="member-contribution"
                          type="number"
                          placeholder="500"
                          className="pl-9"
                          value={newMemberContribution}
                          onChange={(e) => setNewMemberContribution(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddMember} className="w-full gap-2">
                      <Plus size={18} />
                      Add Family Member
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {members.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendUp size={22} weight="duotone" className="text-primary" />
                      Combined Family Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress with family contributions</span>
                        <span className="font-semibold">{combinedProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={combinedProgress} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Your Monthly Contribution
                        </p>
                        <p className="text-xl font-display font-bold">
                          ${goal.monthlyContribution.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Family Monthly Total
                        </p>
                        <p className="text-xl font-display font-bold text-primary">
                          ${totalFamilyContribution.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Your Total Saved
                        </p>
                        <p className="text-xl font-display font-bold">
                          ${goal.currentAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Family Total Contributed
                        </p>
                        <p className="text-xl font-display font-bold text-primary">
                          ${totalFamilyContributed.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <Confetti size={20} className="text-accent flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-accent-foreground mb-1">
                          Combined Monthly: ${(goal.monthlyContribution + totalFamilyContribution).toLocaleString()}
                        </p>
                        <p className="text-muted-foreground">
                          Together, your family is contributing ${(goal.monthlyContribution + totalFamilyContribution).toLocaleString()} per month toward this goal!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!isFamilyGoal && members.length > 0 && (
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Warning size={20} className="text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-warning-foreground mb-1">
                      Converting to Personal Goal
                    </p>
                    <p className="text-muted-foreground">
                      Turning off family budgeting will remove all family members from this goal. You can add them back later if needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Check size={18} />
              Save Family Goal Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
