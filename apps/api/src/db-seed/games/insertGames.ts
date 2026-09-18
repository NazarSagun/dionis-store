import * as fs from 'fs'
import * as path from 'path'

export const insertGamesData = async (prismaClient) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'games.json'), 'utf8'))

    const upadtedData = data.map((item) => {
      return {
        ...item,
        discount: Math.random() < 0.15 ? getRandomDiscount(5, 85) : 0,
      }
    })

    for (const item of upadtedData) {
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
        discount,
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
          discount,
        },
      })

      console.log(`Inserted: ${title}`)
    }

    console.log('All data inserted successfully')
  } catch (error) {
    console.error('Error inserting data:', error)
  }
}

function getRandomDiscount(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
