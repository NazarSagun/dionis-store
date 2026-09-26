import { getGetOrdersQueryKey, getOrders } from '@repo/dionis-api/src/dionis/default/default'
import { useInfiniteQuery } from '@tanstack/react-query'

export { useChangePassword, useGetGame, useUpdateName } from '@repo/dionis-api/src/dionis/default/default'
export type { OrderObject } from '@repo/dionis-api/src/model'

const ORDERS_PAGE_SIZE = 5

// One query shared by Library and Order History: they show the same orders
// on two tabs, so a page loaded in one is already there in the other. The key
// starts with getGetOrdersQueryKey(), so invalidating that key (as
// ActivationRow does after "Mark as activated") refetches these pages too.
export const useOrderPages = () => {
  const query = useInfiniteQuery({
    queryKey: [...getGetOrdersQueryKey(), 'pages', ORDERS_PAGE_SIZE],
    queryFn: ({ pageParam, signal }) => getOrders({ page: pageParam, pageSize: ORDERS_PAGE_SIZE }, undefined, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined,
  })

  return { ...query, orders: query.data?.pages.flatMap((page) => page.items) }
}
