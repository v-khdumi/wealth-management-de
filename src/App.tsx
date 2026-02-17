import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { LoginPage } from '@/components/LoginPage'
import { ClientProfile } from '@/components/ClientProfile'
import { Button } from '@/components/ui/button'
import { SignOut, Sparkle } from '@phosphor-icons/react'

function AppContent() {
  const { currentUser, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  if (!currentUser) {
    return <LoginPage onLogin={() => {}} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkle size={28} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Wealth Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">Your Financial Future, Simplified</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-foreground">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">Personal Account</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <SignOut size={16} />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
            Welcome back, {currentUser.name.split(' ')[0]}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Here's your complete financial picture and personalized insights
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
