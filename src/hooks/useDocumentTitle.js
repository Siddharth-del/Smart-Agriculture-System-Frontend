import { useEffect } from 'react'

/**
 * Sets document.title for the lifetime of the page that calls it, then
 * restores whatever it was before on unmount. Deliberately not using a
 * library like react-helmet — a full SPA doesn't need one just for
 * <title>, and this keeps the dependency count down.
 *
 * @param {string} title - page-specific title, without the brand suffix
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} — AgriPro` : 'AgriPro — Smart Agriculture'
    return () => { document.title = prev }
  }, [title])
}
