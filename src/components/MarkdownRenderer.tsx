import ReactMarkdown from 'react-markdown'

type Props = { content: string }

export function MarkdownRenderer({ content }: Props) {
  if (!content.trim()) return null
  return (
    <div className="prose prose-gray max-w-none
      prose-headings:font-bold prose-headings:font-display prose-a:text-navy prose-a:underline prose-a:decoration-gold prose-a:decoration-2">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
