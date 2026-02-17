import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { LoginPage } from '@/components/LoginPage'
import { AdvisorDashboard } from '@/components/AdvisorDashboard'
import { ClientProfile } from '@/components/ClientProfile'
import { AdvisorCopilot } from '@/components/AdvisorCopilot'
import { Button } from '@/components/ui/button'
import { SignOut, Briefcase, User } from '@phosphor-icons/react'

function AppContent() {
  const { currentUser, logout } = useAuth()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    setSelectedClientId(null)
  }

  if (!currentUser) {
    return <LoginPage onLogin={() => {}} />
  }

  if (currentUser.role === 'ADVISOR') {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
          <div className="container mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Briefcase size={24} weight="duotone" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold">Wealth Management Platform</h1>
                <p className="text-xs text-muted-foreground">Advisor Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">Advisor</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <SignOut size={16} />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-8 py-8">
          {selectedClientId ? (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ClientProfile
                  clientId={selectedClientId}
                  onBack={() => setSelectedClientId(null)}
                />
              </div>
              <div className="lg:col-span-1">
                <AdvisorCopilot />
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <AdvisorDashboard onClientSelect={setSelectedClientId} />
              </div>
              <div className="lg:col-span-1">
                <AdvisorCopilot />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent text-accent-foreground">
              <User size={24} weight="duotone" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Wealth Management Platform</h1>
              <p className="text-xs text-muted-foreground">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">Client</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <SignOut size={16} />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-8 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-4xl font-display font-bold text-primary mb-2">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-muted-foreground">
            Manage your portfolio, track goals, and review your financial progress
          </p>
        </div>
        <ClientProfile clientId={currentUser.id} />
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App
