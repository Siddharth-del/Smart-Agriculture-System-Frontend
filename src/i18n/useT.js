import { useSelector } from 'react-redux'
import { getT } from './index'

export function useT() {
  const lang = useSelector((s) => s.settings.lang)
  const dict = getT(lang)
  return (key, fallback) => dict[key] ?? fallback ?? key
}
