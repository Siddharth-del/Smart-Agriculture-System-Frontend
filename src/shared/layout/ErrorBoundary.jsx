import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

/** Catches render errors so one broken widget never blanks the whole app. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error, info) {
    // Hook for Sentry or similar: window.__reportError?.(error, info)
    console.error('[AgriPro] UI error', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    const chunkFailed = /dynamically imported module|Loading chunk|Failed to fetch/i.test(this.state.error?.message || '')
    return (
      <div className="ui-empty ui-empty--error ui-empty--page" role="alert">
        <span className="ui-empty__icon"><AlertTriangle size={26} aria-hidden="true" /></span>
        <p className="ui-empty__title">{chunkFailed ? 'A new version is available' : 'This page ran into a problem'}</p>
        <p className="ui-empty__text">
          {chunkFailed ? 'AgriPro was updated while you were using it. Reload to get the latest version.' : 'Your data is safe. Reload the page, and if it keeps happening, report it from the Help page.'}
        </p>
        <button type="button" className="ui-btn ui-btn--primary ui-btn--md" onClick={() => window.location.reload()}>Reload page</button>
      </div>
    )
  }
}
