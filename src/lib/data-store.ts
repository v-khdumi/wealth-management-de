import { useKV } from '@github/spark/hooks'
import type {
  User,
  ClientProfile,
  RiskProfile,
  Goal,
  Portfolio,
  Holding,
  Instrument,
  ModelPortfolio,
  Order,
  NextBestAction,
  AuditEvent,
  AiInteraction,
  Transaction,
  BankStatement,
} from './types'
import {
  SEED_USERS,
  SEED_CLIENT_PROFILES,
  SEED_RISK_PROFILES,
  SEED_INSTRUMENTS,
  SEED_MODEL_PORTFOLIOS,
  SEED_GOALS,
  generateSeedData,
} from './seed-data'

export function useDataStore() {
  const [users] = useKV<User[]>('users', SEED_USERS)
  const [clientProfiles] = useKV<ClientProfile[]>('client_profiles', SEED_CLIENT_PROFILES)
  const [riskProfiles, setRiskProfiles] = useKV<RiskProfile[]>('risk_profiles', SEED_RISK_PROFILES)
  const [goals, setGoals] = useKV<Goal[]>('goals', SEED_GOALS)
  const [instruments] = useKV<Instrument[]>('instruments', SEED_INSTRUMENTS)
  const [modelPortfolios] = useKV<ModelPortfolio[]>('model_portfolios', SEED_MODEL_PORTFOLIOS)
  
  const seedData = generateSeedData()
  const [portfolios, setPortfolios] = useKV<Portfolio[]>('portfolios', seedData.portfolios)
  const [holdings, setHoldings] = useKV<Holding[]>('holdings', seedData.holdings)
  const [transactions, setTransactions] = useKV<Transaction[]>('transactions', seedData.transactions)
  
  const [orders, setOrders] = useKV<Order[]>('orders', [])
  const [nextBestActions, setNextBestActions] = useKV<NextBestAction[]>('next_best_actions', [])
  const [auditEvents, setAuditEvents] = useKV<AuditEvent[]>('audit_events', [])
  const [aiInteractions, setAiInteractions] = useKV<AiInteraction[]>('ai_interactions', [])
  const [bankStatements, setBankStatements] = useKV<BankStatement[]>('bank_statements', [])

  return {
    users,
    clientProfiles,
    riskProfiles,
    setRiskProfiles,
    goals,
    setGoals,
    instruments,
    modelPortfolios,
    portfolios,
    setPortfolios,
    holdings,
    setHoldings,
    transactions,
    setTransactions,
    orders,
    setOrders,
    nextBestActions,
    setNextBestActions,
    auditEvents,
    setAuditEvents,
    aiInteractions,
    setAiInteractions,
    bankStatements,
    setBankStatements,
  }
}
