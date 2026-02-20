import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useDataStore } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { generateNextBestActions } from '@/lib/business-logic'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: string
}

export function AdvisorCopilot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { currentUser } = useAuth()
  const {
    users,
    clientProfiles,
    riskProfiles,
    portfolios,
    holdings,
    instruments,
    modelPortfolios,
    goals,
  } = useDataStore()

  const advisorClients = useMemo(() => {
    if (!currentUser) return []
    return (users || []).filter(u => u.role === 'CLIENT' && u.advisorId === currentUser.id)
  }, [users, currentUser])

  const buildContextFacts = () => {
    const clientSummaries = advisorClients.map(client => {
      const profile = (clientProfiles || []).find(cp => cp.userId === client.id)
      const riskProfile = (riskProfiles || []).find(rp => rp.clientId === client.id)
      const portfolio = (portfolios || []).find(p => p.clientId === client.id)
      const clientHoldings = (holdings || []).filter(h => h.clientId === client.id)
      const clientGoals = (goals || []).filter(g => g.clientId === client.id)
      const actions = riskProfile && portfolio
        ? generateNextBestActions(client.id, portfolio, clientHoldings, instruments || [], riskProfile, clientGoals, modelPortfolios || [])
        : []

      return {
        id: client.id,
        name: client.name,
        segment: profile?.segment || 'N/A',
        riskScore: riskProfile?.score ?? null,
        riskCategory: riskProfile?.category || 'N/A',
        riskProfileAgeDays: riskProfile
          ? Math.floor((Date.now() - new Date(riskProfile.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
          : null,
        portfolioValue: portfolio?.totalValue ?? null,
        cashPct: portfolio ? Math.round((portfolio.cash / portfolio.totalValue) * 100) : null,
        goalsCount: clientGoals.length,
        highPriorityActions: actions.filter(a => a.priority === 'HIGH').length,
        totalActions: actions.length,
      }
    })

    return {
      advisorName: currentUser?.name || 'Advisor',
      clientCount: advisorClients.length,
      clients: clientSummaries,
      totalAUM: clientSummaries.reduce((sum, c) => sum + (c.portfolioValue || 0), 0),
    }
  }

  const handleSubmit = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const facts = buildContextFacts()
      const factsJson = JSON.stringify(facts, null, 2)

      const systemPrompt = `You are an AI Advisor Copilot for ${facts.advisorName}, a wealth management advisor.
You have access to real-time data about their ${facts.clientCount} clients.
Provide concise, professional, and actionable insights based strictly on the data provided.
Do not make up any data not present in the facts. If data is not available, say so clearly.
Always be professional and note that responses are based on system data, not external financial advice.`

      const promptText = `${systemPrompt}

ADVISOR BOOK DATA:
${factsJson}

ADVISOR QUESTION: ${userMessage.content}

Provide a helpful, specific answer based on the data above. Be concise and professional.`

      const responseText = await window.spark.llm(promptText, 'gpt-4o-mini')

      const sources = [
        `${facts.clientCount} clients in book`,
        `Total AUM: $${facts.totalAUM.toLocaleString()}`,
        `${facts.clients.filter(c => c.highPriorityActions > 0).length} clients with high-priority actions`,
      ]

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: responseText,
        sources,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to get response', {
        description: 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="ai-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <Sparkle size={24} weight="fill" />
          Advisor Copilot
        </CardTitle>
        <CardDescription>
          AI-powered insights about your clients and book
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkle size={48} className="mx-auto mb-4 opacity-30" weight="duotone" />
                <p className="text-sm">
                  Ask questions about your clients, request briefings, or get insights about your book.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <p className="font-medium">Try asking:</p>
                  <p>"Summarize my high-priority alerts"</p>
                  <p>"Which clients need risk profile updates?"</p>
                  <p>"Show me clients with goal gaps over $50k"</p>
                </div>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-8'
                      : 'bg-accent/10 border border-accent/30 mr-8'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-accent/30">
                      <p className="text-xs font-medium mb-2">Sources Used:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.sources.map((source, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="space-y-2">
          <Textarea
            placeholder="Ask about your clients or book..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="w-full gap-2"
          >
            <Sparkle size={20} weight={isLoading ? 'fill' : 'duotone'} />
            {isLoading ? 'Thinking...' : 'Ask Copilot'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          <p className="font-medium mb-1">🔒 Grounding & Safety:</p>
          <p>Responses are grounded in your actual client data. AI cannot access external information or provide financial advice.</p>
        </div>
      </CardContent>
    </Card>
  )
}
