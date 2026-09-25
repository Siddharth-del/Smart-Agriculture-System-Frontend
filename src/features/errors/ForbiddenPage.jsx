import { useSelector } from 'react-redux'
import { Lock } from 'lucide-react'
import { EmptyState, Button } from '../../shared/ui'
import { selectRoles, homePathFor } from '../auth/authSlice'
import { useDocumentTitle } from '../../shared/hooks'

export default function ForbiddenPage() {
  useDocumentTitle('No access')
  const roles = useSelector(selectRoles)
  return (
    <div className="ui-empty--page">
      <EmptyState icon={Lock} title="You don’t have access to this page" action={<Button to={homePathFor(roles)}>Go to your home page</Button>}>
        Your account role doesn’t include this area. If you think that’s wrong, ask an administrator to update your role.
      </EmptyState>
    </div>
  )
}
