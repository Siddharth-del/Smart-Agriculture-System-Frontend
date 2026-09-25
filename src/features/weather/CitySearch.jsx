import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button, Field, Input } from '../../shared/ui'

export default function CitySearch({ onSearch, initial = '', loading, label = 'City or district', submitLabel = 'Check weather' }) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const v = value.trim()
    if (v.length < 2) { setError('Enter at least 2 letters.'); return }
    if (!/^[\p{L} .'-]+$/u.test(v)) { setError('Use letters only, for example “Agra”.'); return }
    setError('')
    onSearch(v)
  }
  return (
    <form onSubmit={submit} className="search-row" role="search" noValidate>
      <Field label={label} error={error} className="search-row__field">
        <Input value={value} onChange={(e) => { setValue(e.target.value); setError('') }} prefix={<Search size={16} aria-hidden="true" />} autoComplete="address-level2" enterKeyHint="search" />
      </Field>
      <Button type="submit" loading={loading}>{submitLabel}</Button>
    </form>
  )
}
