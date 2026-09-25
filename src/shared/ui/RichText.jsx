/**
 * Renders plain-text AI advisory output as readable paragraphs, lists and
 * subheadings. Text is never injected as HTML, so model output cannot run script.
 */
const strip = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^\*+|\*+$/g, '').trim()
const BULLET = /^([-*•]|\d+[.)])\s+/

export function RichText({ text }) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="ui-prose">
      {blocks.map((b, i) => {
        const lines = b.split('\n').map((l) => l.trim()).filter(Boolean)
        const heading = lines[0].match(/^#{1,6}\s+(.*)$/)
        if (heading && lines.length === 1) return <h4 key={i}>{strip(heading[1])}</h4>
        if (lines.every((l) => BULLET.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{strip(l.replace(BULLET, ''))}</li>)}</ul>
        }
        if (lines.length > 1 && lines.slice(1).every((l) => BULLET.test(l))) {
          return (
            <div key={i}>
              <p><strong>{strip(lines[0].replace(/^#+\s*/, '').replace(/:$/, ''))}</strong></p>
              <ul>{lines.slice(1).map((l, j) => <li key={j}>{strip(l.replace(BULLET, ''))}</li>)}</ul>
            </div>
          )
        }
        return <p key={i}>{strip(lines.join(' ').replace(/^#+\s*/, ''))}</p>
      })}
    </div>
  )
}
