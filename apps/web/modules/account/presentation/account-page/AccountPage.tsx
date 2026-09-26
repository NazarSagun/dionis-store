'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthUser, useIsAuthenticated } from '@/modules/auth/core/facade'
import { WishlistSection } from '@/modules/wishlist/presentation/wishlist-section/WishlistSection'

import { LibrarySection } from '../library-section/LibrarySection'
import { OrderHistorySection } from '../order-history-section/OrderHistorySection'
import { RecentlyViewedSection } from '../recently-viewed-section/RecentlyViewedSection'
import { SettingsSection } from '../settings-section/SettingsSection'

const tabStyles = 'whitespace-nowrap border-b-2 px-4 py-3 font-sans text-sm font-semibold'
const activeTabStyles = 'border-primary text-foreground'
const inactiveTabStyles = 'border-transparent text-muted-foreground hover:text-foreground'

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
    <div
      data-testid='account-page'
      className='flex w-full flex-col items-start gap-8 px-4 pb-16 pt-12 sm:px-8 lg:px-16'
    >
      {user && <h1 className='font-display text-[32px] font-bold leading-tight text-foreground'>Hi, {user.name}</h1>}

      <div className='flex max-w-full flex-nowrap gap-2 overflow-x-auto shadow-[inset_0_-1px_0_var(--border)]'>
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

      {/* Per the Account frames, Recently Viewed sits above the Library on My Games only. */}
      {activeTab === 'account-tab-library' && <RecentlyViewedSection />}

      <div className='w-full max-w-[900px]'>
        <ActiveContent />
      </div>
    </div>
  )
}
