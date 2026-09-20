// Seeds physical editions onto the game the storefront's home page shows
// first (lowest id, since GamesService.fetchGames defaults to `orderBy: {
// id: 'asc' }`), per physical-editions-spec.md Feature 1's "Out of scope"
// note: editions are seeded, not created from the storefront. The E2E suite
// (packages/e2e/tests/physical-editions.spec.ts) assumes this exact game and
// these exact edition names, via card index 0.
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

    console.log(`Inserted physical editions for: ${firstGame.title}`)
  } catch (error) {
    console.error('Error inserting game editions:', error)
  }
}
