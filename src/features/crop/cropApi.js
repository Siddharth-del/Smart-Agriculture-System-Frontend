import { api } from '../../app/api'

export const cropApi = api.injectEndpoints({
  endpoints: (b) => ({
    /** Body: { nitrogen, phosphorus, potassium, ph, rainfall, location } */
    recommendCrop: b.mutation({
      query: (body) => ({ url: '/api/ml/recommend-crop', method: 'POST', body, timeout: 60000 }),
      invalidatesTags: ['Crops'],
    }),
    cropsByName: b.query({ query: (name) => `/api/ml/crop/${encodeURIComponent(name)}`, providesTags: ['Crops'] }),
    allCrops: b.query({ query: () => '/api/ml/crops', providesTags: ['Crops'] }),
  }),
})

// Lombok generates getCropName() for the field "CropName", so Jackson may emit either casing.
export const cropNameOf = (r) => r?.cropName ?? r?.CropName ?? ''

export const { useRecommendCropMutation, useCropsByNameQuery, useAllCropsQuery } = cropApi
