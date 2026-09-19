import { cn } from '../lib/utils'

export interface SkeletonProps {
  className?: string
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      data-testid='skeleton'
      className={cn(
        'h-4 w-full animate-shimmer rounded-md bg-gradient-to-r from-panel-alt via-white/10 to-panel-alt bg-[length:200%_100%]',
        className,
      )}
    />
  )
}
