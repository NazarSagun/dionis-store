import * as React from 'react'

import { cn } from '@/lib/utils'
import { ChangeEvent, useState } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onInputChange(e: string): void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, name, onInputChange, ...props }, ref) => {
    const [value, setValue] = useState('')

    const inputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value
      onInputChange && onInputChange(value)
      setValue(value)
    }
    return (
      <input
        onChange={inputChangeHandler}
        id={name}
        type={type}
        value={value}
        data-testid='input'
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
