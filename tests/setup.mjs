import { afterEach, beforeEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// These shims exist only in the isolated jsdom test environment.
for (const [name, implementation] of Object.entries({
  hasPointerCapture: () => false,
  setPointerCapture: () => {},
  releasePointerCapture: () => {},
  scrollIntoView: () => {},
})) {
  if (!Element.prototype[name]) {
    Object.defineProperty(Element.prototype, name, {
      configurable: true,
      writable: true,
      value: implementation,
    })
  }
}

let networkTripwire

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
  networkTripwire = vi.fn(() => {
    throw new Error('Unexpected fetch: supply an explicit test service double')
  })
  vi.stubGlobal('fetch', networkTripwire)
})

afterEach(() => {
  try {
    cleanup()
    expect(networkTripwire).not.toHaveBeenCalled()
  } finally {
    if (vi.isFakeTimers()) {
      vi.clearAllTimers()
      vi.useRealTimers()
    }
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  }
})
