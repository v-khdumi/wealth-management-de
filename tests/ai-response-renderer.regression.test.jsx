import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AiResponseRenderer } from '../src/components/AiResponseRenderer'

describe('AI response rendering characterization', () => {
  it('renders heading variants, emoji icons and all supported list markers', () => {
    const content = [
      '# 📊 **Overview**',
      '- First',
      '* Second',
      '• Third',
      '1. Fourth',
      '2) Fifth',
      '---',
      '**Next steps**:',
      'Plain paragraph',
    ].join('\n')
    const { container } = render(<AiResponseRenderer content={content} className="consumer-class" />)
    expect(screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent)).toEqual([
      '📊Overview', 'Next steps',
    ])
    expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual([
      'First', 'Second', 'Third', 'Fourth', 'Fifth',
    ])
    expect(screen.getByText('Plain paragraph')).toBeTruthy()
    expect(container.textContent).not.toContain('---')
    expect(container.firstElementChild.classList.contains('consumer-class')).toBe(true)
  })

  it('cleans inline markdown and highlights amounts and percentages', () => {
    const { container } = render(<AiResponseRenderer content={'Plan **carefully** with *care* and `cash` using [guide](https://example.invalid/guide).\nSave $1,250.50 €20 £30 ¥40 ₹50 at 12.5%.'} />)
    expect(container.textContent).toContain('Plan carefully with care and cash using guide.')
    expect([...container.querySelectorAll('strong')].map(node => node.textContent)).toEqual([
      '$1,250.50', '€20', '£30', '¥40', '₹50', '12.5%',
    ])
    expect(container.querySelector('a')).toBeNull()
    expect(container.querySelector('em')).toBeNull()
    expect(container.querySelector('code')).toBeNull()
  })

  it('characterizes list-before-paragraph grouping inside a section', () => {
    const { container } = render(<AiResponseRenderer content={'Intro\n- One\nMiddle\n- Two\nEnd'} />)
    expect(container.textContent).toBe('OneTwoIntroMiddleEnd')
    expect([...container.querySelectorAll('p')].map(p => p.textContent)).toEqual(['Intro', 'Middle', 'End'])
  })

  it('treats bold-only lines of length 80 or more as paragraphs', () => {
    const longText = 'x'.repeat(76)
    const { container } = render(<AiResponseRenderer content={`**${longText}**`} />)
    expect(screen.queryByRole('heading')).toBeNull()
    expect(container.querySelector('p').textContent).toBe(longText)
  })

  it('handles empty responses and recomputes content on rerender', () => {
    const { container, rerender } = render(<AiResponseRenderer content="" />)
    expect(container.textContent).toBe('')
    expect(container.querySelectorAll('p')).toHaveLength(1)
    rerender(<AiResponseRenderer content={'## Replacement\n- Updated'} />)
    expect(screen.getByRole('heading', { name: 'Replacement' })).toBeTruthy()
    expect(screen.getByRole('listitem').textContent).toBe('Updated')
  })
})

describe('untrusted response safety regression', () => {
  it('renders HTML-looking input as text rather than executable DOM', () => {
    const payload = '<img src=x onerror=alert(1)><script>alert(2)</script><iframe src=https://example.invalid></iframe>'
    const { container } = render(<AiResponseRenderer content={`## ${payload}\n- ${payload}\n${payload}`} />)
    expect(container.querySelector('img, script, iframe')).toBeNull()
    expect(container.querySelector('[onerror], [onclick]')).toBeNull()
    expect(container.querySelector('h4').textContent).toBe(payload)
    expect(container.querySelector('li').textContent).toBe(payload)
    expect(container.querySelector('p').textContent).toBe(payload)
  })

  it('does not turn markdown URLs into active navigation', () => {
    const { container } = render(<AiResponseRenderer content={'[unsafe](javascript:alert) and [external](https://example.invalid)'} />)
    expect(container.textContent).toBe('unsafe and external')
    expect(container.querySelector('a, [href]')).toBeNull()
  })
})
