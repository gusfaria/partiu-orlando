// Decorative cut-paper layer: gold sunburst, starbursts, palm silhouette.
// Absolutely positioned, non-interactive, hidden from a11y tree.
export function SunburstBg() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* gold sunburst, top-right */}
      <svg className="absolute -top-16 -right-16 w-64 h-64 opacity-20" viewBox="0 0 100 100">
        <g fill="var(--color-gold)">
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x="49" y="0" width="2" height="50"
              transform={`rotate(${i * 22.5} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="8" />
        </g>
      </svg>
      {/* starbursts */}
      <svg className="absolute top-1/3 left-6 w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="var(--color-pink)">
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
      </svg>
      <svg className="absolute bottom-24 right-10 w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="var(--color-teal)">
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
      </svg>
      {/* palm silhouette, bottom-left */}
      <svg className="absolute -bottom-4 -left-4 w-40 h-40 opacity-15" viewBox="0 0 100 100" fill="var(--color-teal)">
        <path d="M50 100 C48 70 48 55 50 45 C52 55 52 70 50 100 Z" />
        <path d="M50 45 C40 30 25 28 15 34 C28 30 40 36 50 45 Z" />
        <path d="M50 45 C60 30 75 28 85 34 C72 30 60 36 50 45 Z" />
        <path d="M50 45 C42 28 42 15 48 6 C46 18 50 34 50 45 Z" />
      </svg>
    </div>
  )
}
