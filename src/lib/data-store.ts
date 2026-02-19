import { useKV } from '@github/spark/hooks'
import { useMemo, useEffect } from 'react'
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
  CategoryBudget,
  SpendingAlert,
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

const INITIAL_SEED_DATA = generateSeedData()
const DATA_VERSION = '1.2'

export function useDataStore() {
  const [dataVersion, setDataVersion] = useKV<string>('data_version', DATA_VERSION)
  const [users, setUsers] = useKV<User[]>('users', SEED_USERS)
  const [clientProfiles, setClientProfiles] = useKV<ClientProfile[]>('client_profiles', SEED_CLIENT_PROFILES)
  const [riskProfiles, setRiskProfiles] = useKV<RiskProfile[]>('risk_profiles', SEED_RISK_PROFILES)
  const [goals, setGoals] = useKV<Goal[]>('goals', SEED_GOALS)
  const [instruments] = useKV<Instrument[]>('instruments', SEED_INSTRUMENTS)
  const [modelPortfolios] = useKV<ModelPortfolio[]>('model_portfolios', SEED_MODEL_PORTFOLIOS)
  
  const [portfolios, setPortfolios] = useKV<Portfolio[]>('portfolios', INITIAL_SEED_DATA.portfolios)
  const [holdings, setHoldings] = useKV<Holding[]>('holdings', INITIAL_SEED_DATA.holdings)
  const [transactions, setTransactions] = useKV<Transaction[]>('transactions', INITIAL_SEED_DATA.transactions)
  
  useEffect(() => {
    if (dataVersion !== DATA_VERSION) {
      setUsers(SEED_USERS)
      setClientProfiles(SEED_CLIENT_PROFILES)
      setRiskProfiles(SEED_RISK_PROFILES)
      setGoals(SEED_GOALS)
      
      const freshSeedData = generateSeedData()
      setPortfolios(freshSeedData.portfolios)
      setHoldings(freshSeedData.holdings)
      setTransactions(freshSeedData.transactions)
      
      setDataVersion(DATA_VERSION)
    }
  }, [dataVersion, setDataVersion, setUsers, setClientProfiles, setRiskProfiles, setGoals, setPortfolios, setHoldings, setTransactions])
  
  const [orders, setOrders] = useKV<Order[]>('orders', [])
  const [nextBestActions, setNextBestActions] = useKV<NextBestAction[]>('next_best_actions', [])
  const [auditEvents, setAuditEvents] = useKV<AuditEvent[]>('audit_events', [])
  const [aiInteractions, setAiInteractions] = useKV<AiInteraction[]>('ai_interactions', [])
  const [bankStatements, setBankStatements] = useKV<BankStatement[]>('bank_statements', [])
  const [categoryBudgets, setCategoryBudgets] = useKV<CategoryBudget[]>('category_budgets', [])
  const [spendingAlerts, setSpendingAlerts] = useKV<SpendingAlert[]>('spending_alerts', [])

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
    categoryBudgets,
    setCategoryBudgets,
    spendingAlerts,
    setSpendingAlerts,
  }
}
