import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Help() {
  useDocumentTitle('Help & Support')
  return (
    <div className="page">
      <div className="card card-p">
        <h2 style={{ marginBottom: 20 }}>Help & Support</h2>

        {/* Email */}
        <div className="card card-hover" style={{ padding: 16, marginBottom: 14 }}>
          <h4>Email Support</h4>
          <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>
            Contact us for issues, bugs, or queries.
          </p>
          <a href="mailto:yourmail@gmail.com" className="btn">
            Send Email
          </a>
        </div>

        {/* LinkedIn */}
        <div className="card card-hover" style={{ padding: 16, marginBottom: 14 }}>
          <h4>LinkedIn</h4>
          <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>
            Connect professionally.
          </p>
          <a href="https://linkedin.com/in/YOUR_USERNAME" target="_blank" className="btn">
            Open LinkedIn
          </a>
        </div>

        {/* GitHub */}
        <div className="card card-hover" style={{ padding: 16 }}>
          <h4>GitHub</h4>
          <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>
            View source code & contribute.
          </p>
          <a href="https://github.com/YOUR_USERNAME" target="_blank" className="btn">
            View GitHub
          </a>
        </div>
      </div>
    </div>
  )
}