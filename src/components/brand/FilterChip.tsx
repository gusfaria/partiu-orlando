type Props = { label: string; active: boolean; dotClass?: string; onClick: () => void }

export function FilterChip({ label, active, dotClass, onClick }: Props) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-ticket text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        active ? 'bg-navy text-gold border-navy' : 'bg-transparent text-navy border-navy/25 hover:border-navy/50'
      }`}>
      {dotClass && <span aria-hidden="true" className={`w-2 h-2 rounded-full ${dotClass}`} />}
      {label}
    </button>
  )
}
