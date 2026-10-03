type Variant = 'primary' | 'secondary' | 'quiet' | 'danger-quiet'

const VARIANT: Record<Variant, string> = {
  primary: 'font-display font-semibold rounded-full px-4 py-2 text-sm bg-navy text-gold shadow-[0_3px_0_var(--color-gold)] hover:brightness-125 active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-gold)] disabled:active:translate-y-0',
  secondary: 'font-display font-semibold rounded-full px-4 py-2 text-sm bg-white text-navy border-[1.5px] border-navy hover:bg-navy/5',
  quiet: 'font-ticket text-[11px] uppercase tracking-wider text-navy/70 underline decoration-navy/30 underline-offset-4 hover:text-navy hover:decoration-navy py-1',
  'danger-quiet': 'font-ticket text-[11px] uppercase tracking-wider text-[#B4361A] underline decoration-[#B4361A]/40 underline-offset-4 hover:decoration-[#B4361A] py-1',
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function BrandButton({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
