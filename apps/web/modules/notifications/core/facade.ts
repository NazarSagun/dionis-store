'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useIsAuthenticated } from '@/modules/auth/core/facade'

import { NOTIFICATIONS_POLL_MS } from '../domain/models'
import {
  getGetNotificationsQueryKey,
  NotificationsResponse,
  useGetNotifications,
  usePostNotificationRead,
  usePostNotificationsReadAll,
} from '../integration/repository'

// The unread notifications of the signed-in user. They refetch every minute
// and when the window gets focus. A failed refetch keeps the last list.
export const useNotifications = () => {
  const isAuthenticated = useIsAuthenticated()
  const query = useGetNotifications({
    query: { enabled: isAuthenticated, refetchInterval: NOTIFICATIONS_POLL_MS, retry: 1 },
  })
  const { refetch } = query

  // React Query refetches on a tab change only, so this also covers a window
  // that gets focus back.
  useEffect(() => {
    if (!isAuthenticated) return
    const onFocus = () => void refetch()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [isAuthenticated, refetch])

  return query
}

// Drops the cached list, so the next user on this browser never sees it.
export const useClearNotificationsOnUnmount = () => {
  const queryClient = useQueryClient()

  useEffect(
    () => () => {
      queryClient.removeQueries({ queryKey: getGetNotificationsQueryKey() })
    },
    [queryClient],
  )
}

// Both marks remove the rows at once and put them back if the request fails.
const useOptimisticRead = () => {
  const queryClient = useQueryClient()
  const queryKey = getGetNotificationsQueryKey()

  return {
    onMutate: async (remove: (current: NotificationsResponse) => NotificationsResponse) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<NotificationsResponse>(queryKey)
      queryClient.setQueryData<NotificationsResponse>(queryKey, (current) => current && remove(current))
      return { previous }
    },
    rollback: (context: { previous?: NotificationsResponse } | undefined) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  }
}

export const useMarkNotificationRead = () => {
  const { onMutate, rollback, refresh } = useOptimisticRead()

  return usePostNotificationRead({
    mutation: {
      onMutate: ({ id }) =>
        onMutate((current) => {
          const listed = current.notifications.some((notification) => notification.id === id)
          return {
            unreadCount: Math.max(0, current.unreadCount - (listed ? 1 : 0)),
            notifications: current.notifications.filter((notification) => notification.id !== id),
          }
        }),
      onError: (_error, _variables, context) => rollback(context),
      onSettled: refresh,
    },
  })
}

export const useMarkAllNotificationsRead = () => {
  const { onMutate, rollback, refresh } = useOptimisticRead()

  return usePostNotificationsReadAll({
    mutation: {
      onMutate: () => onMutate(() => ({ unreadCount: 0, notifications: [] })),
      onError: (_error, _variables, context) => rollback(context),
      onSettled: refresh,
    },
  })
}
