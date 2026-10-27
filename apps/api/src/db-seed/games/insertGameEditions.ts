// Seeds physical editions onto the game the storefront's home page shows
// first (lowest id, since GamesService.fetchGames defaults to `orderBy: {
// id: 'asc' }`), per physical-editions-spec.md Feature 1's "Out of scope"
// note: editions are seeded, not created from the storefront. The E2E suite
// (packages/e2e/tests/physical-editions.spec.ts) assumes this exact game and
// these exact edition names, via card index 0.
export const VARIATIONS_GAME_COUNT = 30

interface Variation {
  standard: { stock: number; discount: number }
  collector: { stock: number; discount: number }
}

// Stock 0 is sold out. Both editions at 0 is a game with nothing to buy.
export const VARIATIONS: Variation[] = [
  { standard: { stock: 25, discount: 0 }, collector: { stock: 0, discount: 0 } },
  { standard: { stock: 40, discount: 0 }, collector: { stock: 15, discount: 0 } },
  { standard: { stock: 3, discount: 0 }, collector: { stock: 8, discount: 10 } },
  { standard: { stock: 0, discount: 0 }, collector: { stock: 5, discount: 0 } },
  { standard: { stock: 12, discount: 15 }, collector: { stock: 2, discount: 0 } },
  { standard: { stock: 0, discount: 0 }, collector: { stock: 0, discount: 0 } },
  { standard: { stock: 60, discount: 20 }, collector: { stock: 0, discount: 0 } },
]

export const editionsFor = (game, { standard, collector }: Variation) => [
  {
    gameId: game.id,
    name: 'Standard Physical Edition',
    price: game.price + 10,
    description: 'Physical disc case only, no bonus items.',
    ...standard,
  },
  {
    gameId: game.id,
    name: "Collector's Edition",
    price: game.price + 40,
    description: 'Steelbook case, 80-page art book, 3 enamel pins, and a double-sided world map poster.',
    ...collector,
  },
]

export const insertGameEditionsData = async (prismaClient) => {
  try {
    const firstGame = await prismaClient.game_pc.findFirst({ orderBy: { id: 'asc' } })
    if (!firstGame) {
      throw new Error('No games to attach editions to - run insertGamesData first')
    }

    await prismaClient.gameEdition.createMany({
      data: [
        {
          gameId: firstGame.id,
          name: 'Standard Physical Edition',
          price: firstGame.price + 10,
          discount: 0,
          stock: 25,
          description: 'Physical disc case only, no bonus items.',
        },
        {
          gameId: firstGame.id,
          name: "Collector's Edition",
          price: firstGame.price + 40,
          discount: 0,
          stock: 0,
          description: 'Steelbook case, 80-page art book, 3 enamel pins, and a double-sided world map poster.',
        },
      ],
    })

    // The next 29 games get both editions too, but each follows a different
    // pattern, so the storefront shows sold-out, low-stock, discounted and
    // fully stocked editions. The first game above stays fixed for the E2E suite.
    const others = await prismaClient.game_pc.findMany({
      where: { id: { gt: firstGame.id } },
      orderBy: { id: 'asc' },
      take: VARIATIONS_GAME_COUNT - 1,
    })
    await prismaClient.gameEdition.createMany({
      data: others.flatMap((game, index) => editionsFor(game, VARIATIONS[index % VARIATIONS.length])),
    })

    console.log(`Inserted physical editions for: ${firstGame.title} and ${others.length} more games`)
  } catch (error) {
    console.error('Error inserting game editions:', error)
  }
}
