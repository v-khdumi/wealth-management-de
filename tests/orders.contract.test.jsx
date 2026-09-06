import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrdersView } from '../src/components/OrdersView'
import { chooseOption, createMemoryStore, NOW } from './support/harness.mjs'

const boundary = vi.hoisted(() => ({
  store: null,
  user: null,
  suitability: vi.fn(),
  cash: vi.fn(),
  concentration: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ currentUser: boundary.user }) }))
vi.mock('@/lib/data-store', () => ({ useDataStore: () => boundary.store.useStore() }))
vi.mock('@/lib/business-logic', () => ({
  checkSuitability: boundary.suitability,
  checkCashSufficiency: boundary.cash,
  checkConcentration: boundary.concentration,
}))
vi.mock('sonner', () => ({ toast: { success: boundary.success, error: boundary.error } }))

const writable = ['orders', 'holdings', 'portfolios', 'transactions', 'auditEvents']

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
  vi.setSystemTime(new Date(NOW))
  boundary.user = { id: 'actor-a', name: 'Synthetic Actor' }
  boundary.suitability.mockReset().mockReturnValue({ suitable: true })
  boundary.cash.mockReset().mockReturnValue({ sufficient: true, available: 1000 })
  boundary.concentration.mockReset().mockReturnValue({ acceptable: true })
  boundary.store = createMemoryStore({
    portfolios: [
      { id: 'portfolio-a', clientId: 'client-a', cash: 1000, totalValue: 2000 },
      { id: 'portfolio-b', clientId: 'client-b', cash: 777, totalValue: 888 },
    ],
    holdings: [
      { id: 'holding-a', portfolioId: 'portfolio-a', instrumentId: 'instrument-a', quantity: 10, averageCost: 10 },
      { id: 'holding-b', portfolioId: 'portfolio-b', instrumentId: 'instrument-a', quantity: 7, averageCost: 11 },
    ],
    instruments: [{ id: 'instrument-a', symbol: 'SAFE', currentPrice: 20 }],
    riskProfiles: [{ clientId: 'client-a', score: 5 }],
    orders: [],
    transactions: [],
    auditEvents: [],
  }, writable)
})

function form(quantity = '5') {
  render(<OrdersView clientId="client-a" />)
  fireEvent.click(screen.getByRole('button', { name: 'New Order' }))
  chooseOption(screen.getByRole('combobox', { name: 'Instrument' }), 'SAFE - $20.00')
  fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: quantity } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Submit Order' }))
}

function expectNoWrites() {
  for (const setter of Object.values(boundary.store.writes)) {
    expect(setter).not.toHaveBeenCalled()
  }
}

describe('paper-order validation contracts', () => {
  it('does not expose an order form when the portfolio is absent', () => {
    render(<OrdersView clientId="missing-client" />)
    expect(screen.getByText('Portfolio not found')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'New Order' })).toBeNull()
    expectNoWrites()
  })

  it('requires an instrument and quantity before submission', () => {
    render(<OrdersView clientId="client-a" />)
    fireEvent.click(screen.getByRole('button', { name: 'New Order' }))
    expect(screen.getByRole('button', { name: 'Submit Order' }).disabled).toBe(true)
    chooseOption(screen.getByRole('combobox', { name: 'Instrument' }), 'SAFE - $20.00')
    expect(screen.getByRole('button', { name: 'Submit Order' }).disabled).toBe(true)
    expectNoWrites()
  })

  it.each(['0', '-1'])('rejects quantity %s without writes', quantity => {
    form(quantity)
    submit()
    expect(boundary.error).toHaveBeenCalledWith('Invalid quantity')
    expect(boundary.suitability).not.toHaveBeenCalled()
    expectNoWrites()
  })

  it('does not submit without a current actor', () => {
    boundary.user = null
    form()
    submit()
    expect(boundary.suitability).not.toHaveBeenCalled()
    expectNoWrites()
  })

  it('does not submit without a risk profile', () => {
    boundary.store = createMemoryStore({ ...boundary.store.getSnapshot(), riskProfiles: [] }, writable)
    form()
    submit()
    expect(boundary.suitability).not.toHaveBeenCalled()
    expectNoWrites()
  })

  it.each([
    ['suitability', 'Suitability Check Failed'],
    ['cash', 'Insufficient Cash'],
    ['concentration', 'Concentration Limit Exceeded'],
  ])('stops at a failed %s check without scheduling financial writes', (check, message) => {
    if (check === 'suitability') boundary.suitability.mockReturnValue({ suitable: false, reason: 'Synthetic rejection' })
    if (check === 'cash') boundary.cash.mockReturnValue({ sufficient: false, available: 10 })
    if (check === 'concentration') boundary.concentration.mockReturnValue({ acceptable: false, resultingPercentage: 60, limit: 25 })
    form()
    submit()
    expect(boundary.error).toHaveBeenCalledWith(message, expect.any(Object))
    if (check === 'suitability') expect(boundary.cash).not.toHaveBeenCalled()
    if (check !== 'concentration') expect(boundary.concentration).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(2000))
    expectNoWrites()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})

describe('paper-order execution and audit integration', () => {
  it('creates a pending audit-linked order, then executes only after two seconds', () => {
    const initial = boundary.store.getSnapshot()
    form()
    submit()
    let state = boundary.store.getSnapshot()
    expect(boundary.suitability).toHaveBeenCalledWith(initial.instruments[0], initial.riskProfiles[0])
    expect(boundary.cash).toHaveBeenCalledWith(initial.portfolios[0], 100)
    expect(boundary.concentration).toHaveBeenCalledWith(
      [initial.holdings[0]], initial.instruments, initial.portfolios[0], 'instrument-a', 5,
    )
    expect(state.orders).toHaveLength(1)
    const order = state.orders[0]
    expect(order).toMatchObject({
      portfolioId: 'portfolio-a', instrumentId: 'instrument-a', side: 'BUY',
      orderType: 'MARKET', quantity: 5, status: 'PENDING', createdBy: 'actor-a', createdAt: NOW,
    })
    expect(order.idempotencyKey).toEqual(expect.any(String))
    expect(order.idempotencyKey.length).toBeGreaterThan(0)
    expect(state.auditEvents).toHaveLength(1)
    expect(state.auditEvents[0]).toMatchObject({
      type: 'ORDER_CREATED', actorUserId: 'actor-a', clientId: 'client-a', timestamp: NOW,
      details: { orderId: order.id, instrument: 'SAFE', quantity: 5, side: 'BUY' },
    })
    expect(state.transactions).toEqual([])
    expect(state.portfolios).toEqual(initial.portfolios)
    expect(screen.getByText('PENDING')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()

    act(() => vi.advanceTimersByTime(1999))
    expect(boundary.store.getSnapshot().orders[0].status).toBe('PENDING')
    act(() => vi.advanceTimersByTime(1))
    state = boundary.store.getSnapshot()
    expect(state.orders[0]).toMatchObject({ status: 'EXECUTED', executedPrice: 20 })
    expect(state.portfolios[0]).toMatchObject({ cash: 900, totalValue: 2000 })
    expect(state.holdings[0].quantity).toBe(15)
    expect(state.holdings[0].averageCost).toBeCloseTo(200 / 15)
    expect(state.portfolios[1]).toEqual(initial.portfolios[1])
    expect(state.holdings[1]).toEqual(initial.holdings[1])
    expect(state.transactions).toHaveLength(1)
    expect(state.transactions[0]).toMatchObject({
      orderId: order.id, portfolioId: 'portfolio-a', instrumentId: 'instrument-a',
      type: 'BUY', quantity: 5, price: 20, amount: 100,
    })
    expect(screen.getByText('EXECUTED')).toBeTruthy()
    act(() => vi.advanceTimersByTime(10000))
    expect(boundary.store.getSnapshot().transactions).toHaveLength(1)
    expect(boundary.store.getSnapshot().auditEvents).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'New Order' }))
    expect(screen.getByLabelText('Quantity').value).toBe('')
    expect(screen.getByRole('button', { name: 'Submit Order' }).disabled).toBe(true)
  })

  it('uses the entered limit price for both estimated cost and simulated execution', () => {
    form('4')
    fireEvent.click(screen.getByRole('radio', { name: 'Limit', exact: true }))
    fireEvent.change(screen.getByLabelText('Limit Price'), { target: { value: '12.5' } })
    submit()
    expect(boundary.cash).toHaveBeenCalledWith(expect.objectContaining({ id: 'portfolio-a' }), 50)
    act(() => vi.advanceTimersByTime(2000))
    const state = boundary.store.getSnapshot()
    expect(state.orders[0]).toMatchObject({ orderType: 'LIMIT', limitPrice: 12.5, executedPrice: 12.5 })
    expect(state.portfolios[0].cash).toBe(950)
    expect(state.holdings[0].averageCost).toBeCloseTo(150 / 14)
    expect(state.transactions[0].amount).toBe(50)
  })

  it('adds a holding when buying an instrument not already held', () => {
    boundary.store = createMemoryStore({
      ...boundary.store.getSnapshot(), holdings: [boundary.store.getSnapshot().holdings[1]],
    }, writable)
    form('2')
    submit()
    act(() => vi.advanceTimersByTime(2000))
    const state = boundary.store.getSnapshot()
    expect(state.holdings).toHaveLength(2)
    expect(state.holdings.find(h => h.portfolioId === 'portfolio-a')).toMatchObject({
      instrumentId: 'instrument-a', quantity: 2, averageCost: 20, currentPrice: 20,
    })
  })

  it.each([[3, 7, 1060], [10, 0, 1200]])('sells %i held shares with the existing sell-side validation path', (quantity, remaining, cash) => {
    form(String(quantity))
    fireEvent.click(screen.getByRole('radio', { name: 'Sell', exact: true }))
    submit()
    expect(boundary.suitability).toHaveBeenCalledTimes(1)
    expect(boundary.cash).not.toHaveBeenCalled()
    expect(boundary.concentration).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(2000))
    const state = boundary.store.getSnapshot()
    expect(state.portfolios[0]).toMatchObject({ cash, totalValue: 2000 })
    const holding = state.holdings.find(h => h.id === 'holding-a')
    if (remaining === 0) expect(holding).toBeUndefined()
    else expect(holding).toMatchObject({ quantity: remaining, averageCost: 10 })
    expect(state.holdings.find(h => h.id === 'holding-b').quantity).toBe(7)
    expect(state.transactions[0]).toMatchObject({ type: 'SELL', quantity, amount: quantity * 20 })
  })
})
