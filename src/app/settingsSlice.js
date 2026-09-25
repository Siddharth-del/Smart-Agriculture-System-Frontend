import { createSlice } from '@reduxjs/toolkit'

const read = (k, fallback, allowed) => {
  try {
    const v = localStorage.getItem(k)
    return allowed.includes(v) ? v : fallback
  } catch { return fallback }
}
const write = (k, v) => { try { localStorage.setItem(k, v) } catch { /* noop */ } }

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    theme: read('ap_theme', 'system', ['light', 'dark', 'system']),
    lang: read('ap_lang', 'en', ['en', 'hi']),
  },
  reducers: {
    setTheme(state, { payload }) { state.theme = payload; write('ap_theme', payload) },
    setLang(state, { payload }) { state.lang = payload; write('ap_lang', payload) },
  },
})

export const { setTheme, setLang } = settingsSlice.actions
export default settingsSlice.reducer
