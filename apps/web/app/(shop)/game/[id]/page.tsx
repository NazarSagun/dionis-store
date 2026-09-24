'use client'

import { useParams } from 'next/navigation'

import { GameDetails } from '@/modules/games/presentation/game-details/GameDetails'

export default function GamePage() {
  const { id } = useParams()

  return <GameDetails gameId={Number(id)} />
}
