import { useRecentlyViewedStore } from './store'

export const useRecentlyViewedGameIds = () => useRecentlyViewedStore((state) => state.gameIds)
export const useRecordView = () => useRecentlyViewedStore((state) => state.recordView)
