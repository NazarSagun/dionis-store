import { useState } from 'react'
import classes from './CartNavigation.module.css'
import clsx from 'clsx'
import { useThemeState } from '@/providers/theme'
import Image from 'next/image'

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

export const CartNavigation = () => {
  const [activeStep, setActiveStep] = useState(1)
  const { state } = useThemeState()

  const navContainer = clsx(classes.navContainer, state.mode === 'light' ? classes.light : null)

  return (
    <div className={navContainer}>
      <div className={classes.logo}>
        <span>Dionis</span>
        <Image
          priority={true}
          width={40}
          height={40}
          alt='logo'
          src={`/icons/logo.png`}
        />
      </div>
      <div className={classes.steps}>
        {steps.map((item) => {
          const step = clsx(classes.step, activeStep === item.number ? classes.active : null)
          const stepNumber = clsx(classes.stepNumber, activeStep === item.number ? classes.active : null)
          const stepLine = clsx(classes.stepLine, activeStep === item.number ? classes.active : null)
          return (
            <>
              <div
                onClick={() => setActiveStep(item.number)}
                key={item.number}
                className={step}
              >
                <span className={stepLine}></span>
                <span className={stepNumber}>{item.number}</span>
                <span>{item.title}</span>
              </div>
            </>
          )
        })}
      </div>
      <div className={classes.rightSection}>
        <Image
          priority={true}
          width={32}
          height={32}
          alt='logo'
          src={`/icons/lock.svg`}
        />
        <div className={classes.securePayment}>
          <span>Secure payment</span>
          <span>256-bit SSL Secured</span>
        </div>
      </div>
    </div>
  )
}
