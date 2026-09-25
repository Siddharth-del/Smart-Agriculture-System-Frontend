import { useEffect, useState } from 'react'
import { UserRound, MapPin, Trash2, Pencil, Save } from 'lucide-react'
import { useCreateProfileMutation, useDeleteProfileMutation, useMyProfileQuery, useUpdateProfileMutation } from './profileApi'
import { Alert, Button, Card, CardHeader, ConfirmDialog, DescriptionList, ErrorState, Field, Input, PageHeader, Select, SkeletonText } from '../../shared/ui'
import { useDocumentTitle, useForm } from '../../shared/hooks'
import { rules } from '../../shared/utils/validation'
import { useToast } from '../../shared/toast/ToastProvider'

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry']

const EMPTY = { fullname: '', contactNumber: '', address: '', village: '', district: '', state: '', pincode: '', farmLocation: '' }
const SCHEMA = {
  fullname: [rules.required('Full name'), rules.minLength('Full name', 3), rules.maxLength('Full name', 20)],
  contactNumber: [rules.required('Mobile number'), rules.pattern(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.')],
  address: [rules.required('Address'), rules.maxLength('Address', 200)],
  village: [rules.required('Village'), rules.maxLength('Village', 60)],
  district: [rules.required('District'), rules.maxLength('District', 60)],
  state: [rules.required('State')],
  pincode: [rules.required('PIN code'), rules.pattern(/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code.')],
  farmLocation: [rules.required('Farm location'), rules.maxLength('Farm location', 120)],
}
const pick = (p) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, p?.[k] ?? '']))

export default function ProfilePage() {
  useDocumentTitle('Farm profile')
  const toast = useToast()
  const q = useMyProfileQuery()
  const [create, createState] = useCreateProfileMutation()
  const [update, updateState] = useUpdateProfileMutation()
  const [remove, removeState] = useDeleteProfileMutation()
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const exists = Boolean(q.data?.profileId)
  // A missing profile comes back as 404 (or a 500 from older backends).
  const missing = !exists && (q.error?.code === 'NOT_FOUND' || q.error?.status >= 500 || (q.isSuccess && !q.data?.profileId))
  const form = useForm(EMPTY, SCHEMA)
  const { reset } = form

  useEffect(() => { if (q.data?.profileId) reset(pick(q.data)) }, [q.data, reset])

  const onSubmit = form.handleSubmit(async (v) => {
    const body = Object.fromEntries(Object.entries(v).map(([k, val]) => [k, String(val).trim()]))
    try {
      await (exists ? update(body) : create(body)).unwrap()
      toast.success(exists ? 'Farm profile saved.' : 'Farm profile created.')
      setEditing(false)
    } catch (e) {
      if (e.fieldErrors) {
        const map = { ...e.fieldErrors }
        form.setServerErrors(map)
      } else toast.error(e.message)
    }
  })

  const doDelete = async () => {
    try {
      await remove().unwrap()
      toast.success('Farm profile deleted.')
      setConfirm(false)
      reset(EMPTY)
    } catch (e) { toast.error(e.message) }
  }

  const saving = createState.isLoading || updateState.isLoading
  const showForm = editing || missing

  if (q.isLoading) return <div className="page"><PageHeader title="Farm profile" /><Card><SkeletonText lines={8} /></Card></div>
  if (q.error && !missing) return <div className="page"><PageHeader title="Farm profile" /><Card><ErrorState error={q.error} onRetry={q.refetch} /></Card></div>

  return (
    <div className="page page--narrow">
      <PageHeader
        title="Farm profile"
        description="Your location sets local weather, alerts and crop recommendations."
        actions={exists && !editing && (
          <>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit profile</Button>
            <Button variant="ghost" icon={Trash2} onClick={() => setConfirm(true)}>Delete</Button>
          </>
        )}
      />

      {showForm ? (
        <Card aria-labelledby="pf-h">
          <CardHeader id="pf-h" title={exists ? 'Edit farm details' : 'Set up your farm'} icon={UserRound} />
          {missing && <Alert tone="info">You haven’t added farm details yet. This takes about a minute.</Alert>}
          <form onSubmit={onSubmit} noValidate className="ui-stack">
            <fieldset className="form-grid-2">
              <legend className="subhead span-2">About you</legend>
              <Field label="Full name" error={form.field('fullname').error} required><Input {...form.field('fullname')} autoComplete="name" maxLength={20} /></Field>
              <Field label="Mobile number" error={form.field('contactNumber').error} required>
                <Input {...form.field('contactNumber')} type="tel" inputMode="tel" autoComplete="tel" prefix="+91" maxLength={14} />
              </Field>
            </fieldset>
            <fieldset className="form-grid-2">
              <legend className="subhead span-2">Where you farm</legend>
              <Field label="Address" error={form.field('address').error} className="span-2" required><Input {...form.field('address')} autoComplete="street-address" /></Field>
              <Field label="Village" error={form.field('village').error} required><Input {...form.field('village')} /></Field>
              <Field label="District" hint="Used for local weather." error={form.field('district').error} required><Input {...form.field('district')} autoComplete="address-level2" /></Field>
              <Field label="State" error={form.field('state').error} required><Select {...form.field('state')} options={STATES} placeholder="Select state" autoComplete="address-level1" /></Field>
              <Field label="PIN code" error={form.field('pincode').error} required><Input {...form.field('pincode')} inputMode="numeric" autoComplete="postal-code" maxLength={6} /></Field>
              <Field label="Farm location" hint="Nearest town or landmark, e.g. “Near Fatehabad road”." error={form.field('farmLocation').error} className="span-2" required><Input {...form.field('farmLocation')} /></Field>
            </fieldset>
            <div className="form-actions">
              {exists && <Button variant="ghost" onClick={() => { reset(pick(q.data)); setEditing(false) }} disabled={saving}>Cancel</Button>}
              <Button type="submit" icon={Save} loading={saving}>{exists ? 'Save profile' : 'Create profile'}</Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="grid-2">
          <Card aria-labelledby="you-h">
            <CardHeader id="you-h" title="Farmer" icon={UserRound} />
            <DescriptionList items={[
              { term: 'Name', value: q.data.fullname }, { term: 'Mobile', value: q.data.contactNumber },
              { term: 'Email', value: q.data.email }, { term: 'Username', value: q.data.username },
            ]} />
          </Card>
          <Card aria-labelledby="farm-h">
            <CardHeader id="farm-h" title="Farm" icon={MapPin} />
            <DescriptionList items={[
              { term: 'Address', value: q.data.address }, { term: 'Village', value: q.data.village },
              { term: 'District', value: q.data.district }, { term: 'State', value: q.data.state },
              { term: 'PIN code', value: q.data.pincode }, { term: 'Farm location', value: q.data.farmLocation },
            ]} />
          </Card>
        </div>
      )}

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} loading={removeState.isLoading} title="Delete your farm profile?" confirmLabel="Delete profile">
        <p>Your farm details will be removed. Your account and sensor readings stay, but weather and alerts won’t know your location until you add it again.</p>
      </ConfirmDialog>
    </div>
  )
}
