import { api } from '../../app/api'

export const weatherApi = api.injectEndpoints({
  endpoints: (b) => ({
    /** OpenWeather-shaped WeatherResponse proxied by the backend. */
    weatherByCity: b.query({
      query: (city) => `/api/weather/city/${encodeURIComponent(city.trim())}`,
      keepUnusedDataFor: 600,
    }),
  }),
})

export const { useWeatherByCityQuery, useLazyWeatherByCityQuery } = weatherApi
