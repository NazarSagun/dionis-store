import { Skeleton } from '@repo/ui'

// Reserves the space of <TopDeals> while its data loads, so the games grid
// below does not jump down when the slab mounts. The heights match the real
// block: a 92px heading area, then a 40px gap, then the slab. The slab is
// 268px high from the md breakpoint up, and 568px high when it stacks.
export const TopDealsSkeleton = () => (
  <div data-testid='top-deals-skeleton' aria-hidden='true' className='w-full pt-[92px]'>
    <Skeleton className='mt-10 h-[568px] w-full md:h-[268px]' />
  </div>
)
