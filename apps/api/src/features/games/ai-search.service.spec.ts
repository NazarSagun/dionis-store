import { CacheModule } from '@nestjs/cache-manager'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { AI_UNAVAILABLE, AiSearchService, parseModelAnswer } from './ai-search.service'
import { GamesService } from './games.service'

const FREE_ENV = {
  OPENROUTER_API_KEY: 'test-key',
  OPENROUTER_BASE_URL: 'https://openrouter.test/api/v1',
  GEMINI_API_KEY: '',
  GEMINI_MODEL: 'gemini-test',
  GEMINI_BASE_URL: 'https://gemini.test/openai',
}

const STORED_GAMES = [
  { title: 'The Witcher 3: Wild Hunt', genre: 'RPG', platform: 'PC (Windows), PS5, Xbox Series X, Nintendo Switch' },
  { title: 'Halo Infinite', genre: 'Shooter', platform: 'PC (Windows)' },
]

const modelReply = (content: string) =>
  ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) }) as Response

describe('AiSearchService', () => {
  let service: AiSearchService
  let env: Record<string, string>
  let fetchMock: jest.SpyInstance

  beforeEach(async () => {
    env = { ...FREE_ENV }
    const module = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [
        AiSearchService,
        { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
        {
          provide: GamesService,
          useValue: {
            fetchGenres: async () => [
              { genre: 'Shooter', count: 3 },
              { genre: 'RPG', count: 2 },
            ],
            fetchGames: async ({ search }: { search: string }) => ({
              games: STORED_GAMES.filter((game) => game.title.toLowerCase().includes(search.toLowerCase())),
            }),
          },
        },
      ],
    }).compile()
    service = module.get(AiSearchService)
    fetchMock = jest.spyOn(global, 'fetch')
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => jest.restoreAllMocks())

  it('maps a search answer to filters and returns the stored genre spelling', async () => {
    fetchMock.mockResolvedValue(modelReply('{"type":"search","platform":"PS5","maxPrice":20,"genre":"shooter"}'))

    expect(await service.search('co-op shooter on ps5 under 20')).toEqual({
      status: 'ok',
      filters: { platform: 'PS5', maxPrice: 20, genre: 'Shooter' },
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://openrouter.test/api/v1/chat/completions')
    expect(JSON.parse(init.body).model).toBe('openrouter/free')
  })

  it('turns a game the shopper wants more of into its stored genre, never a title search', async () => {
    fetchMock.mockResolvedValue(modelReply('{"type":"search","like":"witcher","search":"witcher","genre":"Shooter"}'))
    // The Witcher is on every platform, so the platform stays open.
    expect(await service.search('I want a game like witcher')).toEqual({ status: 'ok', filters: { genre: 'RPG' } })
  })

  it('takes the platform of a single-platform reference game unless the shopper named one', async () => {
    fetchMock.mockResolvedValueOnce(modelReply('{"type":"search","like":"Halo"}'))
    expect(await service.search('games like halo')).toEqual({
      status: 'ok',
      filters: { genre: 'Shooter', platform: 'PC' },
    })
    fetchMock.mockResolvedValueOnce(modelReply('{"type":"search","like":"Halo","platform":"Xbox"}'))
    expect(await service.search('games like halo on xbox')).toEqual({
      status: 'ok',
      filters: { genre: 'Shooter', platform: 'Xbox' },
    })
  })

  it('keeps the genre the model knows for a reference game outside the store', async () => {
    fetchMock.mockResolvedValue(modelReply('{"type":"search","like":"Mass Effect","genre":"rpg"}'))
    expect(await service.search('something like mass effect')).toEqual({ status: 'ok', filters: { genre: 'RPG' } })
  })

  it('rejects an off-topic request', async () => {
    fetchMock.mockResolvedValue(modelReply('{"type":"off_topic"}'))
    expect(await service.search('write me a poem')).toEqual({ status: 'rejected' })
  })

  it('falls back to a title search when the answer is not JSON', async () => {
    fetchMock.mockResolvedValue(modelReply('Sure! Here are some games.'))
    expect(await service.search('elden ring')).toEqual({ status: 'fallback', filters: { search: 'elden ring' } })
  })

  it('falls back without an outbound call when the key is empty', async () => {
    env.OPENROUTER_API_KEY = ''
    expect((await service.search('elden ring')).status).toBe('fallback')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['a 429', () => Promise.resolve({ ok: false, status: 429 } as Response)],
    ['a 500', () => Promise.resolve({ ok: false, status: 500 } as Response)],
    ['a timeout', () => Promise.reject(new DOMException('The operation timed out.', 'TimeoutError'))],
  ])('answers 503 "temporarily unavailable" on %s', async (_name, reply) => {
    fetchMock.mockImplementation(reply)
    await expect(service.search('elden ring')).rejects.toMatchObject({ message: AI_UNAVAILABLE, statusCode: 503 })
  })

  it('asks Gemini when OpenRouter fails', async () => {
    env.GEMINI_API_KEY = 'gemini-key'
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429 } as Response)
    fetchMock.mockResolvedValueOnce(modelReply('{"type":"search","platform":"PC"}'))

    expect(await service.search('pc games')).toEqual({ status: 'ok', filters: { platform: 'PC' } })
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('https://gemini.test/openai/chat/completions')
    expect(JSON.parse(init.body).model).toBe('gemini-test')
  })

  it('answers 503 when OpenRouter and Gemini both fail', async () => {
    env.GEMINI_API_KEY = 'gemini-key'
    fetchMock.mockResolvedValue({ ok: false, status: 429 } as Response)
    await expect(service.search('pc games')).rejects.toMatchObject({ statusCode: 503 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('uses Gemini alone when only its key is set', async () => {
    env.OPENROUTER_API_KEY = ''
    env.GEMINI_API_KEY = 'gemini-key'
    fetchMock.mockResolvedValue(modelReply('{"type":"off_topic"}'))
    expect(await service.search('write me a poem')).toEqual({ status: 'rejected' })
    expect(fetchMock.mock.calls[0][0]).toBe('https://gemini.test/openai/chat/completions')
  })

  it('caches an answer by the normalized request, rejections too', async () => {
    fetchMock.mockResolvedValue(modelReply('{"type":"off_topic"}'))
    await service.search('Write me  a poem')
    await service.search('  write me a POEM ')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not cache a fallback', async () => {
    fetchMock.mockResolvedValueOnce(modelReply('no json here'))
    fetchMock.mockResolvedValueOnce(modelReply('{"type":"search","platform":"PC"}'))
    expect((await service.search('pc games')).status).toBe('fallback')
    expect((await service.search('pc games')).status).toBe('ok')
  })
})

describe('parseModelAnswer', () => {
  const genres = ['Shooter']

  it('drops values outside the allowed lists', () => {
    expect(
      parseModelAnswer('{"type":"search","platform":"Dreamcast","sort":"cheapest","edition":"digital"}', genres),
    ).toEqual({
      status: 'ok',
      filters: { edition: 'digital' },
    })
  })

  it('drops an unknown genre, a negative or fractional price, and a reversed price range', () => {
    expect(
      parseModelAnswer('{"type":"search","genre":"Puzzle","minPrice":-1,"maxPrice":9.5,"search":"halo"}', genres),
    ).toEqual({
      status: 'ok',
      filters: { search: 'halo' },
    })
    expect(parseModelAnswer('{"type":"search","minPrice":30,"maxPrice":10,"platform":"PC"}', genres)).toEqual({
      status: 'ok',
      filters: { platform: 'PC' },
    })
  })

  it('reads an object wrapped in a code fence, and returns null with no usable field or an unknown type', () => {
    expect(parseModelAnswer('```json\n{"type":"search","platform":"Xbox"}\n```', genres)).toEqual({
      status: 'ok',
      filters: { platform: 'Xbox' },
    })
    expect(parseModelAnswer('{"type":"search","platform":"Amiga"}', genres)).toBeNull()
    expect(parseModelAnswer('{"type":"chat"}', genres)).toBeNull()
  })

  it('cuts the search text to 100 characters', () => {
    const answer = parseModelAnswer(JSON.stringify({ type: 'search', search: 'a'.repeat(150) }), genres)
    expect(answer).toEqual({ status: 'ok', filters: { search: 'a'.repeat(100) } })
  })
})
