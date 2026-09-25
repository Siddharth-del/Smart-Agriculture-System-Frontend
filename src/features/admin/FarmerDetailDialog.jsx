import { useFarmerQuery } from './adminApi'
import { Button, DescriptionList, Dialog, ErrorState, SkeletonText } from '../../shared/ui'

export default function FarmerDetailDialog({ userId, onClose, onDelete }) {
  const q = useFarmerQuery(userId, { skip: userId == null })
  const f = q.data
  return (
    <Dialog
      open={userId != null} onClose={onClose} title={f?.fullname || 'Farmer details'} description={f ? `@${f.username}` : undefined}
      footer={<><Button variant="ghost" onClick={onClose}>Close</Button>{f && <Button variant="danger" onClick={() => onDelete(f)}>Delete farmer</Button>}</>}
    >
      {q.isLoading ? <SkeletonText lines={6} /> : q.error ? <ErrorState compact error={q.error} onRetry={q.refetch} /> : f && (
        <DescriptionList items={[
          { term: 'User ID', value: f.userId }, { term: 'Email', value: f.email && <a href={`mailto:${f.email}`}>{f.email}</a> },
          { term: 'Mobile', value: f.contactNumber && <a href={`tel:${f.contactNumber}`}>{f.contactNumber}</a> },
          { term: 'Address', value: f.address }, { term: 'Village', value: f.village }, { term: 'District', value: f.district },
          { term: 'State', value: f.state }, { term: 'PIN code', value: f.pincode }, { term: 'Farm location', value: f.farmLocation },
        ]} />
      )}
    </Dialog>
  )
}
