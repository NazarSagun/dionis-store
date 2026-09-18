import { insertGamesData } from './games/insertGames'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function insertAllData() {
  try {
    insertGamesData(prisma)
  } catch (error) {
    console.error('Error inserting data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

insertAllData()
