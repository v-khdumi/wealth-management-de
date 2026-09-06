import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BankStatementUpload } from '../src/components/BankStatementUpload'
import { deferred, statement } from './support/harness.mjs'

const boundary = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: boundary.success, error: boundary.error } }))
vi.mock('@/lib/currency-context', () => ({ useGlobalCurrency: () => ({ currency: 'USD', symbol: '$' }) }))
vi.mock('@/lib/currency-utils', () => ({
  CURRENCY_DATABASE: { USD: { symbol: '$', name: 'US Dollar' } },
  detectUniqueCurrencies: () => [],
  getExchangeRates: () => { throw new Error('Rates are outside this upload slice') },
  convertCurrency: () => { throw new Error('Conversion is outside this upload slice') },
  getCurrencySymbol: () => '$',
  getCurrencyName: () => 'US Dollar',
  formatCurrencyWithCode: amount => `$${amount}`,
}))
vi.mock('@/lib/azure-openai', () => ({
  callLLM: () => { throw new Error('LLM calls are outside this upload slice') },
}))

function mount(onUpload = vi.fn().mockResolvedValue(undefined), extra = {}) {
  const view = render(<BankStatementUpload statements={[]} onUpload={onUpload} {...extra} />)
  const input = view.container.querySelector('input[type="file"]')
  expect(input).not.toBeNull()
  return { ...view, input, onUpload }
}

function file(name, type, size = 20) {
  const result = new File(['Synthetic test data only'], name, { type })
  // Avoid allocating large buffers merely to exercise the metadata boundary.
  Object.defineProperty(result, 'size', { value: size })
  return result
}

async function select(input, files) {
  await act(async () => {
    fireEvent.change(input, { target: { files } })
  })
}

describe('statement upload characterization', () => {
  it('keeps the advertised file-picker types and ignores an empty selection', async () => {
    const { input, onUpload } = mount()
    expect(input.accept).toBe('.pdf,.csv,.txt,.tsv,image/*')
    await select(input, [])
    expect(onUpload).not.toHaveBeenCalled()
    expect(boundary.error).not.toHaveBeenCalled()
    expect(boundary.success).not.toHaveBeenCalled()
  })

  it.each([
    ['statement.pdf', 'application/pdf'],
    ['statement.png', 'image/png'],
    ['statement.csv', 'text/csv'],
    ['statement.txt', 'text/plain'],
    ['statement.CSV', ''],
    ['statement.TSV', 'application/octet-stream'],
    ['statement.TXT', ''],
  ])('passes accepted file %s unchanged to the upload callback', async (name, type) => {
    const { input, onUpload } = mount()
    const selected = file(name, type)
    await select(input, [selected])
    expect(onUpload).toHaveBeenCalledExactlyOnceWith(selected)
    expect(boundary.success).toHaveBeenCalledWith('Statement uploaded successfully', {
      description: 'AI is now processing your statement',
    })
    expect(input.value).toBe('')
    expect(screen.queryByText('Uploading...')).toBeNull()
  })

  it.each([
    ['program.exe', 'application/octet-stream'],
    ['statement.pdf', ''],
  ])('rejects %s with MIME %s under the current acceptance rule', async (name, type) => {
    const { input, onUpload } = mount()
    await select(input, [file(name, type)])
    expect(onUpload).not.toHaveBeenCalled()
    expect(boundary.error).toHaveBeenCalledWith('Invalid file type', {
      description: 'Please upload a PDF, CSV, or image file',
    })
  })

  it.each([
    [10 * 1024 * 1024, true],
    [10 * 1024 * 1024 + 1, false],
  ])('handles the exact byte-size boundary %i', async (size, accepted) => {
    const { input, onUpload } = mount()
    const selected = file('statement.pdf', 'application/pdf', size)
    await select(input, [selected])
    if (accepted) {
      expect(onUpload).toHaveBeenCalledExactlyOnceWith(selected)
      expect(boundary.error).not.toHaveBeenCalled()
    } else {
      expect(onUpload).not.toHaveBeenCalled()
      expect(boundary.error).toHaveBeenCalledWith('File too large', { description: 'Maximum file size is 10MB' })
    }
  })

  it('uploads only the first selected file', async () => {
    const { input, onUpload } = mount()
    const first = file('first.csv', 'text/csv')
    await select(input, [first, file('second.csv', 'text/csv')])
    expect(onUpload).toHaveBeenCalledExactlyOnceWith(first)
  })

  it('shows pending feedback until the callback settles', async () => {
    const pending = deferred()
    const { input, onUpload } = mount(vi.fn(() => pending.promise))
    fireEvent.change(input, { target: { files: [file('statement.csv', 'text/csv')] } })
    expect(screen.getByText('Uploading...')).toBeTruthy()
    expect(boundary.success).not.toHaveBeenCalled()
    await act(async () => { pending.resolve() })
    expect(onUpload).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Uploading...')).toBeNull()
    expect(boundary.success).toHaveBeenCalledTimes(1)
  })

  it('reports rejection and permits a later retry', async () => {
    const onUpload = vi.fn().mockRejectedValueOnce(new Error('Synthetic failure')).mockResolvedValueOnce(undefined)
    const { input } = mount(onUpload)
    const selected = file('statement.csv', 'text/csv')
    await select(input, [selected])
    expect(boundary.error).toHaveBeenCalledWith('Upload failed', { description: 'Please try again' })
    expect(boundary.success).not.toHaveBeenCalled()
    expect(screen.queryByText('Uploading...')).toBeNull()
    await select(input, [selected])
    expect(onUpload).toHaveBeenCalledTimes(2)
    expect(boundary.success).toHaveBeenCalledTimes(1)
  })

  it('does not delete until the user confirms the destructive action', () => {
    const onDelete = vi.fn()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    mount(undefined, {
      statements: [statement({ status: 'FAILED', extractedData: undefined, errorMessage: 'Synthetic extraction failure' })],
      onDelete,
    })
    expect(screen.getByText('Synthetic extraction failure')).toBeTruthy()
    fireEvent.click(screen.getByTitle('Delete statement'))
    expect(onDelete).not.toHaveBeenCalled()
    expect(boundary.success).not.toHaveBeenCalled()
    expect(confirm).toHaveBeenCalledWith('Are you sure you want to delete "synthetic-usd.csv"? This action cannot be undone.')
    fireEvent.click(screen.getByTitle('Delete statement'))
    expect(onDelete).toHaveBeenCalledExactlyOnceWith('statement-usd')
    expect(boundary.success).toHaveBeenCalledWith('Statement deleted', {
      description: 'synthetic-usd.csv has been removed',
    })
  })

  it('omits deletion controls when no deletion capability is supplied', () => {
    mount(undefined, { statements: [statement({ status: 'PROCESSING', extractedData: undefined })] })
    expect(screen.queryByTitle('Delete statement')).toBeNull()
    expect(screen.getByText('PROCESSING')).toBeTruthy()
  })
})
