'use client'

import { ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { useIsAdmin, useIsAuthenticated } from '@/modules/auth/core/facade'

const TABS = [
  { href: '/admin/games', label: 'Games', testId: 'admin-nav-games' },
  { href: '/admin/orders', label: 'Orders', testId: 'admin-nav-orders' },
] as const

interface AdminShellProps {
  title: string
  actions?: ReactNode
  children: ReactNode
}

// A guest goes to /login and a signed-in non-admin to /. This only hides the
// pages: every admin API route checks the role itself.
export const AdminShell = ({ title, actions, children }: AdminShellProps) => {
  const isAuthenticated = useIsAuthenticated()
  const isAdmin = useIsAdmin()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login')
    else if (!isAdmin) router.replace('/')
  }, [isAuthenticated, isAdmin, router])

  if (!isAdmin) return null

  return (
    <div className='flex w-full flex-col gap-8 px-4 pb-24 pt-12 sm:px-8 lg:px-16'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-2'>
          <span className='font-sans text-xs font-semibold uppercase tracking-wide text-primary'>Admin</span>
          <h1 className='font-display text-[40px] font-bold leading-tight text-foreground'>{title}</h1>
        </div>
        {actions}
      </div>

      <nav data-testid='admin-nav' className='flex gap-2 shadow-[inset_0_-1px_0_var(--border)]'>
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-testid={tab.testId}
              className={`border-b-2 px-4 py-3 font-sans text-sm font-semibold ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
