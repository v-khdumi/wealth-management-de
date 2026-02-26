import { useMemo, type ReactNode } from 'react'

interface AiResponseRendererProps {
  content: string
  className?: string
}

const EMOJI_PATTERN = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}⚠️✓✅❌💡🎉👍📊💰🏦📈📉🎯🛡️])/u
const EMOJI_STRIP_PATTERN = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}⚠️✓✅❌💡🎉👍📊💰🏦📈📉🎯🛡️]\s*/u

/**
 * Converts AI-generated text (which may contain markdown) into
 * clean HTML-based UI with bullet points, headings, and structured layout.
 * Uses React elements (not dangerouslySetInnerHTML) to avoid XSS risks.
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
                  <span>{renderInlineText(item)}</span>
                </li>
              ))}
            </ul>
          )}
          {section.paragraphs.length > 0 && (
            <div className="space-y-2">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">{renderInlineText(p)}</p>
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

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+[.)]\s+(.+)$/)
    if (bulletMatch) {
      current.items.push(cleanMarkdown(bulletMatch[1]))
      continue
    }

    if (line.match(/^---+$/)) continue

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

/**
 * Renders inline text as React elements, highlighting bold text and currency amounts.
 * Uses React elements instead of dangerouslySetInnerHTML to prevent XSS.
 */
function renderInlineText(text: string): ReactNode {
  const parts: ReactNode[] = []
  const tokenPattern = /(\*\*[^*]+\*\*|[$€£¥₹][\d,]+(?:\.\d+)?|\d+(?:\.\d+)?%)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[1]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="text-foreground font-medium">
          {token.slice(2, -2)}
        </strong>
      )
    } else {
      parts.push(
        <strong key={match.index} className="text-foreground font-medium">
          {token}
        </strong>
      )
    }
    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

function extractIcon(text: string): string | null {
  const emojiMatch = text.match(EMOJI_PATTERN)
  return emojiMatch ? emojiMatch[1] : null
}

function stripEmoji(text: string): string {
  return text.replace(EMOJI_STRIP_PATTERN, '').trim()
}
