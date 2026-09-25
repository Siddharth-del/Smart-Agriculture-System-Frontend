import { useState } from 'react'
import { useDeleteFarmerMutation } from './adminApi'
import { ConfirmDialog } from '../../shared/ui'
import { useToast } from '../../shared/toast/ToastProvider'

export function useDeleteFarmerFlow({ onDeleted } = {}) {
  const toast = useToast()
  const [target, setTarget] = useState(null)
  const [del, { isLoading }] = useDeleteFarmerMutation()
  const confirm = async () => {
    try {
      await del(target.userId).unwrap()
      toast.success(`${target.fullname || target.username} was deleted.`)
      onDeleted?.(target)
      setTarget(null)
    } catch (e) { toast.error(e.message) }
  }
  const dialog = (
    <ConfirmDialog open={Boolean(target)} onClose={() => setTarget(null)} onConfirm={confirm} loading={isLoading} title="Delete this farmer?" confirmLabel="Delete farmer">
      <p><strong>{target?.fullname}</strong> ({target?.username}) and their farm profile will be permanently removed. This can’t be undone.</p>
    </ConfirmDialog>
  )
  return { requestDelete: setTarget, dialog }
}
