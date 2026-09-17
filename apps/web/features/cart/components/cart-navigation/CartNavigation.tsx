import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'

const steps = [
  {
    number: 1,
    title: 'Shopping cart',
  },
  {
    number: 2,
    title: 'Payment',
  },
  {
    number: 3,
    title: 'Game activation',
  },
]

export const CartNavigation = ({
  activeStep,
  onStepClick,
}: {
  activeStep: number
  onStepClick: (step: number) => void
}) => {
  return (
    <nav className='flex h-[10vh] items-center justify-between bg-muted px-[35px]'>
      <div>
        <Link href='/' className='flex items-center'>
          <span className='mr-2.5 cursor-default font-mono text-xl font-semibold text-foreground hover:cursor-pointer'>
            Dionis
          </span>
          <Image priority={true} width={40} height={40} alt='logo' src={`/icons/logo.png`} />
        </Link>
      </div>
      <div className='flex items-center'>
        {steps.map((item, index) => {
          const isActive = activeStep === item.number
          return (
            <Fragment key={item.number}>
              <div
                onClick={() => onStepClick(item.number)}
                className={cn(
                  'flex items-center opacity-50 pointer-events-none',
                  activeStep > item.number && 'pointer-events-auto cursor-pointer',
                  isActive && 'opacity-100'
                )}
                aria-label={`${isActive ? 'active' : 'inactive'} step`}
                data-testid='cart-navigation-step'
              >
                {index !== 0 && (
                  <span className={cn('ml-4 h-0.5 w-[4vw] bg-foreground', isActive && 'bg-[var(--success-color)]')} />
                )}
                <span
                  className={cn(
                    'mr-4 flex h-5 w-5 items-center justify-center rounded-full border-[3px] border-white p-[0.7rem] text-base text-white',
                    isActive && 'border-[var(--success-color)]'
                  )}
                >
                  {item.number}
                </span>
                <span className='text-base text-foreground'>{item.title}</span>
              </div>
            </Fragment>
          )
        })}
      </div>
      <div className='flex items-center gap-[1.2rem]'>
        <Image priority={true} width={32} height={32} alt='logo' src={`/icons/lock.svg`} />
        <div className="relative flex flex-col justify-start after:absolute after:left-[-0.8rem] after:top-1/2 after:h-[2.3rem] after:w-px after:-translate-y-1/2 after:bg-white/[0.137] after:content-['']">
          <span className='text-base text-white'>Secure payment</span>
          <span className='text-xs text-[#666]'>256-bit SSL Secured</span>
        </div>
      </div>
    </nav>
  )
}
