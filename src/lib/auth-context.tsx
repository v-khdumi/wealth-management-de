import { createContext, useContext, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'
import type { User } from './types'

interface AuthContextType {
  currentUser: User | null
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useKV<User | null>('current_user', null)

  const login = (user: User) => {
    setCurrentUser(user)
  }

  const logout = () => {
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser: currentUser ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
