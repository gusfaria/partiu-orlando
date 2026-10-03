const MRZ_LENGTH = 44

// Decorative passport machine-readable line: P<BRA<NAME><<ORLANDO<2026<<<…
export function mrzLine(name: string): string {
  const clean = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]+/g, '<')
    .replace(/^<+|<+$/g, '')
  return `P<BRA${clean}<<ORLANDO<2026`.padEnd(MRZ_LENGTH, '<').slice(0, MRZ_LENGTH)
}
