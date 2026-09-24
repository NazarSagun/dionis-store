'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthUser, useIsAuthenticated } from '@/modules/auth/core/facade'
import { WishlistSection } from '@/modules/wishlist/presentation/wishlist-section/WishlistSection'

import { LibrarySection } from '../library-section/LibrarySection'
import { OrderHistorySection } from '../order-history-section/OrderHistorySection'
import { RecentlyViewedSection } from '../recently-viewed-section/RecentlyViewedSection'
import { SettingsSection } from '../settings-section/SettingsSection'

const tabStyles =
  'rounded-md border border-ink px-6 py-3 font-display text-xs shadow-retro-sm transition-transform duration-200 active:scale-95'
const activeTabStyles = 'bg-neon-magenta text-primary-foreground'
const inactiveTabStyles = 'bg-panel-alt text-neon-cyan'

const TABS = [
  { testId: 'account-tab-library', label: 'My Games', anchor: 'account-library' },
  { testId: 'account-tab-wishlist', label: 'Wishlist', anchor: 'wishlist' },
  { testId: 'account-tab-order-history', label: 'Order History', anchor: 'account-order-history' },
  { testId: 'account-tab-settings', label: 'Settings', anchor: 'account-settings' },
] as const

export const AccountPage = () => {
  const isAuthenticated = useIsAuthenticated()
  const user = useAuthUser()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const scrollToSection = (anchor: string) => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div data-testid='account-page' className='flex w-full flex-col items-center px-[35px] pb-20'>
      <div className='flex w-full max-w-[1200px] flex-col items-center gap-2 pt-16'>
        <span className='rounded-full border border-ink px-4 py-1 font-mono text-xs text-neon-cyan'>
          Player account
        </span>
        {user && <h1 className='font-display text-xl text-foreground'>Hi, {user.name}</h1>}
      </div>

      <div className='flex flex-wrap justify-center gap-4 pt-10'>
        {TABS.map((tab) => (
          <button
            key={tab.testId}
            type='button'
            data-testid={tab.testId}
            onClick={() => scrollToSection(tab.anchor)}
            className={`${tabStyles} ${tab.anchor === 'account-library' ? activeTabStyles : inactiveTabStyles}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id='account-library' className='w-full max-w-[1200px]'>
        <LibrarySection />
      </div>
      <div id='wishlist' className='w-full max-w-[1200px]'>
        <WishlistSection />
      </div>
      <div id='account-order-history' className='w-full max-w-[1200px]'>
        <OrderHistorySection />
      </div>
      <div id='account-settings' className='w-full max-w-[1200px]'>
        <SettingsSection />
      </div>
      <div className='w-full max-w-[1200px]'>
        <RecentlyViewedSection />
      </div>
    </div>
  )
}
