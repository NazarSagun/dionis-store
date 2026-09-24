'use client'

import { useEffect, useState } from 'react'
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
  { testId: 'account-tab-library', label: 'My Games', anchor: 'account-library', Content: LibrarySection },
  { testId: 'account-tab-wishlist', label: 'Wishlist', anchor: 'wishlist', Content: WishlistSection },
  {
    testId: 'account-tab-order-history',
    label: 'Order History',
    anchor: 'account-order-history',
    Content: OrderHistorySection,
  },
  { testId: 'account-tab-settings', label: 'Settings', anchor: 'account-settings', Content: SettingsSection },
] as const

export const AccountPage = () => {
  const isAuthenticated = useIsAuthenticated()
  const user = useAuthUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['testId']>(TABS[0].testId)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const anchor = window.location.hash.slice(1)
    const tab = TABS.find((tab) => tab.anchor === anchor)
    if (tab) setActiveTab(tab.testId)
  }, [])

  if (!isAuthenticated) {
    return null
  }

  const ActiveContent = TABS.find((tab) => tab.testId === activeTab)?.Content ?? LibrarySection

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
            onClick={() => setActiveTab(tab.testId)}
            className={`${tabStyles} ${tab.testId === activeTab ? activeTabStyles : inactiveTabStyles}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='w-full max-w-[1200px]'>
        <ActiveContent />
      </div>
      <div className='w-full max-w-[1200px]'>
        <RecentlyViewedSection />
      </div>
    </div>
  )
}
