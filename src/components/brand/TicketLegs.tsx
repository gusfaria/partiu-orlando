import { META_LABEL_CLASS } from './styles'

export type Leg = { label: string; value: string | null; sub?: string | null }

const COLS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }

// Equal cells split by dashed dividers, like the legs of a boarding pass.
export function TicketLegs({ legs }: { legs: Leg[] }) {
  return (
    <div className={`grid ${COLS[legs.length] ?? 'grid-cols-3'} border-t border-dashed border-navy/20 divide-x divide-dashed divide-navy/20`}>
      {legs.map(leg => (
        <div key={leg.label} className="min-w-0 px-4 py-2.5">
          <p className={META_LABEL_CLASS}>{leg.label}</p>
          {leg.value ? (
            <>
              <p className="truncate font-display text-lg font-semibold leading-tight text-navy">{leg.value}</p>
              {leg.sub && <p className="font-ticket text-[11px] text-navy/70">{leg.sub}</p>}
            </>
          ) : (
            <p className="font-display text-lg leading-tight text-navy/30">—</p>
          )}
        </div>
      ))}
    </div>
  )
}
