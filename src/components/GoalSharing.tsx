import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Label } from './ui/label'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback } from './ui/avatar'
import { 
  ShareNetwork, 
  Heart, 
  Warning, 
  ChatCircle, 
  EnvelopeSimple, 
  CheckCircle,
  Clock,
  Trash
} from '@phosphor-icons/react'
import type { Goal, GoalFeedback } from '@/lib/types'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

interface GoalSharingProps {
  goal: Goal
  onUpdateGoal: (updates: Partial<Goal>) => void
}

export function GoalSharing({ goal, onUpdateGoal }: GoalSharingProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<GoalFeedback | null>(null)

  const handleShare = () => {
    if (!recipientEmail || !recipientName) {
      toast.error('Please provide both name and email')
      return
    }

    if (!recipientEmail.includes('@')) {
      toast.error('Please provide a valid email address')
      return
    }

    const newFeedback: GoalFeedback = {
      id: `feedback_${Date.now()}`,
      goalId: goal.id,
      sharedWithEmail: recipientEmail,
      sharedWithName: recipientName,
      message: undefined,
      sentiment: 'NEUTRAL',
      createdAt: new Date().toISOString(),
      readAt: undefined,
    }

    const updatedSharedWith = [...(goal.sharedWith || []), newFeedback]
    onUpdateGoal({ sharedWith: updatedSharedWith })

    toast.success('Goal Shared!', {
      description: `${recipientName} has been invited to provide feedback on your ${goal.name} goal`,
    })

    setRecipientEmail('')
    setRecipientName('')
    setShareMessage('')
    setShowShareDialog(false)
  }

  const handleSimulateFeedback = (feedbackId: string) => {
    const feedbackMessages = [
      { sentiment: 'SUPPORTIVE' as const, messages: [
        "This is such an inspiring goal! I'm so proud of your progress so far. Keep it up!",
        "You're doing amazing! Your dedication to this goal really shows. I believe in you!",
        "Love seeing how committed you are to this. The progress you're making is incredible!",
        "This goal really aligns with your dreams. So excited to see you achieve this!",
      ]},
      { sentiment: 'CONCERNED' as const, messages: [
        "Have you thought about whether the timeline is realistic? Just want to make sure you're not putting too much pressure on yourself.",
        "I noticed the monthly contribution seems high. Are you sure this won't strain your budget?",
        "Maybe consider breaking this into smaller milestones? It might feel more achievable.",
      ]},
      { sentiment: 'SUPPORTIVE' as const, messages: [
        "What an awesome goal! Let me know if there's any way I can support you on this journey.",
        "I'm here if you ever want to talk through your strategy. You've got this!",
      ]},
    ]

    const randomFeedbackSet = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]
    const randomMessage = randomFeedbackSet.messages[Math.floor(Math.random() * randomFeedbackSet.messages.length)]

    const updatedSharedWith = (goal.sharedWith || []).map(feedback => {
      if (feedback.id === feedbackId) {
        return {
          ...feedback,
          message: randomMessage,
          sentiment: randomFeedbackSet.sentiment,
          readAt: feedback.readAt || new Date().toISOString(),
        }
      }
      return feedback
    })

    onUpdateGoal({ sharedWith: updatedSharedWith })

    toast.success('Feedback Received!', {
      description: 'Check the new message from your family member',
    })
  }

  const handleMarkAsRead = (feedbackId: string) => {
    const updatedSharedWith = (goal.sharedWith || []).map(feedback => {
      if (feedback.id === feedbackId && !feedback.readAt) {
        return { ...feedback, readAt: new Date().toISOString() }
      }
      return feedback
    })

    onUpdateGoal({ sharedWith: updatedSharedWith })
    toast.success('Marked as read')
  }

  const handleRemoveShare = (feedbackId: string) => {
    const updatedSharedWith = (goal.sharedWith || []).filter(f => f.id !== feedbackId)
    onUpdateGoal({ sharedWith: updatedSharedWith })
    toast.success('Share removed')
    setSelectedFeedback(null)
    setShowFeedbackDialog(false)
  }

  const sharedCount = goal.sharedWith?.length || 0
  const unreadCount = goal.sharedWith?.filter(f => f.message && !f.readAt).length || 0
  const feedbackCount = goal.sharedWith?.filter(f => f.message).length || 0

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShareNetwork className="text-accent" />
            Share Goal with Family
          </CardTitle>
          <CardDescription>
            Get feedback and support from loved ones on your financial journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-display font-bold text-foreground">{sharedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Shared With</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-display font-bold text-accent">{feedbackCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Feedback</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-display font-bold text-primary">{unreadCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Unread</p>
            </div>
          </div>

          <Button 
            onClick={() => setShowShareDialog(true)} 
            className="w-full gap-2"
            variant="outline"
          >
            <EnvelopeSimple />
            Share with Family Member
          </Button>

          {sharedCount > 0 && (
            <div className="space-y-3 mt-6">
              <h4 className="text-sm font-semibold text-foreground">Family Members</h4>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {goal.sharedWith?.map((feedback) => (
                    <div
                      key={feedback.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        feedback.message && !feedback.readAt
                          ? 'bg-accent/10 border-accent/30 hover:bg-accent/15'
                          : 'bg-card hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedFeedback(feedback)
                        setShowFeedbackDialog(true)
                        if (feedback.message && !feedback.readAt) {
                          handleMarkAsRead(feedback.id)
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {feedback.sharedWithName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-foreground">
                                {feedback.sharedWithName}
                              </p>
                              {feedback.message && !feedback.readAt && (
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {feedback.sharedWithEmail}
                            </p>
                            {feedback.message && (
                              <div className="mt-2 flex items-start gap-2">
                                {feedback.sentiment === 'SUPPORTIVE' ? (
                                  <Heart className="text-success shrink-0 mt-0.5" size={16} weight="fill" />
                                ) : feedback.sentiment === 'CONCERNED' ? (
                                  <Warning className="text-warning shrink-0 mt-0.5" size={16} weight="fill" />
                                ) : (
                                  <ChatCircle className="text-accent shrink-0 mt-0.5" size={16} />
                                )}
                                <p className="text-xs text-foreground line-clamp-2">
                                  {feedback.message}
                                </p>
                              </div>
                            )}
                            {!feedback.message && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock size={12} />
                                Awaiting feedback
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {sharedCount === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ShareNetwork size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No one shared with yet</p>
              <p className="text-xs mt-1">Share your goal to get support and feedback from family</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Goal with Family</DialogTitle>
            <DialogDescription>
              Invite a family member to view your progress and provide feedback on your {goal.name} goal
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Family Member Name</Label>
              <Input
                id="name"
                placeholder="e.g., Mom, Sarah, Uncle John"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="their@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Optional Message (coming soon)</Label>
              <Textarea
                id="message"
                placeholder="I'm working toward this goal and would love your support..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={3}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Custom messages will be available in a future update
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} className="gap-2">
              <EnvelopeSimple />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback from {selectedFeedback?.sharedWithName}</DialogTitle>
            <DialogDescription>
              {selectedFeedback?.sharedWithEmail}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedFeedback?.message ? (
              <>
                <div className={`p-4 rounded-lg border ${
                  selectedFeedback.sentiment === 'SUPPORTIVE'
                    ? 'bg-success/5 border-success/20'
                    : selectedFeedback.sentiment === 'CONCERNED'
                    ? 'bg-warning/5 border-warning/20'
                    : 'bg-muted/50'
                }`}>
                  <div className="flex items-start gap-3">
                    {selectedFeedback.sentiment === 'SUPPORTIVE' ? (
                      <Heart className="text-success shrink-0 mt-1" size={24} weight="fill" />
                    ) : selectedFeedback.sentiment === 'CONCERNED' ? (
                      <Warning className="text-warning shrink-0 mt-1" size={24} weight="fill" />
                    ) : (
                      <ChatCircle className="text-accent shrink-0 mt-1" size={24} />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-foreground leading-relaxed">
                        {selectedFeedback.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(selectedFeedback.createdAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedFeedback.readAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle size={14} />
                    Read on {format(parseISO(selectedFeedback.readAt), 'PPp')}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Clock size={48} className="mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="text-sm text-muted-foreground">No feedback yet</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Shared on {format(parseISO(selectedFeedback?.createdAt || ''), 'PPP')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => {
                    if (selectedFeedback) {
                      handleSimulateFeedback(selectedFeedback.id)
                    }
                  }}
                >
                  <ChatCircle />
                  Simulate Feedback (Demo)
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => {
                if (selectedFeedback) {
                  handleRemoveShare(selectedFeedback.id)
                }
              }}
            >
              <Trash />
              Remove Share
            </Button>
            <Button onClick={() => setShowFeedbackDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
