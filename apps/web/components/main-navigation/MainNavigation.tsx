'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLogout } from '@repo/dionis-api/src/dionis/default/default'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui'

import { useAuthLogout, useAuthUser, useIsAuthenticated } from '@/modules/auth/core/facade'
import { useCartItems, useOpenCartDrawer } from '@/modules/cart/core/facade'

const menuItemStyles =
  'cursor-pointer rounded-sm px-3 py-2 font-mono text-sm text-foreground focus:bg-neon-cyan focus:text-primary-foreground'
const navLinkStyles = 'font-mono text-sm text-muted-foreground hover:text-foreground'

export const MainNavigation = () => {
  const isUserAuth = useIsAuthenticated()
  const user = useAuthUser()
  const clearAuth = useAuthLogout()
  const cartItems = useCartItems()
  const openCartDrawer = useOpenCartDrawer()

  const { refetch: logout } = useLogout({ query: { enabled: false } })

  return (
    <nav className='flex items-center justify-between border-b border-ink bg-background px-8 py-4'>
      <Link href='/' className='font-display text-xl font-bold text-foreground'>
        DIONIS
      </Link>
      <div className='flex items-center gap-6'>
        <Link href='/account#wishlist' className={navLinkStyles}>
          Wishlist
        </Link>
        {user && <span className='font-mono text-sm text-muted-foreground'>Hi, {user.name}</span>}
        <button type='button' data-testid='cart-trigger' onClick={openCartDrawer} className={navLinkStyles}>
          Cart ({cartItems.length})
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger data-testid='account-menu-trigger' aria-label='Account menu'>
            <Image priority={true} width={32} height={32} alt='logo' src={`/icons/account.svg`} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='border-ink bg-panel-alt'>
            {isUserAuth ? (
              <>
                <DropdownMenuItem asChild className={menuItemStyles}>
                  <Link href='/account'>Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={menuItemStyles}
                  onClick={() => {
                    logout()
                    clearAuth()
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild className={menuItemStyles}>
                  <Link href='/login'>Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={menuItemStyles}>
                  <Link href='/signup'>Sign Up</Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
