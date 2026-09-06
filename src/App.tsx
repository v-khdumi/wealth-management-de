import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { CurrencyProvider, useGlobalCurrency } from '@/lib/currency-context'
import { CURRENCY_DATABASE, getCurrencySymbol } from '@/lib/currency-utils'
import { LoginPage } from '@/components/LoginPage'
import { ClientProfile } from '@/components/ClientProfile'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SignOut, Sparkle, CurrencyCircleDollar } from '@phosphor-icons/react'

function CurrencySelector() {
  const { currency, setCurrency } = useGlobalCurrency()
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <CurrencyCircleDollar size={16} className="text-muted-foreground" aria-hidden="true" />
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger aria-label="Display currency" className="h-7 w-[90px] text-xs border-muted">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(CURRENCY_DATABASE).map(code => (
            <SelectItem key={code} value={code} className="text-xs">
              {getCurrencySymbol(code)} {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

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
        <div className="container mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkle size={28} weight="duotone" className="text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Wealth Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">Your Financial Future, Simplified</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-3 lg:justify-end">
            <CurrencySelector />
            <div className="min-w-0 flex-1 text-right lg:flex-none">
              <p className="break-words font-semibold text-foreground text-sm">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">Personal Account</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <SignOut size={16} aria-hidden="true" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        aria-labelledby="dashboard-welcome"
        className="container mx-auto px-4 sm:px-6 py-4 max-w-7xl scroll-mt-56 lg:scroll-mt-24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
      >
        <div className="mb-4">
          <h2 id="dashboard-welcome" className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1 break-words">
            Welcome back, {currentUser.name.split(' ')[0]}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Your complete financial picture and personalized insights
          </p>
        </div>
        <ClientProfile clientId={currentUser.id} />
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:shadow-lg focus:outline focus:outline-2 focus:outline-ring"
        >
          Skip to main content
        </a>
        <AppContent />
        <Toaster position="top-right" />
      </CurrencyProvider>
    </AuthProvider>
  )
}

export default App
