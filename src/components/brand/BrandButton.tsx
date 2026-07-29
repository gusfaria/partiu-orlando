type Variant = 'primary' | 'secondary'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-gold text-navy hover:brightness-105 shadow-[0_4px_0_rgba(26,37,54,0.25)] active:translate-y-0.5 active:shadow-[0_2px_0_rgba(26,37,54,0.25)]',
  secondary: 'bg-transparent text-navy border-2 border-navy hover:bg-navy hover:text-cream',
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function BrandButton({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`font-display font-semibold rounded-full px-5 py-2.5 transition-all disabled:opacity-50 disabled:active:translate-y-0 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
