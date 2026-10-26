'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Bell, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useIsAuthenticated } from '@/modules/auth/core/facade'
import { loginHref } from '@/modules/auth/domain/redirect'

import {
  getGetGameStockAlertsQueryKey,
  StockAlertsResponse,
  useDeleteEditionStockAlert,
  useGetGameStockAlerts,
  usePutEditionStockAlert,
} from '../../integration/repository'

interface EditionNotifyProps {
  gameId: number
  editionId: number
}

// The "Notify me" control of an out-of-stock edition. A guest goes to login and
// comes back to the game page. The button text is the confirmation, so there is
// no toast.
export const EditionNotify = ({ gameId, editionId }: EditionNotifyProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isAuthenticated = useIsAuthenticated()
  const [failed, setFailed] = useState(false)

  const { data } = useGetGameStockAlerts(gameId, { query: { enabled: isAuthenticated } })
  const subscribe = usePutEditionStockAlert()
  const unsubscribe = useDeleteEditionStockAlert()

  const isNotifying = data?.editionIds.includes(editionId) ?? false
  const isPending = subscribe.isPending || unsubscribe.isPending

  const setNotifying = (next: boolean) =>
    queryClient.setQueryData<StockAlertsResponse>(getGetGameStockAlertsQueryKey(gameId), (current) => {
      const others = (current?.editionIds ?? []).filter((id) => id !== editionId)
      return { editionIds: next ? [...others, editionId] : others }
    })

  const onClick = () => {
    if (!isAuthenticated) {
      router.push(loginHref(`/game/${gameId}`))
      return
    }
    setFailed(false)
    const mutation = isNotifying ? unsubscribe : subscribe
    mutation.mutate(
      { id: editionId },
      {
        onSuccess: () => setNotifying(!isNotifying),
        onError: () => setFailed(true),
      },
    )
  }

  return (
    <div className='flex w-full flex-col items-center gap-2'>
      <button
        type='button'
        data-testid='edition-notify'
        disabled={isPending}
        onClick={onClick}
        className={cn(
          'flex min-h-11 w-full items-center justify-center gap-2 rounded-md border px-3 py-2 font-display text-xs transition-colors disabled:opacity-50',
          isNotifying ? 'border-success text-success' : 'border-ink bg-background text-foreground hover:bg-panel-alt',
        )}
      >
        {isNotifying ? <Check aria-hidden width={16} height={16} /> : <Bell aria-hidden width={16} height={16} />}
        {isNotifying ? 'Notifying you' : 'Notify me'}
      </button>
      {failed && (
        <span data-testid='edition-notify-error' role='alert' className='font-mono text-xs text-destructive'>
          Could not update your alert. Try again.
        </span>
      )}
    </div>
  )
}
