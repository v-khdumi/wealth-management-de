import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { Sparkle, PaperPlaneTilt } from '@phosphor-icons/react'
import { useDataStore } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { generateAdvisorBrief, createAiInteractionRecord } from '@/lib/ai-service'
import { toast } from 'sonner'

interface AIAssistantProps {
  clientId: string
}

export function AIAssistant({ clientId }: AIAssistantProps) {
  const { currentUser } = useAuth()
  const { 
    users,
    clientProfiles,
    riskProfiles,
    goals,
    portfolios,
    aiInteractions,
    setAiInteractions 
  } = useDataStore()

  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const client = users?.find(u => u.id === clientId)
  const profile = clientProfiles?.find(cp => cp.userId === clientId)
  const riskProfile = riskProfiles?.find(rp => rp.clientId === clientId)
  const clientGoals = goals?.filter(g => g.clientId === clientId) || []
  const portfolio = portfolios?.find(p => p.clientId === clientId)

  const conversationHistory = (aiInteractions || [])
    .filter(i => i.clientId === clientId)
    .slice(-10)
    .reverse()

  const quickPrompts = [
    "Explain my portfolio allocation",
    "How am I tracking toward my goals?",
    "What should I focus on financially?",
    "Is my risk level appropriate?",
  ]

  const handleAskQuestion = async (questionText?: string) => {
    const q = questionText || question
    if (!q.trim() || !currentUser || !client || !profile || !riskProfile || !portfolio) return

    setIsLoading(true)
    try {
      const response = await generateAdvisorBrief(
        q,
        client,
        profile,
        riskProfile,
        portfolio,
        clientGoals
      )

      const interaction = createAiInteractionRecord(
        currentUser.id,
        clientId,
        'financial-assistant',
        q,
        response
      )

      setAiInteractions((current) => [...(current || []), interaction])
      setQuestion('')
      
      toast.success('Got your answer!', {
        description: 'Your AI assistant has responded',
      })
    } catch (error) {
      toast.error('Could not get an answer', {
        description: 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="ai-glow sticky top-24">
      <CardHeader className="border-b bg-gradient-to-r from-accent/5 to-primary/5">
        <CardTitle className="flex items-center gap-2 text-accent">
          <Sparkle size={24} weight="duotone" />
          Your AI Financial Assistant
        </CardTitle>
        <CardDescription>
          Ask me anything about your finances, investments, or goals
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-2">
            {quickPrompts.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleAskQuestion(prompt)}
                disabled={isLoading}
                className="text-xs justify-start text-left h-auto py-2 px-3"
              >
                {prompt}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Ask me anything about your finances..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAskQuestion()
                }
              }}
              className="min-h-24 resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleAskQuestion()}
              disabled={isLoading || !question.trim()}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkle size={18} weight="fill" className="animate-pulse" />
                  Thinking...
                </>
              ) : (
                <>
                  <PaperPlaneTilt size={18} weight="duotone" />
                  Ask Question
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="border-t">
          <ScrollArea className="h-96">
            <div className="p-6 space-y-4">
              {conversationHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkle size={48} weight="duotone" className="mx-auto mb-4 text-accent/30" />
                  <p className="font-medium mb-2">Start a conversation!</p>
                  <p className="text-sm">
                    I'm here to help you understand your finances and make informed decisions.
                  </p>
                </div>
              ) : (
                conversationHistory.map((interaction) => (
                  <div key={interaction.id} className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-primary/10 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                        <p className="text-sm font-medium">{interaction.prompt}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkle size={16} weight="fill" className="text-accent" />
                          <span className="text-xs font-semibold text-accent">AI Assistant</span>
                          {interaction.offlineMode && (
                            <Badge variant="secondary" className="text-xs">Demo</Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {interaction.response}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3 italic">
                          Note: This is educational guidance, not financial advice.
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

