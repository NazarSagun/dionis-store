'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLogout } from '@repo/dionis-api/src/dionis/default/default'

import { useAuthStore } from '@/features/auth'

export const MainNavigation = () => {
  const isUserAuth = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.logout)

  const { refetch: logout } = useLogout({ query: { enabled: false } })

  return (
    <nav className='flex h-[10vh] items-center justify-between border-b-4 border-neon-magenta bg-muted px-[35px]'>
      <div className='flex items-center'>
        <Link href='/' className='flex items-center gap-3'>
          <span className='size-8 rounded border-2 border-ink bg-neon-magenta' />
          <span className='cursor-pointer font-display text-base text-neon-magenta'>DIONIS</span>
        </Link>
      </div>
      <nav className='flex'>
        <ul className='flex items-center'>
          <Link href={'/'} className='ml-4 flex items-center last:ml-8'>
            <li className='text-base font-bold uppercase tracking-wide text-foreground hover:text-neon-cyan'>Home</li>
          </Link>
        </ul>
      </nav>
      <div className='flex items-center'>
        {user && <div className='mr-4 font-mono text-foreground'>Hi, {user.name}</div>}
        {!isUserAuth ? (
          <Link href='/login' className='mr-4'>
            <span className='text-base font-bold uppercase tracking-wide text-foreground hover:text-neon-cyan'>
              Login
            </span>
          </Link>
        ) : (
          <button
            className='mr-4'
            onClick={() => {
              logout()
              clearAuth()
            }}
          >
            <span className='text-base font-bold uppercase tracking-wide text-foreground hover:text-neon-cyan'>
              Logout
            </span>
          </button>
        )}
        <Link href='/cart' className='mr-4'>
          <Image priority={true} width={25} height={25} alt='logo' src={`/icons/shopping-cart.svg`} />
        </Link>
        <Link href='/account'>
          <Image priority={true} width={25} height={25} alt='logo' src={`/icons/account.svg`} />
        </Link>
      </div>
    </nav>
  )
}
