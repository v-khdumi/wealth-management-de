import { useSyncExternalStore } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { vi } from 'vitest'

export const NOW = '2026-01-15T12:00:00.000Z'

export function deferred() {
  let resolve
  let reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

// This adapter models the functional setter contract, not Spark persistence.
// It reads the latest snapshot after an updater, preserving nested writes to
// other collections performed by the existing paper-trading implementation.
export function createMemoryStore(initial, writableKeys) {
  const listeners = new Set()
  let snapshot = { ...initial }
  const writes = {}
  for (const key of writableKeys) {
    const setterName = `set${key[0].toUpperCase()}${key.slice(1)}`
    const setter = vi.fn(update => {
      const next = typeof update === 'function' ? update(snapshot[key]) : update
      snapshot = { ...snapshot, [key]: next }
      for (const listener of listeners) listener()
    })
    writes[key] = setter
    snapshot[setterName] = setter
  }
  const subscribe = listener => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
  const getSnapshot = () => snapshot
  return {
    writes,
    getSnapshot,
    useStore() {
      return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    },
  }
}

export function chooseOption(trigger, name) {
  fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' })
  const option = screen.getAllByRole('option', { name }).find(element => element.tagName !== 'OPTION')
  if (!option) throw new Error(`Visible Radix option not found: ${name}`)
  fireEvent.click(option)
}

export function statement(overrides = {}) {
  return {
    id: 'statement-usd',
    userId: 'client-a',
    fileName: 'synthetic-usd.csv',
    status: 'COMPLETED',
    uploadedAt: NOW,
    extractedData: {
      currency: 'USD',
      currencySymbol: '$',
      statementDate: '2026-01-01T12:00:00.000Z',
      openingBalance: 0,
      closingBalance: 400,
      totalIncome: 1000,
      totalExpenses: 600,
      categorySummary: [
        { category: 'Housing', amount: 400, transactionCount: 1 },
        { category: 'Food', amount: 200, transactionCount: 1 },
      ],
      transactions: [
        {
          id: 'transaction-a',
          date: '2026-01-02',
          description: 'Synthetic rent',
          type: 'DEBIT',
          category: 'Housing',
          amount: 400,
          balance: 0,
        },
      ],
    },
    ...overrides,
  }
}

export function goal(overrides = {}) {
  return {
    id: 'goal-a',
    clientId: 'client-a',
    type: 'OTHER',
    name: 'Synthetic emergency fund',
    currentAmount: 250,
    targetAmount: 1000,
    monthlyContribution: 50,
    targetDate: '2027-01-15T12:00:00.000Z',
    createdAt: NOW,
    updatedAt: NOW,
    isCustom: true,
    ...overrides,
  }
}

export function captureDownloads() {
  const blobs = []
  const links = []
  const OriginalURL = globalThis.URL
  vi.stubGlobal('URL', class extends OriginalURL {
    static createObjectURL = vi.fn(blob => {
      blobs.push(blob)
      return `blob:synthetic-${blobs.length}`
    })
    static revokeObjectURL = vi.fn()
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    links.push({
      filename: this.getAttribute('download'),
      href: this.getAttribute('href'),
      attached: document.body.contains(this),
    })
  })
  return {
    blobs,
    links,
    read(index = 0) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blobs[index])
      })
    },
  }
}
