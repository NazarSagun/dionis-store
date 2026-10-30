import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { serviceWorker } from '@/test-utils/mock-server'
import { fireEvent, render, screen, waitFor } from '@/test-utils/utils'

import { AiSearchPalette } from '../AiSearchPalette'

// The router really changes the address, because the palette waits for it.
const push = vi.fn((url: string) => window.history.pushState({}, '', url))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const answer = (body: object, status = 200) =>
  serviceWorker.use(http.post('*/games/ai-search', () => HttpResponse.json(body, { status })))

const openAndAsk = (query: string) => {
  fireEvent.click(screen.getByTestId('ai-search-open'))
  fireEvent.change(screen.getByTestId('ai-search-input'), { target: { value: query } })
  fireEvent.click(screen.getByTestId('ai-search-submit'))
}

describe('AiSearchPalette', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/game/1')
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    serviceWorker.use(http.get('*/games/1', () => HttpResponse.json({ totalPages: 1, totalGames: 14, games: [] })))
  })

  afterEach(() => {
    push.mockClear()
    document.documentElement.removeAttribute('data-ai-glow')
    vi.restoreAllMocks()
  })

  it('shows the filters as chips, then goes home with them and marks the changed menus', async () => {
    answer({ status: 'ok', filters: { platform: 'PS5', maxPrice: 20 } })
    render(<AiSearchPalette />)
    openAndAsk('ps5 under 20')

    const chips = await screen.findAllByTestId('ai-filter-chip')
    expect(chips.map((chip) => chip.textContent)).toEqual(['Platform: PS5', 'Price: Up to €20'])
    expect(await screen.findByText('14 games')).toBeInTheDocument()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/?platform=PS5&maxPrice=20', { scroll: false }))
    await waitFor(() => expect(document.documentElement.getAttribute('data-ai-glow')).toBe('platform price'))
    expect(screen.queryByTestId('ai-search-dialog')).not.toBeInTheDocument()
  })

  it('keeps the palette open with the text when the request is not a game search', async () => {
    answer({ status: 'rejected' })
    render(<AiSearchPalette />)
    openAndAsk('write me a poem')

    expect(await screen.findByTestId('ai-search-rejected')).toHaveTextContent('AI search only finds games.')
    expect(screen.getByTestId('ai-search-input')).toHaveValue('write me a poem')
    expect(push).not.toHaveBeenCalled()
  })

  it.each([429, 503])('shows the unavailable row on a %i', async (status) => {
    answer({ message: 'Unavailable' }, status)
    render(<AiSearchPalette />)
    openAndAsk('rpg')

    expect(await screen.findByTestId('ai-search-rejected')).toHaveTextContent(
      'The AI feature is temporarily unavailable.',
    )
    expect(push).not.toHaveBeenCalled()
  })

  it('fills the input from an example without sending it, and disables search while empty', () => {
    render(<AiSearchPalette />)
    fireEvent.click(screen.getByTestId('ai-search-open'))
    expect(screen.getByTestId('ai-search-submit')).toBeDisabled()

    fireEvent.click(screen.getAllByTestId('ai-search-example')[1])

    expect(screen.getByTestId('ai-search-input')).toHaveValue('Best rated RPG on Switch')
    expect(screen.queryByTestId('ai-search-result')).not.toBeInTheDocument()
  })
})
