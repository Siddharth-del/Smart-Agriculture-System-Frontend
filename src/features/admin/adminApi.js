import { api } from '../../app/api'

export const adminApi = api.injectEndpoints({
  endpoints: (b) => ({
    farmers: b.query({
      query: () => '/api/admin/farmers',
      providesTags: (res) => ['Farmers', ...(res || []).map((f) => ({ type: 'Farmers', id: f.userId }))],
    }),
    farmer: b.query({ query: (userId) => `/api/admin/farmers/${userId}`, providesTags: (_r, _e, id) => [{ type: 'Farmers', id }] }),
    deleteFarmer: b.mutation({
      query: (userId) => ({ url: `/api/admin/farmers/${userId}`, method: 'DELETE' }),
      // Optimistically remove the row so the table responds instantly.
      async onQueryStarted(userId, { dispatch, queryFulfilled }) {
        const patch = dispatch(adminApi.util.updateQueryData('farmers', undefined, (draft) =>
          draft.filter((f) => f.userId !== userId)))
        try { await queryFulfilled } catch { patch.undo() }
      },
      invalidatesTags: ['Farmers'],
    }),
    health: b.query({
      queryFn: async (_arg, apiCtx, _extra, baseQuery) => {
        const started = performance.now()
        const res = await baseQuery({ url: '/health', timeout: 8000 })
        const latencyMs = Math.round(performance.now() - started)
        if (res.error) return { data: { up: false, latencyMs, error: res.error.message, checkedAt: new Date().toISOString() } }
        return { data: { up: res.data?.status === 'UP', service: res.data?.service, latencyMs, checkedAt: new Date().toISOString() } }
      },
      providesTags: ['Health'],
    }),
  }),
})

export const { useFarmersQuery, useFarmerQuery, useDeleteFarmerMutation, useHealthQuery } = adminApi
