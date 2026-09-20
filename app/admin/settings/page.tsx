'use client'

import React, { useEffect, useState } from 'react'
import {
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Building2,
  Receipt,
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  EyeOff,
} from 'lucide-react'
import { getAppSettingsAction, updateAppSettingsAction } from '@/app/actions/settings'
import {
  getAllCatalogItemsAction,
  createCatalogItemAction,
  updateCatalogItemAction,
  deleteCatalogItemAction,
} from '@/app/actions/invoice'
import { AppSettings, AppSettingsInput, InvoiceCatalogItem } from '@/lib/types'

type Tab = 'business' | 'invoice' | 'catalog'

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'business', label: 'Business & Branding', icon: Building2 },
  { id: 'invoice', label: 'Invoice Defaults', icon: Receipt },
  { id: 'catalog', label: 'Item Catalog', icon: Package },
]

function formatMoney(n: number) {
  return `$${(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('business')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<AppSettingsInput | null>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const settings = await getAppSettingsAction()
        if (!ignore) setForm(toInput(settings))
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  function toInput(settings: AppSettings): AppSettingsInput {
    const { id, updated_at, ...rest } = settings
    void id; void updated_at
    return rest
  }

  function update<K extends keyof AppSettingsInput>(key: K, value: AppSettingsInput[K]) {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSave() {
    if (!form) return
    setError(null)
    setSuccessMsg(null)
    try {
      setSaving(true)
      const res = await updateAppSettingsAction(form)
      setForm(toInput(res.settings))
      setSuccessMsg('Settings saved. Changes apply to every new email and invoice from now on.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loader h-[60vh]">
        <Loader2 className="admin-loader-icon animate-spin" />
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="admin-error-bar">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6 max-w-4xl">
      <div>
        <h1 className="admin-heading">Settings</h1>
        <p className="admin-subheading">Change your business info, branding and invoice defaults yourself — no code changes needed.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-0" style={{ borderColor: 'var(--color-admin-card-border)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all cursor-pointer"
              style={active
                ? { borderColor: 'var(--color-admin-red)', color: 'var(--color-admin-navy)', background: 'var(--color-admin-page)' }
                : { borderColor: 'transparent', color: 'var(--color-admin-subtext)' }
              }
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="admin-error-bar">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'business' && form && (
        <BusinessTab form={form} update={update} />
      )}
      {activeTab === 'invoice' && form && (
        <InvoiceTab form={form} update={update} />
      )}
      {activeTab === 'catalog' && (
        <CatalogTab />
      )}

      {activeTab !== 'catalog' && (
        <div className="flex justify-end">
          <button
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#012269] hover:bg-[#011a4f] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      )}
    </div>
  )
}

function BusinessTab({ form, update }: { form: AppSettingsInput; update: <K extends keyof AppSettingsInput>(key: K, value: AppSettingsInput[K]) => void }) {
  return (
    <div className="admin-card-padded space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="admin-label block mb-1.5">Business Name *</label>
          <input value={form.business_name} onChange={e => update('business_name', e.target.value)} className="admin-input" />
        </div>
        <div>
          <label className="admin-label block mb-1.5">Tagline</label>
          <input value={form.tagline} onChange={e => update('tagline', e.target.value)} className="admin-input" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="admin-label block mb-1.5">MARN / Registration Number</label>
          <input value={form.marn_number} onChange={e => update('marn_number', e.target.value)} className="admin-input" />
        </div>
        <div>
          <label className="admin-label block mb-1.5">Logo URL</label>
          <input value={form.logo_url} onChange={e => update('logo_url', e.target.value)} placeholder="https://..." className="admin-input" />
        </div>
      </div>

      <div>
        <label className="admin-label block mb-1.5">Office Address</label>
        <input value={form.office_address} onChange={e => update('office_address', e.target.value)} className="admin-input" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="admin-label block mb-1.5">Contact Phone</label>
          <input value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} className="admin-input" />
        </div>
        <div>
          <label className="admin-label block mb-1.5">Contact Email</label>
          <input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} className="admin-input" />
        </div>
      </div>

      <div>
        <label className="admin-label block mb-1.5">Website URL</label>
        <input value={form.website_url} onChange={e => update('website_url', e.target.value)} placeholder="https://..." className="admin-input" />
      </div>

      <div className="pt-2 border-t" style={{ borderColor: 'var(--color-admin-card-border)' }}>
        <p className="admin-label mb-3">Social Links &amp; Reviews</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="admin-label block mb-1.5 font-normal normal-case">Facebook URL</label>
            <input value={form.facebook_url || ''} onChange={e => update('facebook_url', e.target.value)} placeholder="https://facebook.com/..." className="admin-input" />
          </div>
          <div>
            <label className="admin-label block mb-1.5 font-normal normal-case">Instagram URL</label>
            <input value={form.instagram_url || ''} onChange={e => update('instagram_url', e.target.value)} placeholder="https://instagram.com/..." className="admin-input" />
          </div>
          <div>
            <label className="admin-label block mb-1.5 font-normal normal-case">LinkedIn URL</label>
            <input value={form.linkedin_url || ''} onChange={e => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/..." className="admin-input" />
          </div>
          <div>
            <label className="admin-label block mb-1.5 font-normal normal-case">Google Review URL</label>
            <input value={form.google_review_url || ''} onChange={e => update('google_review_url', e.target.value)} placeholder="https://g.page/..." className="admin-input" />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">Used across every client email and invoice PDF footer: confirmations, reminders, signature requests, and invoices.</p>
    </div>
  )
}

function InvoiceTab({ form, update }: { form: AppSettingsInput; update: <K extends keyof AppSettingsInput>(key: K, value: AppSettingsInput[K]) => void }) {
  return (
    <div className="admin-card-padded space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="admin-label block mb-1.5">Invoice Number Prefix</label>
          <input value={form.invoice_prefix} onChange={e => update('invoice_prefix', e.target.value)} placeholder="INV-" className="admin-input" />
          <p className="text-xs text-gray-400 mt-1">New invoices look like {form.invoice_prefix || 'INV-'}000123.</p>
        </div>
        <div>
          <label className="admin-label block mb-1.5">Default Payment Terms</label>
          <input value={form.invoice_default_terms} onChange={e => update('invoice_default_terms', e.target.value)} placeholder="Due on Receipt" className="admin-input" />
        </div>
      </div>

      <div>
        <label className="admin-label block mb-1.5">Default Due Date Offset (days after invoice date)</label>
        <input
          type="number"
          min={0}
          max={365}
          value={form.invoice_due_days}
          onChange={e => update('invoice_due_days', parseInt(e.target.value, 10) || 0)}
          className="admin-input w-32"
        />
      </div>

      <div>
        <label className="admin-label block mb-1.5">Default Invoice Notes (e.g. bank details)</label>
        <textarea
          value={form.invoice_notes}
          onChange={e => update('invoice_notes', e.target.value)}
          rows={4}
          className="admin-input"
        />
      </div>

      <p className="text-xs text-gray-400">Applied to every new invoice — auto-generated from a booking, or created manually — unless overridden on that invoice.</p>
    </div>
  )
}

interface CatalogFormState {
  name: string
  description: string
  default_rate: string
  is_active: boolean
}

const EMPTY_CATALOG_FORM: CatalogFormState = { name: '', description: '', default_rate: '0', is_active: true }

function CatalogTab() {
  const [items, setItems] = useState<InvoiceCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalForm, setModalForm] = useState<CatalogFormState>(EMPTY_CATALOG_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const data = await getAllCatalogItemsAction()
        if (!ignore) setItems(data as InvoiceCatalogItem[])
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  function openAddModal() {
    setEditingId(null)
    setModalForm(EMPTY_CATALOG_FORM)
    setIsModalOpen(true)
  }

  function openEditModal(item: InvoiceCatalogItem) {
    setEditingId(item.id)
    setModalForm({
      name: item.name,
      description: item.description || '',
      default_rate: String(item.default_rate),
      is_active: item.is_active !== false,
    })
    setIsModalOpen(true)
  }

  async function handleModalSave(e: React.FormEvent) {
    e.preventDefault()
    if (!modalForm.name.trim()) return
    try {
      setSaving(true)
      const payload = {
        name: modalForm.name.trim(),
        description: modalForm.description.trim() || undefined,
        default_rate: parseFloat(modalForm.default_rate) || 0,
      }
      if (editingId) {
        const res = await updateCatalogItemAction(editingId, { ...payload, is_active: modalForm.is_active })
        setItems(prev => prev.map(i => (i.id === editingId ? res.item : i)))
      } else {
        const res = await createCatalogItemAction(payload)
        setItems(prev => [...prev, res.item].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setIsModalOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this catalog item? Past invoices that used it are not affected.')) return
    try {
      setDeletingId(id)
      await deleteCatalogItemAction(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="admin-loader h-[30vh]">
        <Loader2 className="admin-loader-icon animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="admin-error-bar">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">These appear as suggestions in the item dropdown when building an invoice.</p>
        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-[#E40229] hover:bg-[#c80224] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>

      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="admin-thead">
              <tr>
                <th>Item Name</th>
                <th>Description</th>
                <th className="text-right">Default Rate</th>
                <th>Status</th>
                <th className="text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="admin-tbody">
              {items.map(item => (
                <tr key={item.id} className="admin-tr">
                  <td className="admin-td font-bold" style={{ color: 'var(--color-admin-heading)' }}>{item.name}</td>
                  <td className="admin-td admin-cell-muted max-w-xs truncate">{item.description || '—'}</td>
                  <td className="admin-td text-right font-semibold">{formatMoney(item.default_rate)}</td>
                  <td className="admin-td">
                    {item.is_active === false ? (
                      <span className="admin-badge admin-badge-error"><EyeOff className="w-3 h-3" /> Inactive</span>
                    ) : (
                      <span className="admin-badge admin-badge-success">Active</span>
                    )}
                  </td>
                  <td className="admin-td text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                      >
                        {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-td text-center text-gray-400 py-8">No catalog items yet. Add one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)} />
          <div className="admin-modal-box max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="admin-modal-title mb-0">{editingId ? 'Edit Item' : 'Add Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleModalSave} className="space-y-3">
              <div>
                <label className="admin-label block mb-1.5">Item Name *</label>
                <input required value={modalForm.name} onChange={e => setModalForm(f => ({ ...f, name: e.target.value }))} className="admin-input" />
              </div>
              <div>
                <label className="admin-label block mb-1.5">Description</label>
                <input value={modalForm.description} onChange={e => setModalForm(f => ({ ...f, description: e.target.value }))} className="admin-input" />
              </div>
              <div>
                <label className="admin-label block mb-1.5">Default Rate (AUD)</label>
                <input
                  type="number" min={0} step="0.01"
                  value={modalForm.default_rate}
                  onChange={e => setModalForm(f => ({ ...f, default_rate: e.target.value }))}
                  className="admin-input"
                />
              </div>
              {editingId && (
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={modalForm.is_active}
                    onChange={e => setModalForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-[#012269]"
                  />
                  Active (shows up when building an invoice)
                </label>
              )}
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border text-gray-600 hover:bg-gray-100 font-medium text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-[#012269] hover:bg-[#011a4f] text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {editingId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
