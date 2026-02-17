import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Briefcase, User as UserIcon } from '@phosphor-icons/react'
import { useAuth } from '@/lib/auth-context'
import { SEED_USERS } from '@/lib/seed-data'
import type { UserRole, User } from '@/lib/types'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADVISOR')
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const availableUsers = SEED_USERS.filter(u => u.role === selectedRole)

  const handleLogin = () => {
    const user = SEED_USERS.find(u => u.id === selectedUserId)
    if (user) {
      login(user)
      onLogin()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold text-primary mb-4">
            Wealth Management Platform
          </h1>
          <p className="text-xl text-muted-foreground">
            Demo System - GenAI Enhanced Advisory
          </p>
          <p className="text-sm text-destructive mt-2 font-medium">
            DEMO / PLACEHOLDER - Not for Production Use
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card
            className={`cursor-pointer transition-all ${
              selectedRole === 'ADVISOR'
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedRole('ADVISOR')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                  <Briefcase size={32} weight="duotone" />
                </div>
                <div>
                  <CardTitle>Advisor Portal</CardTitle>
                  <CardDescription>Manage client portfolios & AI copilot</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access full book of clients, portfolio analytics, AI-powered insights, and next best actions.
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedRole === 'CLIENT'
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedRole('CLIENT')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent text-accent-foreground">
                  <UserIcon size={32} weight="duotone" />
                </div>
                <div>
                  <CardTitle>Client Portal</CardTitle>
                  <CardDescription>View your portfolio & financial goals</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View your portfolio, track goals, review performance, and get AI explanations of your investments.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Select User</CardTitle>
            <CardDescription>
              Choose a demo {selectedRole.toLowerCase()} account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleLogin}
              disabled={!selectedUserId}
              className="w-full"
              size="lg"
            >
              Continue as {selectedRole === 'ADVISOR' ? 'Advisor' : 'Client'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
