'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Skeleton } from '@repo/ui'

import { useGetGame } from '@/modules/admin/integration/repository'
import { AdminShell } from '@/modules/admin/presentation/admin-shell/AdminShell'
import { EditionsSection } from '@/modules/admin/presentation/editions-section/EditionsSection'
import { GameForm } from '@/modules/admin/presentation/game-form/GameForm'

export default function AdminEditGamePage() {
  const { id } = useParams<{ id: string }>()
  const gameId = Number(id)
  const { data, isLoading, isError } = useGetGame(gameId)
  const game = data

  return (
    <AdminShell title='Edit game'>
      <Link
        href='/admin/games'
        className='w-fit font-sans text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        ← All games
      </Link>
      {isLoading && <Skeleton className='h-[600px] w-full max-w-[1100px]' />}
      {isError && <p className='font-sans text-sm text-muted-foreground'>This game does not exist.</p>}
      {game && (
        <>
          {/* Keyed so the form's values reset only when a different game opens. */}
          <GameForm key={game.id} game={game} />
          <EditionsSection gameId={game.id} editions={game.editions ?? []} />
        </>
      )}
    </AdminShell>
  )
}
