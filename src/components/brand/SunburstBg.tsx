// Decorative "it's a small world" cut-paper layer: smiley sun, coaster loop,
// castle spires, paper plane, sparkles, palm. Inline SVG, non-interactive,
// hidden from the a11y tree. Sits behind content on the navy backdrop.
export function SunburstBg() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* smiley sun, top-right */}
      <svg className="absolute -top-10 -right-10 w-52 h-52 opacity-30" viewBox="0 0 100 100">
        <g fill="var(--color-gold)">
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x="48.5" y="2" width="3" height="18" rx="1.5"
              transform={`rotate(${i * 22.5} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="26" />
        </g>
        <g fill="var(--color-navy)">
          <circle cx="42" cy="46" r="2.6" />
          <circle cx="58" cy="46" r="2.6" />
        </g>
        <path d="M40 56 Q50 66 60 56" stroke="var(--color-navy)" strokeWidth="3"
          fill="none" strokeLinecap="round" />
      </svg>

      {/* roller-coaster loop line, upper-left */}
      <svg className="absolute top-16 -left-8 w-64 h-24 opacity-25" viewBox="0 0 200 70" fill="none">
        <path d="M0 60 C30 60 40 10 70 30 C90 43 78 60 66 48 C56 38 70 30 84 42 C104 60 150 20 200 24"
          stroke="var(--color-teal)" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* paper plane, mid-right */}
      <svg className="absolute top-1/3 right-8 w-12 h-12 opacity-30" viewBox="0 0 24 24">
        <path d="M2 12 L22 3 L15 22 L12 14 Z" fill="var(--color-cream)" />
        <path d="M12 14 L22 3 L12 12 Z" fill="var(--color-pink)" />
      </svg>

      {/* sparkles */}
      <svg className="absolute top-1/4 left-1/3 w-6 h-6 opacity-50" viewBox="0 0 24 24" fill="var(--color-gold)">
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
      </svg>
      <svg className="absolute bottom-1/3 right-1/4 w-5 h-5 opacity-50" viewBox="0 0 24 24" fill="var(--color-pink)">
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
      </svg>
      <svg className="absolute top-1/2 left-10 w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="var(--color-teal)">
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
      </svg>

      {/* palm, bottom-left */}
      <svg className="absolute -bottom-2 left-2 w-32 h-32 opacity-25" viewBox="0 0 100 100" fill="var(--color-teal)">
        <path d="M50 100 C48 70 48 55 50 45 C52 55 52 70 50 100 Z" />
        <path d="M50 45 C40 30 25 28 15 34 C28 30 40 36 50 45 Z" />
        <path d="M50 45 C60 30 75 28 85 34 C72 30 60 36 50 45 Z" />
        <path d="M50 45 C42 28 42 15 48 6 C46 18 50 34 50 45 Z" />
      </svg>

      {/* castle spires silhouette, bottom band */}
      <svg className="absolute bottom-0 inset-x-0 w-full h-28 opacity-20" viewBox="0 0 300 80" preserveAspectRatio="none">
        <g>
          <polygon points="30,80 30,40 40,22 50,40 50,80" fill="var(--color-coral)" />
          <polygon points="70,80 70,50 82,28 94,50 94,80" fill="var(--color-gold)" />
          <polygon points="120,80 120,34 135,10 150,34 150,80" fill="var(--color-teal)" />
          <polygon points="175,80 175,50 187,28 199,50 199,80" fill="var(--color-pink)" />
          <polygon points="225,80 225,42 236,22 247,42 247,80" fill="var(--color-gold)" />
          <polygon points="265,80 265,48 276,28 287,48 287,80" fill="var(--color-coral)" />
        </g>
      </svg>
    </div>
  )
}
