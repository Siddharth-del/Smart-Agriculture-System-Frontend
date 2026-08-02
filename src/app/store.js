import { createSlice, configureStore } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:  JSON.parse(sessionStorage.getItem('ap_user'))  || null,
    token: sessionStorage.getItem('ap_token') || null,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user  = payload.user
      state.token = payload.token
      sessionStorage.setItem('ap_user',  JSON.stringify(payload.user))
      sessionStorage.setItem('ap_token', payload.token)
    },
    logout: (state) => {
      state.user  = null
      state.token = null
      sessionStorage.clear()
    },
  },
})

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    theme: localStorage.getItem('ap_theme') || 'light',
    lang:  localStorage.getItem('ap_lang')  || 'en',
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('ap_theme', state.theme)
      document.documentElement.setAttribute('data-theme', state.theme)
    },
    setLang: (state, { payload }) => {
      state.lang = payload
      localStorage.setItem('ap_lang', payload)
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export const { toggleTheme, setLang }   = settingsSlice.actions

export const store = configureStore({
  reducer: { auth: authSlice.reducer, settings: settingsSlice.reducer },
})
