const STEPS = ['Your email', 'Enter code', 'New password']

/** Where the person is in the three-page reset flow. `current` is 0, 1 or 2. */
export default function ResetSteps({ current }) {
  return (
    <ol className="reset-steps" aria-label="Password reset progress">
      {STEPS.map((label, i) => {
        const state = i < current ? 'is-done' : i === current ? 'is-current' : ''
        return (
          <li key={label} className={`reset-steps__item ${state}`.trim()} aria-current={i === current ? 'step' : undefined}>
            <span className="reset-steps__bar" aria-hidden="true" />
            <span>{label}{i < current && <span className="sr-only"> (done)</span>}</span>
          </li>
        )
      })}
    </ol>
  )
}
