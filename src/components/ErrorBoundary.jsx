import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // In production this would report to an error-tracking service.
    console.error('Uncaught error in app tree:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page" role="alert">
          <div className="empty" style={{ minHeight: '60vh' }}>
            <div className="empty-label" />
            <h3>Something went wrong</h3>
            <p style={{ marginBottom: 18 }}>
              An unexpected error occurred while rendering this page.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
