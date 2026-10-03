type Size = 'sm' | 'md' | 'lg' | 'portrait'

const sizes: Record<Size, string> = {
  sm: 'w-7 h-7 text-xs rounded-full',
  md: 'w-9 h-9 text-sm rounded-full',
  lg: 'w-12 h-12 text-base rounded-full',
  portrait: 'w-[72px] h-[88px] text-2xl rounded-xl',
}

type Props = { name: string; color: string; avatarUrl?: string | null; size?: Size }

export function AvatarCircle({ name, color, avatarUrl, size = 'md' }: Props) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        title={name}
        className={`${sizes[size]} object-cover shrink-0 select-none`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center font-bold text-white shrink-0 select-none`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
