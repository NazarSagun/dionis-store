import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { cleanup, render } from '@/test-utils/utils'

import { ThemeToggle } from '../ThemeToggle'

describe('<ThemeToggle />', () => {
  beforeEach(() => {
    cleanup()
  })
  it('Should have dark theme selected by default', () => {
    const { getByAltText } = render(<ThemeToggle />)

    const themeLabel = getByAltText('dark-theme')
    expect(themeLabel).toHaveAttribute('alt', 'dark-theme')
  })

  it('Should select a light theme after click', async () => {
    const { findByTestId, findByText } = render(<ThemeToggle />)

    const dropdown = await findByTestId('dropdown-button')
    await userEvent.click(dropdown)
    const lightThemeButton = await findByTestId('light-theme-button')
    const darkThemeButton = await findByTestId('dark-theme-button')

    expect(lightThemeButton).toBeInTheDocument()
    expect(darkThemeButton).toBeInTheDocument()

    await userEvent.click(lightThemeButton)

    expect(darkThemeButton).not.toBeInTheDocument()
    expect(lightThemeButton).not.toBeInTheDocument()
    expect(await findByText('light')).toBeInTheDocument()
  })
})
