export {
  useGetGame,
  getGetGameStockAlertsQueryKey,
  useDeleteEditionStockAlert,
  useGetGameStockAlerts,
  useGetGames,
  useGetGamesGenres,
  useGetGamesTopDeals,
  useGetOwnedItems,
  usePutEditionStockAlert,
} from '@repo/dionis-api/src/dionis/default/default'
export type { GameWithReviewSummary, GameObject, OwnedItem, StockAlertsResponse } from '@repo/dionis-api/src/model'
export { GetGamesEdition, GetGamesPlatform, GetGamesSort } from '@repo/dionis-api/src/model'
