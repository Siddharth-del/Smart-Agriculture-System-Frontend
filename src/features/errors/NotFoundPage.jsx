import { MapPinOff } from 'lucide-react'
import { EmptyState, Button } from '../../shared/ui'
import { useDocumentTitle } from '../../shared/hooks'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="ui-empty--page">
      <EmptyState icon={MapPinOff} title="This page doesn’t exist" action={<Button to="/app">Back to AgriPro</Button>}>
        The link may be old or mistyped.
      </EmptyState>
    </div>
  )
}
