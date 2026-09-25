import { api } from '../../app/api'

const aiLang = (lang) => (lang === 'hi' ? 'Hindi' : 'English')

export const advisoryApi = api.injectEndpoints({
  endpoints: (b) => ({
    diseaseAdvisory: b.mutation({
      query: ({ disease, lang }) => ({
        url: '/api/ai/disease', method: 'POST', params: { disease, lang: aiLang(lang) }, timeout: 60000,
      }),
    }),
    /** sensorData mirrors the backend SensorData entity (nitrogen, ph, temperature, …). */
    cropAdvisory: b.mutation({
      query: ({ crop, lang, sensorData }) => ({
        url: '/api/ai/crop', method: 'POST', params: { crop, lang: aiLang(lang) }, body: sensorData ?? {}, timeout: 60000,
      }),
    }),
  }),
})

export const { useDiseaseAdvisoryMutation, useCropAdvisoryMutation } = advisoryApi
