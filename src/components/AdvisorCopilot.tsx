import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

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
      await new Promise(resolve => setTimeout(resolve, 1500))

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: `[DEMO COPILOT RESPONSE]\n\nThis is a demonstration of the Advisor Copilot feature. In production, this would provide AI-powered insights about your clients, portfolio analytics, and recommended actions based on your question: "${userMessage.content}"\n\nThe response would be grounded in actual client data from the system and cite specific facts from client profiles, risk assessments, and portfolio holdings.\n\nDISCLAIMER: Demo response for illustration purposes only.`,
        sources: [
          'Client database (12 active clients)',
          'Portfolio analytics engine',
          'Risk profile assessments',
          'Next best actions engine',
        ],
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to get response')
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
