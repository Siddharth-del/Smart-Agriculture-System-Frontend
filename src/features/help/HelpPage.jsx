import { LifeBuoy, Bug, Mail, BookOpen } from 'lucide-react'
import { Button, Card, CardHeader, PageHeader } from '../../shared/ui'
import { useDocumentTitle } from '../../shared/hooks'

const REPO = 'https://github.com/Siddharth-del/Smart-Agriculture-System-Frontend'
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL

const FAQ = [
  ['My sensor shows “No readings yet”.', 'Register the device key from your ESP32 firmware on the Field monitor page, and check the device has power and Wi-Fi. Readings appear within a minute of the first successful post.'],
  ['Plant Doctor says it couldn’t analyse my photo.', 'Use a clear daylight photo where a single leaf fills most of the frame. JPG, PNG or WEBP files up to 10 MB work best.'],
  ['Why does the crop planner need my location?', 'It reads live temperature and humidity for your district, which the recommendation model uses alongside your soil values.'],
  ['Weather shows the wrong place.', 'Update the district on your Farm profile. The dashboard uses it to look up local conditions.'],
  ['I stopped getting irrigation emails.', 'Alerts go to the email on your account. The backend waits between emails so one dry sensor doesn’t flood your inbox.'],
]

export default function HelpPage() {
  useDocumentTitle('Help')
  return (
    <div className="page page--narrow">
      <PageHeader title="Help" description="Answers to common questions and ways to reach us." />
      <Card aria-labelledby="faq-h">
        <CardHeader id="faq-h" title="Common questions" icon={BookOpen} />
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q} className="faq__item"><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </Card>
      <Card aria-labelledby="contact-h">
        <CardHeader id="contact-h" title="Still stuck?" icon={LifeBuoy} />
        <div className="form-actions form-actions--start">
          <Button variant="secondary" icon={Bug} onClick={() => window.open(`${REPO}/issues/new`, '_blank', 'noopener,noreferrer')}>Report an issue on GitHub</Button>
          {SUPPORT_EMAIL && <Button variant="ghost" icon={Mail} onClick={() => { window.location.href = `mailto:${SUPPORT_EMAIL}` }}>Email support</Button>}
        </div>
      </Card>
    </div>
  )
}
