'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { AuthActionType } from '@/providers/store/actions'
import { useLogout } from '@repo/dionis-api/src/dionis/default/default'
import { DropdownAppearence } from '@/ui/molecules/dropdown/DropdownAppearence'

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
  const { state: authState, dispatch: authDispatch } = useGlobalState()
  const isUserAuth = authState.auth.isAuthenticated

  const { refetch: logout } = useLogout({ query: { enabled: false } })

  return (
    <nav className='flex h-[10vh] items-center justify-between bg-muted px-[35px]'>
      <div className='flex items-center'>
        <Link href='/' className='flex items-center'>
          <span className='mr-2.5 cursor-pointer font-mono text-xl font-semibold text-foreground'>Dionis</span>
          <Image
            priority={true}
            width={40}
            height={40}
            alt='logo'
            src={`/icons/logo.png`}
          />
        </Link>
      </div>
      <nav className='flex'>
        <DropdownAppearence />
        <ul className='flex items-center'>
          <Link href={'/'} className='ml-4 flex items-center last:ml-8'>
            <li className='text-base font-semibold text-foreground'>Home</li>
          </Link>
          {!isUserAuth ? (
            navigation.map((item) => (
              <Link
                href={item.link}
                key={item.id}
                className='ml-4 flex items-center last:ml-8'
              >
                <li className='text-base font-semibold text-foreground'>{item.label}</li>
              </Link>
            ))
          ) : (
            <Link
              href={'/'}
              className='ml-4 flex items-center last:ml-8'
              onClick={() => {
                logout()
                authDispatch({ type: AuthActionType.LOGOUT })
              }}
            >
              <li className='text-base font-semibold text-foreground'>Logout</li>
            </Link>
          )}
        </ul>
      </nav>
      <div className='flex items-center'>
        {authState.auth.user && <div className='mr-4 text-foreground'>Hi, {authState.auth.user.name}</div>}
        <Link href='/cart' className='mr-4'>
          <Image
            priority={true}
            width={25}
            height={25}
            alt='logo'
            src={`/icons/shopping-cart.svg`}
          />
        </Link>
        <Link href='/account'>
          <Image
            priority={true}
            width={25}
            height={25}
            alt='logo'
            src={`/icons/account.svg`}
          />
        </Link>
      </div>
    </nav>
  )
}
