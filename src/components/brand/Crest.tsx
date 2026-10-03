type Props = { tagline?: string }

// Gold-ringed 🏰 seal + title + mono names rule. Used on home and login (on navy).
export function Crest({ tagline }: Props) {
  return (
    <div className="text-center">
      <div aria-hidden="true"
        className="mx-auto grid place-items-center w-[84px] h-[84px] rounded-full border-2 border-gold outline-1 outline-dashed outline-gold/50 -outline-offset-8 text-4xl">
        🏰
      </div>
      <h1 className="mt-3 font-display text-4xl font-bold leading-none text-cream">Partiu Orlando</h1>
      <p className="mt-2.5 flex items-center justify-center gap-2.5 font-ticket text-[10px] tracking-[0.3em] text-gold">
        <span aria-hidden="true" className="w-7 h-px bg-gold" />
        GUSTAVO · PHILIPE
        <span aria-hidden="true" className="w-7 h-px bg-gold" />
      </p>
      {tagline && <p className="mt-1.5 font-ticket text-[10px] tracking-widest text-cream/60">{tagline}</p>}
    </div>
  )
}
