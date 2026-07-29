type Accent = 'gold' | 'coral' | 'teal' | 'pink'

const DOT: Record<Accent, string> = {
  gold: 'bg-gold', coral: 'bg-coral', teal: 'bg-teal', pink: 'bg-pink',
}

type Props = {
  label?: string
  accent?: Accent
  className?: string
  children: React.ReactNode
}

export function TicketCard({ label, accent = 'gold', className = '', children }: Props) {
  return (
    <div className={`relative bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] ${className}`}>
      {label && (
        <div className="font-ticket text-xs uppercase tracking-widest text-navy/60 px-4 py-2 border-b border-dashed border-navy/20 flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${DOT[accent]}`} />
          {label}
        </div>
      )}
      <div className="p-4">{children}</div>
      <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cream" aria-hidden="true" />
      <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cream" aria-hidden="true" />
    </div>
  )
}
