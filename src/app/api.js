import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from '../lib/api/baseQuery'

/**
 * The single API slice. Each feature injects its own endpoints
 * (features/<name>/<name>Api.js) so the slice stays small and code-split.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Me', 'Profile', 'Sensor', 'Farmers', 'Crops', 'Health'],
  refetchOnReconnect: true,
  keepUnusedDataFor: 120,
  endpoints: () => ({}),
})
