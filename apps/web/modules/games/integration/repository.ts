export {
  useGetGame,
  getGetGameStockAlertsQueryKey,
  useDeleteEditionStockAlert,
  useGetGameStockAlerts,
  useGetGames,
  useGetGamesGenres,
  useGetGamesRecommendations,
  useGetGamesTopDeals,
  useGetOwnedItems,
  usePutEditionStockAlert,
} from '@repo/dionis-api/src/dionis/default/default'
export type {
  GameImage,
  GameLanguage,
  GameObject,
  GameSection,
  GameWithReviewSummary,
  OwnedItem,
  StockAlertsResponse,
} from '@repo/dionis-api/src/model'
export { GetGamesEdition, GetGamesPlatform, GetGamesSort } from '@repo/dionis-api/src/model'
