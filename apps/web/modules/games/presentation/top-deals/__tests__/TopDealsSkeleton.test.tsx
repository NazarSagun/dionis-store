import { describe, expect, it } from 'vitest'

import { render } from '@/test-utils/utils'

import { TopDealsSkeleton } from '../TopDealsSkeleton'

describe('<TopDealsSkeleton />', () => {
  it('reserves the space of the top deals slab and hides itself from assistive technology', () => {
    const { getByTestId } = render(<TopDealsSkeleton />)

    const skeleton = getByTestId('top-deals-skeleton')
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    expect(skeleton.firstElementChild).toHaveClass('h-[568px]', 'md:h-[268px]')
  })
})
