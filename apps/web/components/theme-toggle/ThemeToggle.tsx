'use client'

import * as React from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@repo/ui'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid='dropdown-button'
          className='flex items-center bg-transparent hover:bg-gray-700 font-semibold text-white py-1 px-2 rounded outline-none select-none'
        >
          <Image
            priority={true}
            alt={`${theme}-theme`}
            src={`/icons/${theme === 'dark' ? 'moon' : 'sun'}.svg`}
            width={18}
            height={18}
            style={{ width: 18, height: 18 }}
          />
          <span className='ml-1 mr-0 text-sm hover:cursor-pointer'>{theme}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='min-w-20 px-0'>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem className='px-0 py-1 flex flex-col justify-center' value='dark'>
            <button
              data-testid='dark-theme-button'
              className='flex items-center bg-transparent font-semibold py-0 px-0 rounded outline-none'
            >
              <Image priority alt='light-theme' src={`/icons/moon.svg`} width={16} height={16} />
              <span className='ml-1 mr-0 text-sm text-black hover:cursor-pointer'>dark</span>
            </button>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className='px-0 py-1 flex flex-col justify-center' value='light'>
            <button
              data-testid='light-theme-button'
              className='flex items-center bg-transparent font-semibold py-0 px-0 rounded outline-none'
            >
              <Image priority alt='light-theme' src={`/icons/sun.svg`} width={16} height={16} />
              <span className='ml-1 mr-0 text-sm text-black hover:cursor-pointer'>light</span>
            </button>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
