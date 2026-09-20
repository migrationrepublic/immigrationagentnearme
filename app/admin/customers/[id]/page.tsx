'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  UserCircle2,
  Sparkles,
  Receipt as ReceiptIcon,
} from 'lucide-react'
import {
  getCustomerAction,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from '@/app/actions/customer'
import { Customer, CustomerType } from '@/lib/types'

const SALUTATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.']
const LANGUAGES = ['English', 'Urdu', 'Hindi', 'Punjabi', 'Chinese', 'Arabic']

function formatMoney(n: number) {
  return `$${(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CustomerEditorPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const isNew = params.id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)

  const [customerType, setCustomerType] = useState<CustomerType>('individual')
  const [salutation, setSalutation] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  // null = the admin hasn't typed a display name yet, so it tracks the
  // suggested value derived from the fields below; any keystroke "pins" it.
  const [displayNameOverride, setDisplayNameOverride] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [workPhone, setWorkPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [language, setLanguage] = useState('English')

  useEffect(() => {
    let ignore = false
    async function load() {
      if (isNew) return
      try {
        const c = await getCustomerAction(params.id)
        if (ignore) return
        if (!c) {
          setError('Customer not found.')
          return
        }
        setCustomer(c)
        setCustomerType(c.customer_type)
        setSalutation(c.salutation || '')
        setFirstName(c.first_name || '')
        setLastName(c.last_name || '')
        setCompanyName(c.company_name || '')
        setDisplayNameOverride(c.display_name)
        setEmail(c.email || '')
        setWorkPhone(c.work_phone || '')
        setMobile(c.mobile || '')
        setLanguage(c.language || 'English')
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [params.id, isNew])

  // Auto-suggest a display name from the contact/company fields until the
  // admin types one directly — mirrors Zoho's "Select or type to add"
  // combobox without the extra dropdown machinery. Derived during render
  // (not an effect) so there's no extra render pass or lint hazard.
  const suggestedDisplayName = customerType === 'business'
    ? companyName
    : [firstName, lastName].filter(Boolean).join(' ')
  const displayName = displayNameOverride ?? suggestedDisplayName

  async function handleSave() {
    setError(null)
    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }

    const payload = {
      customer_type: customerType,
      salutation: salutation || undefined,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      company_name: companyName || undefined,
      display_name: displayName.trim(),
      email: email || undefined,
      work_phone: workPhone || undefined,
      mobile: mobile || undefined,
      language,
    }

    try {
      setSaving(true)
      if (isNew) {
        const res = await createCustomerAction(payload)
        router.push(`/admin/customers/${res.customer.id}`)
      } else {
        await updateCustomerAction(params.id, payload)
        router.push('/admin/customers')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!customer) return
    if (!confirm(`Delete customer "${customer.display_name}"? This cannot be undone.`)) return
    try {
      setIsDeleting(true)
      await deleteCustomerAction(customer.id)
      router.push('/admin/customers')
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loader h-[60vh]">
        <Loader2 className="admin-loader-icon animate-spin" />
      </div>
    )
  }

  if (error && !customer && !isNew) {
    return (
      <div className="admin-error-bar">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/admin/customers" className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
          </Link>
          <h1 className="admin-heading flex items-center gap-2">
            <UserCircle2 className="w-6 h-6" style={{ color: 'var(--color-admin-red)' }} />
            {isNew ? 'New Customer' : customer?.display_name}
          </h1>
        </div>

        {!isNew && customer && (
          <button
            disabled={isDeleting}
            onClick={handleDelete}
            className="px-3 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        )}
      </div>

      {!isNew && customer?.source === 'booking' && (
        <div className="p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold" style={{ borderColor: 'var(--color-badge-info-border)', background: 'var(--color-badge-info-bg)', color: 'var(--color-badge-info-text)' }}>
          <Sparkles className="w-4 h-4 shrink-0" />
          Added automatically from a consultation booking.
        </div>
      )}

      {!isNew && customer && (customer.receivables || 0) > 0 && (
        <div className="admin-card-padded flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 admin-label">
            <ReceiptIcon className="w-3.5 h-3.5" /> Outstanding Receivables
          </div>
          <span className="admin-value text-lg" style={{ color: 'var(--color-admin-red)' }}>{formatMoney(customer.receivables || 0)}</span>
        </div>
      )}

      {error && (
        <div className="admin-error-bar">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-card-padded space-y-5">
        <div>
          <label className="admin-label block mb-2">Customer Type</label>
          <div className="flex items-center gap-6">
            {(['business', 'individual'] as CustomerType[]).map(type => (
              <label key={type} className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="customer_type"
                  checked={customerType === type}
                  onChange={() => setCustomerType(type)}
                  className="w-4 h-4 accent-[#012269]"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="admin-label block mb-1.5">Primary Contact</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={salutation} onChange={e => setSalutation(e.target.value)} className="admin-select">
              <option value="">Salutation</option>
              {SALUTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="admin-input" />
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="admin-input" />
          </div>
        </div>

        <div>
          <label className="admin-label block mb-1.5">Company Name</label>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="admin-input" />
        </div>

        <div>
          <label className="admin-label block mb-1.5" style={{ color: 'var(--color-admin-red)' }}>Display Name *</label>
          <input
            value={displayName}
            onChange={e => setDisplayNameOverride(e.target.value)}
            placeholder="Select or type to add"
            className="admin-input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="admin-label block mb-1.5">Currency</label>
            <input value="AUD - Australian Dollar" disabled className="admin-input opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="admin-label block mb-1.5">Customer Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="admin-select">
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="admin-label block mb-1.5">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@example.com" className="admin-input" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="admin-label block mb-1.5">Work Phone</label>
            <input value={workPhone} onChange={e => setWorkPhone(e.target.value)} placeholder="+61 4XX XXX XXX" className="admin-input" />
          </div>
          <div>
            <label className="admin-label block mb-1.5">Mobile</label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+61 4XX XXX XXX" className="admin-input" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/admin/customers" className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
          Cancel
        </Link>
        <button
          disabled={saving}
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-[#012269] hover:bg-[#011a4f] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Customer
        </button>
      </div>
    </div>
  )
}
