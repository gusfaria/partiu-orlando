type Props = { label: string; children: React.ReactNode }

// Outlined card for navy backgrounds: mono gold label + hairline, cream body.
export function NavyCard({ label, children }: Props) {
  return (
    <section className="rounded-2xl border border-gold/35 bg-white/[0.03] px-4 py-3">
      <h2 className="flex items-center gap-2 font-ticket text-[10px] uppercase tracking-widest text-gold">
        {label}
        <span aria-hidden="true" className="flex-1 h-px bg-gold/25" />
      </h2>
      <div className="mt-2 text-sm text-cream/85">{children}</div>
    </section>
  )
}
