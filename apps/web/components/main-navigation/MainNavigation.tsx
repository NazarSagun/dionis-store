'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLogout } from '@repo/dionis-api/src/dionis/default/default'

import { useAuthStore } from '@/features/auth'

import { ThemeToggle } from '../theme-toggle'

const navigation = [
  {
    id: 1,
    label: 'Login',
    link: '/login',
  },
  {
    id: 2,
    label: 'Sign Up',
    link: '/signup',
  },
]

export const MainNavigation = () => {
  const isUserAuth = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.logout)

  const { refetch: logout } = useLogout({ query: { enabled: false } })

  return (
    <nav className='flex h-[10vh] items-center justify-between bg-muted px-[35px]'>
      <div className='flex items-center'>
        <Link href='/' className='flex items-center'>
          <span className='mr-2.5 cursor-pointer font-mono text-xl font-semibold text-foreground'>Dionis</span>
          <Image priority={true} width={40} height={40} alt='logo' src={`/icons/logo.png`} />
        </Link>
      </div>
      <nav className='flex'>
        <ThemeToggle />
        <ul className='flex items-center'>
          <Link href={'/'} className='ml-4 flex items-center last:ml-8'>
            <li className='text-base font-semibold text-foreground'>Home</li>
          </Link>
          {!isUserAuth ? (
            navigation.map((item) => (
              <Link href={item.link} key={item.id} className='ml-4 flex items-center last:ml-8'>
                <li className='text-base font-semibold text-foreground'>{item.label}</li>
              </Link>
            ))
          ) : (
            <Link
              href={'/'}
              className='ml-4 flex items-center last:ml-8'
              onClick={() => {
                logout()
                clearAuth()
              }}
            >
              <li className='text-base font-semibold text-foreground'>Logout</li>
            </Link>
          )}
        </ul>
      </nav>
      <div className='flex items-center'>
        {user && <div className='mr-4 text-foreground'>Hi, {user.name}</div>}
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
