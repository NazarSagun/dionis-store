import { insertGameEditionsData } from './games/insertGameEditions'
import { insertGamesData } from './games/insertGames'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function insertAllData() {
  try {
    await insertGamesData(prisma)
    await insertGameEditionsData(prisma)
  } catch (error) {
    console.error('Error inserting data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

insertAllData()
