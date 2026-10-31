import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen } from '@/test-utils/utils'

import { ShowdownSetup } from '../ShowdownSetup'

const genres = [
  { genre: 'Strategy', count: 21 },
  { genre: 'Racing', count: 9 },
  { genre: 'Shooter', count: 48 },
  { genre: 'MOBA', count: 6 },
  { genre: 'Social', count: 1 },
]

const chip = (name: string) =>
  screen.getAllByTestId('showdown-genre-chip').find((element) => element.textContent?.includes(name))!

describe('<ShowdownSetup />', () => {
  it('starts on 16 with Start disabled, then enables Start once a genre is picked', async () => {
    serviceWorker.use(http.get('*/games/genres', () => HttpResponse.json(genres)))
    render(<ShowdownSetup />)

    expect(await screen.findAllByTestId('showdown-genre-chip')).toHaveLength(5)
    expect(screen.getAllByTestId('showdown-size-option')[1]).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('showdown-start')).toBeDisabled()

    await userEvent.click(chip('Shooter'))
    expect(chip('Shooter')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('showdown-start')).toBeEnabled()
  })

  it('disables a size the pool cannot fill and shows the real count', async () => {
    serviceWorker.use(http.get('*/games/genres', () => HttpResponse.json(genres)))
    render(<ShowdownSetup />)
    await screen.findAllByTestId('showdown-genre-chip')

    await userEvent.click(chip('Strategy'))
    await userEvent.click(chip('Racing'))

    const [eight, sixteen, thirtyTwo] = screen.getAllByTestId('showdown-size-option')
    expect(thirtyTwo).toBeDisabled()
    expect(thirtyTwo).toHaveTextContent('only 30 games')
    expect(eight).toBeEnabled()
    expect(sixteen).toBeEnabled()
  })

  it('allows 3 genres at most, and warns when the pool is under 8 games', async () => {
    serviceWorker.use(http.get('*/games/genres', () => HttpResponse.json(genres)))
    render(<ShowdownSetup />)
    await screen.findAllByTestId('showdown-genre-chip')

    await userEvent.click(chip('MOBA'))
    expect(screen.getByTestId('showdown-pool-warning')).toBeInTheDocument()
    expect(screen.getByTestId('showdown-start')).toBeDisabled()

    await userEvent.click(chip('Social'))
    await userEvent.click(chip('Racing'))
    expect(chip('Shooter')).toBeDisabled()
    expect(screen.queryByTestId('showdown-pool-warning')).not.toBeInTheDocument()
  })
})
