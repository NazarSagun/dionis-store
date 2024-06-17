'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, duration, ...props }, ref) => {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    if (progress >= 100) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + 1
        if (nextProgress >= 100) {
          clearInterval(interval)
        }
        return nextProgress
      })
    }, duration / 100)

    return () => clearInterval(interval)
  }, [progress, duration])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#343434',
      }}
    >
      <ProgressPrimitive.Root
        ref={ref}
        className={cn('relative h-3 w-1/3 overflow-hidden rounded-full bg-primary/20', className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className='h-full w-full flex-1 bg-secondary transition-all'
          style={{ transform: `translateX(-${100 - (progress || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
