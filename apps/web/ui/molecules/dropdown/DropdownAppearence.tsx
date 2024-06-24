'use client'

import * as React from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './Dropdown'
import { Theme, ThemeActionType, useThemeState } from '@/providers/theme'
import Image from 'next/image'

export function DropdownAppearence() {
  const { state, dispatch } = useThemeState()
  const [theme, setTheme] = React.useState(state.mode)
  const isDarkTheme = theme === Theme.DARK ? 'moon' : 'sun'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='flex items-center bg-transparent hover:bg-gray-700 font-semibold text-white py-1 px-2 rounded outline-none'>
          <Image
            priority
            alt='light-theme'
            src={`/icons/${isDarkTheme}.svg`}
            width={18}
            height={18}
          />
          <span className='ml-1 mr-0 text-sm hover:cursor-pointer'>{theme}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='min-w-20 px-0'>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value: string) => {
            setTheme(value as Theme)
            localStorage.setItem('theme', value)
            dispatch({ type: ThemeActionType.TOGGLE_THEME, payload: value as Theme })
          }}
        >
          <DropdownMenuRadioItem
            className='px-0 py-1 flex flex-col justify-center'
            value={Theme.DARK}
          >
            <button className='flex items-center bg-transparent font-semibold py-0 px-0 rounded outline-none'>
              <Image
                priority
                alt='light-theme'
                src={`/icons/moon.svg`}
                width={16}
                height={16}
              />
              <span className='ml-1 mr-0 text-sm text-black hover:cursor-pointer'>dark</span>
            </button>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className='px-0 py-1 flex flex-col justify-center'
            value={Theme.LIGHT}
          >
            <button className='flex items-center bg-transparent font-semibold py-0 px-0 rounded outline-none'>
              <Image
                priority
                alt='light-theme'
                src={`/icons/sun.svg`}
                width={16}
                height={16}
              />
              <span className='ml-1 mr-0 text-sm text-black hover:cursor-pointer'>light</span>
            </button>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
