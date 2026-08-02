/** tone: green | amber | red | blue | muted */
export default function Badge({ tone = 'green', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
