import { api } from '../../app/api'

export const diseaseApi = api.injectEndpoints({
  endpoints: (b) => ({
    detectDisease: b.mutation({
      query: (file) => {
        const body = new FormData()
        body.append('image', file)
        return { url: '/api/disease/detect', method: 'POST', body }
      },
    }),
    diseasesByName: b.query({ query: (name) => `/api/disease/${encodeURIComponent(name)}` }),
  }),
})

export const { useDetectDiseaseMutation, useDiseasesByNameQuery } = diseaseApi
