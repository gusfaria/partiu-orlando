import ReactMarkdown from 'react-markdown'

type Props = { content: string }

export function MarkdownRenderer({ content }: Props) {
  if (!content.trim()) return null
  return (
    <div className="prose prose-gray max-w-none
      prose-headings:font-bold prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
