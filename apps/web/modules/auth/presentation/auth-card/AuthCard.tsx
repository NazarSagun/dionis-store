import { ReactNode } from 'react'

interface AuthCardProps {
  eyebrow?: ReactNode
  title: string
  description?: string
  children: ReactNode
  testId?: string
}

// The centered card of the forgot-password and reset-password pages.
export const AuthCard = ({ eyebrow, title, description, children, testId }: AuthCardProps) => (
  <section className='flex min-h-[75vh] justify-center px-4 py-8 sm:items-center'>
    <div
      data-testid={testId}
      className='flex h-fit w-full max-w-[420px] flex-col gap-5 rounded-md border border-ink bg-panel-alt p-6 sm:p-8'
    >
      <div className='flex flex-col gap-2'>
        {eyebrow && <p className='font-sans text-xs font-semibold uppercase tracking-wide'>{eyebrow}</p>}
        <h1 className='font-display text-2xl font-bold leading-tight text-foreground sm:text-[28px]'>{title}</h1>
        {description && <p className='font-sans text-[15px] leading-snug text-muted-foreground'>{description}</p>}
      </div>
      {children}
    </div>
  </section>
)

export const authLinkStyles = 'py-2 font-sans text-sm font-semibold text-foreground underline hover:text-neon-cyan'
