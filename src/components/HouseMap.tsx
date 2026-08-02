// Keyless Google Maps embed for the trip house (Solara Resort).
// Uses the maps.google.com/maps?output=embed endpoint (no API key needed).
const MAP_QUERY = '8923 Coconut Breeze Dr, Kissimmee, FL 34747'

export function HouseMap() {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=15&output=embed`
  return (
    <div className="rounded-2xl overflow-hidden border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)]">
      <iframe
        title="Mapa da casa"
        src={src}
        className="w-full h-56 md:h-64 block"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  )
}
