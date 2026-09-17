import { cn } from '../lib/utils'

export interface LoaderProps {
  className?: string
}

export const Loader = ({ className }: LoaderProps) => {
  return (
    <div
      data-testid='loader'
      className={cn('h-12 w-12 rounded-full border-4 border-foreground border-b-transparent animate-spin', className)}
    />
  )
}
