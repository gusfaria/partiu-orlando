type Props = { className?: string; children: React.ReactNode }

// Arch/stamp badge: navy fill, thick cream border, inner dashed ring.
export function ScallopedBadge({ className = '', children }: Props) {
  return (
    <div className={`relative inline-block bg-navy text-cream rounded-[2.5rem] rounded-b-3xl border-4 border-cream shadow-[0_6px_0_rgba(26,37,54,0.25)] ${className}`}>
      <div className="m-2 rounded-[2rem] rounded-b-2xl border border-dashed border-cream/40 px-8 py-6 text-center">
        {children}
      </div>
    </div>
  )
}
