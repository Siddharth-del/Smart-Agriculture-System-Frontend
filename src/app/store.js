import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from './api'
import authReducer, { signedOut, sessionExpired } from '../features/auth/authSlice'
import settingsReducer from './settingsSlice'
import sensorHistoryReducer, { historyCleared } from '../features/sensors/sensorHistorySlice'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    settings: settingsReducer,
    sensorHistory: sensorHistoryReducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
  devTools: !import.meta.env.PROD,
})

// Never let one user's cached data leak into the next session on a shared device.
let prevUser = store.getState().auth.user?.username
store.subscribe(() => {
  const user = store.getState().auth.user?.username
  if (prevUser && prevUser !== user) {
    store.dispatch(api.util.resetApiState())
    store.dispatch(historyCleared())
  }
  prevUser = user
})

setupListeners(store.dispatch) // refetch on focus/reconnect where enabled

// Backwards-compatible exports used by the landing page.
export { setLang } from './settingsSlice'
export { signedOut as logout, sessionExpired }
