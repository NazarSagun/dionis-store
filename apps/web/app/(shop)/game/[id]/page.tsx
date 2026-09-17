'use client'

import { useParams } from 'next/navigation'
import { GameDetails } from '@/features/games'

export default function GamePage() {
  const { id } = useParams()

  return <GameDetails gameId={Number(id)} />
}
