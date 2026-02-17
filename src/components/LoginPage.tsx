import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Sparkle, TrendUp, Target } from '@phosphor-icons/react'
import { useAuth } from '@/lib/auth-context'
import { SEED_USERS } from '@/lib/seed-data'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { login } = useAuth()
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const clientUsers = SEED_USERS.filter(u => u.role === 'CLIENT')

  const handleLogin = () => {
    const user = SEED_USERS.find(u => u.id === selectedUserId)
    if (user) {
      login(user)
      onLogin()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6">
            <Sparkle size={40} weight="duotone" className="text-white" />
          </div>
          <h1 className="text-5xl font-display font-bold text-primary mb-4">
            My Wealth Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Take control of your financial future with AI-powered insights
          </p>
          <p className="text-sm text-warning mt-3 font-medium bg-warning/10 inline-block px-4 py-2 rounded-full">
            Demo Platform - Explore with sample personas
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <TrendUp size={24} weight="duotone" />
                </div>
                <CardTitle className="text-lg">Track Growth</CardTitle>
              </div>
              <CardDescription>
                Monitor your wealth in real-time with clear, beautiful visualizations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <Sparkle size={24} weight="duotone" />
                </div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
              </div>
              <CardDescription>
                Get personalized insights and answers to your financial questions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-success/20 hover:border-success/40 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-success/10 text-success">
                  <Target size={24} weight="duotone" />
                </div>
                <CardTitle className="text-lg">Reach Goals</CardTitle>
              </div>
              <CardDescription>
                Plan for retirement, homes, education, and make them happen
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Choose a Demo Persona</CardTitle>
            <CardDescription>
              Each persona represents a different financial journey. Explore to see how the platform adapts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="user-select" className="text-base font-semibold">Select Your Persona</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select" className="h-12">
                  <SelectValue placeholder="Choose a persona to explore..." />
                </SelectTrigger>
                <SelectContent>
                  {clientUsers.map(user => (
                    <SelectItem key={user.id} value={user.id} className="py-3">
                      <div className="font-medium">{user.name}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleLogin}
              disabled={!selectedUserId}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              Start Exploring
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          This is a demonstration platform. All data is simulated for educational purposes.
        </p>
      </div>
    </div>
  )
}
