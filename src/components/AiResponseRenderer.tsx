import { useMemo } from 'react'

interface AiResponseRendererProps {
  content: string
  className?: string
}

/**
 * Converts AI-generated text (which may contain markdown) into
 * clean HTML-based UI with bullet points, headings, and structured layout.
 */
export function AiResponseRenderer({ content, className = '' }: AiResponseRendererProps) {
  const sections = useMemo(() => parseAiResponse(content), [content])

  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map((section, idx) => (
        <div key={idx}>
          {section.heading && (
            <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
              {section.icon && <span>{section.icon}</span>}
              {section.heading}
            </h4>
          )}
          {section.items.length > 0 && (
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
                </li>
              ))}
            </ul>
          )}
          {section.paragraphs.length > 0 && (
            <div className="space-y-2">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(p) }} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface Section {
  heading: string | null
  icon: string | null
  items: string[]
  paragraphs: string[]
}

function parseAiResponse(text: string): Section[] {
  const lines = text.split('\n')
  const sections: Section[] = []
  let current: Section = { heading: null, icon: null, items: [], paragraphs: [] }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Markdown headings
    const headingMatch = line.match(/^#{1,4}\s+(.+)$/)
    if (headingMatch) {
      if (current.heading || current.items.length > 0 || current.paragraphs.length > 0) {
        sections.push(current)
      }
      const headingText = headingMatch[1].replace(/\*\*/g, '')
      const icon = extractIcon(headingText)
      current = { heading: stripEmoji(headingText), icon, items: [], paragraphs: [] }
      continue
    }

    // Bold heading lines (e.g. **Section Title**)
    const boldHeadingMatch = line.match(/^\*\*(.+)\*\*:?$/)
    if (boldHeadingMatch && line.length < 80) {
      if (current.heading || current.items.length > 0 || current.paragraphs.length > 0) {
        sections.push(current)
      }
      const headingText = boldHeadingMatch[1]
      const icon = extractIcon(headingText)
      current = { heading: stripEmoji(headingText), icon, items: [], paragraphs: [] }
      continue
    }

    // Bullet points (-, *, numbered)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+[.)]\s+(.+)$/)
    if (bulletMatch) {
      current.items.push(cleanMarkdown(bulletMatch[1]))
      continue
    }

    // Horizontal rules / separators
    if (line.match(/^---+$/)) continue

    // Regular paragraph
    current.paragraphs.push(cleanMarkdown(line))
  }

  if (current.heading || current.items.length > 0 || current.paragraphs.length > 0) {
    sections.push(current)
  }

  return sections.length > 0 ? sections : [{ heading: null, icon: null, items: [], paragraphs: [text] }]
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim()
}

function inlineFormat(text: string): string {
  let result = escapeHtml(text)
  // Re-apply bold
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-medium">$1</strong>')
  // Apply italic
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Numbers with currency symbols: highlight them
  result = result.replace(/([$€£¥₹][\d,]+(?:\.\d+)?)/g, '<strong class="text-foreground font-medium">$1</strong>')
  result = result.replace(/(\d+(?:\.\d+)?%)/g, '<strong class="text-foreground font-medium">$1</strong>')
  return result
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function extractIcon(text: string): string | null {
  const emojiMatch = text.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}⚠️✓✅❌💡🎉👍📊💰🏦📈📉🎯🛡️])/u)
  return emojiMatch ? emojiMatch[1] : null
}

function stripEmoji(text: string): string {
  return text.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}⚠️✓✅❌💡🎉👍📊💰🏦📈📉🎯🛡️]\s*/u, '').trim()
}
