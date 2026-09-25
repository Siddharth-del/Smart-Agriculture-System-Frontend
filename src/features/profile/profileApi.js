import { api } from '../../app/api'

export const profileApi = api.injectEndpoints({
  endpoints: (b) => ({
    myProfile: b.query({ query: () => '/api/farmer/profile', providesTags: ['Profile'] }),
    createProfile: b.mutation({
      query: (body) => ({ url: '/api/farmer/profile', method: 'POST', body }),
      invalidatesTags: ['Profile', 'Farmers'],
    }),
    updateProfile: b.mutation({
      query: (body) => ({ url: '/api/farmer/profile', method: 'PUT', body }),
      invalidatesTags: ['Profile', 'Farmers'],
    }),
    deleteProfile: b.mutation({
      query: () => ({ url: '/api/farmer/profile', method: 'DELETE' }),
      invalidatesTags: ['Profile', 'Farmers'],
    }),
  }),
})

export const { useMyProfileQuery, useCreateProfileMutation, useUpdateProfileMutation, useDeleteProfileMutation } = profileApi
