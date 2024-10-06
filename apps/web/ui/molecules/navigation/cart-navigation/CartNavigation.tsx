import classes from './CartNavigation.module.css'
import clsx from 'clsx'
import { useThemeState } from '@/providers/theme'
import Image from 'next/image'
import Link from 'next/link'
import { Dispatch, Fragment } from 'react'
import { ActionType } from '@/providers/store/types'
import { CartActionType } from '@/providers/store/actions'

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
  onStepClick: Dispatch<ActionType>
}) => {
  const { state } = useThemeState()

  const navContainer = clsx(classes.navContainer, state.mode === 'light' ? classes.light : null)

  return (
    <nav className={navContainer}>
      <div className={classes.logo}>
        <Link href='/'>
          <span>Dionis</span>
          <Image priority={true} width={40} height={40} alt='logo' src={`/icons/logo.png`} />
        </Link>
      </div>
      <div className={classes.steps}>
        {steps.map((item) => {
          const step = clsx(
            classes.step,
            activeStep > item.number && classes.clickableStep,
            activeStep === item.number ? classes.active : null
          )
          const stepNumber = clsx(classes.stepNumber, activeStep === item.number ? classes.active : null)
          const stepLine = clsx(classes.stepLine, activeStep === item.number ? classes.active : null)
          return (
            <Fragment key={item.number}>
              <div
                onClick={() => onStepClick({ type: CartActionType.SET_STEP, payload: { step: item.number } })}
                className={step}
                aria-label={`${activeStep === item.number ? 'active' : 'inactive'} step`}
                data-testid='cart-navigation-step'
              >
                <span className={stepLine}></span>
                <span className={stepNumber}>{item.number}</span>
                <span>{item.title}</span>
              </div>
            </Fragment>
          )
        })}
      </div>
      <div className={classes.rightSection}>
        <Image priority={true} width={32} height={32} alt='logo' src={`/icons/lock.svg`} />
        <div className={classes.securePayment}>
          <span>Secure payment</span>
          <span>256-bit SSL Secured</span>
        </div>
      </div>
    </nav>
  )
}
