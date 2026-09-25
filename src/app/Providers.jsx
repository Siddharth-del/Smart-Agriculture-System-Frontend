import { useEffect } from 'react'
import { Provider, useSelector } from 'react-redux'
import { store } from './store'
import { ToastProvider } from '../shared/toast/ToastProvider'
import { useMediaQuery } from '../shared/hooks'

function ThemeSync() {
  const { theme, lang } = useSelector((s) => s.settings)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved
    root.style.colorScheme = resolved
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#101712' : '#1F5132')
  }, [resolved])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  return null
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeSync />
      <ToastProvider>{children}</ToastProvider>
    </Provider>
  )
}
