type Props = { title: string; eyebrow?: string }

// Mono eyebrow over a Fredoka title, with a gold rule running to the right.
export function PageHeader({ title, eyebrow }: Props) {
  return (
    <header className="mb-6">
      {eyebrow && (
        <p className="font-ticket text-[10px] uppercase tracking-[0.25em] text-navy/70">{eyebrow}</p>
      )}
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
        <span aria-hidden="true" className="flex-1 h-0.5 rounded-full bg-gold translate-y-0.5" />
      </div>
    </header>
  )
}
