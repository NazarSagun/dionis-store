'use client'

import { AdminShell } from '@/modules/admin/presentation/admin-shell/AdminShell'
import { GameForm } from '@/modules/admin/presentation/game-form/GameForm'

export default function AdminNewGamePage() {
  return (
    <AdminShell title='New game'>
      <GameForm />
    </AdminShell>
  )
}
