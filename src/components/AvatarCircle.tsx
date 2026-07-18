type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

type Props = { name: string; color: string; size?: Size }

export function AvatarCircle({ name, color, size = 'md' }: Props) {
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
