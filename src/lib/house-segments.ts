// Parses house markdown into ordered segments, splitting on placement markers
// that the admin can put anywhere in the content:
//   [mapa] / [map]      → the Google Maps embed
//   [fotos] / [photos]  → the photo carousel
// Everything else is markdown. If no [fotos] marker exists, the carousel is
// appended at the end so photos always show.

export type HouseSegment =
  | { type: 'md'; text: string }
  | { type: 'map' }
  | { type: 'photos' }

const MARKERS: Record<string, 'map' | 'photos'> = {
  '[mapa]': 'map',
  '[map]': 'map',
  '[fotos]': 'photos',
  '[photos]': 'photos',
}

export function parseHouseSegments(content: string): HouseSegment[] {
  const segments: HouseSegment[] = []
  let buffer: string[] = []

  const flush = () => {
    const text = buffer.join('\n').trim()
    if (text) segments.push({ type: 'md', text })
    buffer = []
  }

  for (const line of content.split('\n')) {
    const marker = MARKERS[line.trim().toLowerCase()]
    if (marker) {
      flush()
      segments.push({ type: marker })
    } else {
      buffer.push(line)
    }
  }
  flush()

  if (!segments.some(s => s.type === 'photos')) segments.push({ type: 'photos' })
  return segments
}
