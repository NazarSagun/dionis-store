import * as fs from 'fs'
import * as path from 'path'

export const insertGamesData = async (prismaClient) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'games.json'), 'utf8'))

    for (const item of data) {
      const {
        id,
        title,
        thumbnail,
        short_description,
        game_url,
        genre,
        platform,
        publisher,
        developer,
        release_date,
        freetogame_profile_url,
        price,
        rating,
      } = item

      await prismaClient.game_pc.create({
        data: {
          id,
          title,
          thumbnail,
          short_description,
          game_url,
          genre,
          platform,
          publisher,
          developer,
          release_date,
          freetogame_profile_url,
          price,
          rating,
        },
      })

      console.log(`Inserted: ${title}`)
    }

    console.log('All data inserted successfully')
  } catch (error) {
    console.error('Error inserting data:', error)
  }
}
