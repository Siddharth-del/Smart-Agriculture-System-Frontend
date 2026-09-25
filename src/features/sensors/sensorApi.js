import { api } from '../../app/api'
import { readingReceived } from './sensorHistorySlice'

export const sensorApi = api.injectEndpoints({
  endpoints: (b) => ({
    /** SensorLatestResponse: soilMoisture, temperature, humidity, city, status, emailStatus, recordedAt, deviceId */
    latestReading: b.query({
      query: () => '/api/sensor/latest',
      providesTags: ['Sensor'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(readingReceived(data))
        } catch { /* surfaced via hook state */ }
      },
    }),
    registerDeviceKey: b.mutation({
      query: (deviceKey) => ({ url: '/api/sensor/register-key', method: 'POST', params: { deviceKey } }),
      invalidatesTags: ['Sensor'],
    }),
    resetMoisture: b.mutation({
      query: () => ({ url: '/api/sensor/reset', method: 'POST' }),
      invalidatesTags: ['Sensor'],
    }),
    /** Runs the backend irrigation check for a city and emails the farmer if needed. */
    triggerIrrigationAlert: b.mutation({
      query: ({ city, soilMoisture }) => ({
        url: `/api/alert/city/${encodeURIComponent(city)}`, method: 'POST', body: { soilMoisture },
      }),
    }),
  }),
})

export const {
  useLatestReadingQuery, useRegisterDeviceKeyMutation, useResetMoistureMutation, useTriggerIrrigationAlertMutation,
} = sensorApi
