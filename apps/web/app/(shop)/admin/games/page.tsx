'use client'

import Link from 'next/link'
import { Button } from '@repo/ui'

import { adminButtonText } from '@/modules/admin/domain/styles'
import { AdminShell } from '@/modules/admin/presentation/admin-shell/AdminShell'
import { GamesTable } from '@/modules/admin/presentation/games-table/GamesTable'

export default function AdminGamesPage() {
  return (
    <AdminShell
      title='Games'
      actions={
        <Button asChild className={adminButtonText}>
          <Link href='/admin/games/new' data-testid='admin-game-new'>
            New game
          </Link>
        </Button>
      }
    >
      <GamesTable />
    </AdminShell>
  )
}
