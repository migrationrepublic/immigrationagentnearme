'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  Download,
  Send,
  Save,
  AlertCircle,
  CreditCard,
  Calendar,
  CheckCircle2,
  Sparkles,
  Pencil,
  X,
} from 'lucide-react'
import {
  getInvoiceAction,
  getInvoiceEditorDataAction,
  createInvoiceAction,
  updateInvoiceAction,
  recordInvoicePaymentAction,
  sendInvoiceEmailAction,
  deleteInvoiceAction,
} from '@/app/actions/invoice'
import { AppSettings, Invoice, InvoiceCatalogItem, InvoiceLineItemInput, InvoiceStatus } from '@/lib/types'

function formatMoney(n: number) {
  return `$${(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d?: string | null) {
  if (!d) return ''
  const date = new Date(`${d}T00:00:00`)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-AU')
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function emptyLine(): InvoiceLineItemInput {
  return { item_name: '', description: '', quantity: 1, rate: 0, discount_percent: 0, tax_percent: 0 }
}

function lineAmount(item: InvoiceLineItemInput) {
  const gross = item.quantity * item.rate
  const discount = gross * ((item.discount_percent || 0) / 100)
  return Math.round((gross - discount) * 100) / 100
}

interface ComboboxProps<T> {
  value: string
  onChangeText: (text: string) => void
  options: T[]
  getLabel: (opt: T) => string
  getKey: (opt: T) => string
  onSelect: (opt: T) => void
  renderOption: (opt: T) => React.ReactNode
  placeholder?: string
  className?: string
  emptyHint?: string
}

/**
 * A real styled autocomplete dropdown (filters as you type, click to select)
 * — replaces the native HTML `<datalist>`, which renders as an unstyled
 * browser popup that can't show a second line (rate, email, description)
 * per option and looks inconsistent across browsers.
 *
 * Renders its panel through a portal into `document.body`, positioned via
 * the input's own bounding box — this is a table cell, and a table wrapper
 * with `overflow-x-auto` implicitly clips vertical overflow too, which would
 * otherwise cut the dropdown off for any row near the bottom.
 */
function Combobox<T>({
  value, onChangeText, options, getLabel, getKey, onSelect, renderOption, placeholder, className, emptyHint,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  function openDropdown() {
    const el = wrapperRef.current
    if (el) {
      const r = el.getBoundingClientRect()
      setRect({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      // The panel lives in a portal, so it's outside wrapperRef in the real
      // DOM — check both refs before treating a click as "outside".
      if (wrapperRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleReposition() { setOpen(false) }
    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [open])

  const query = value.trim().toLowerCase()
  const filtered = query ? options.filter(opt => getLabel(opt).toLowerCase().includes(query)) : options

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={value}
        onChange={e => { onChangeText(e.target.value); openDropdown() }}
        onFocus={openDropdown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && rect && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[100] max-h-64 overflow-y-auto bg-white border rounded-xl shadow-lg py-1"
          style={{ top: rect.top, left: rect.left, width: rect.width, borderColor: '#e5e7eb' }}
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">{emptyHint || 'No matches — keep typing to enter your own.'}</p>
          ) : (
            filtered.map(opt => (
              <button
                key={getKey(opt)}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onSelect(opt); setOpen(false) }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {renderOption(opt)}
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

const RIBBON_COLOR: Record<string, string> = {
  draft: '#9ca3af',
  sent: '#2563eb',
  paid: '#16a34a',
  overdue: '#dc2626',
  cancelled: '#6b7280',
}

/** Read-only, Zoho-style rendering of the invoice as a printed document. */
function InvoiceDocument({ invoice, settings }: { invoice: Invoice; settings: AppSettings | null }) {
  const lineItems = invoice.line_items || []
  const hasDiscount = lineItems.some(li => Number(li.discount_percent) > 0)
  const hasTax = lineItems.some(li => Number(li.tax_percent) > 0)
  const websiteLabel = settings?.website_url?.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <div className="relative bg-white border rounded-md overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
      {/* Diagonal status ribbon, top-left corner */}
      <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none">
        <div
          className="absolute text-center text-[11px] font-bold uppercase tracking-wider text-white py-1 -rotate-45"
          style={{ top: 22, left: -40, width: 170, background: RIBBON_COLOR[invoice.status] || '#9ca3af' }}
        >
          {invoice.status}
        </div>
      </div>

      <div className="px-6 sm:px-12 py-10">
        {/* Header: business info + invoice title */}
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div className="pl-6 sm:pl-0">
            <p className="font-bold text-gray-900">{settings?.business_name || 'Your Business'}</p>
            {settings?.office_address && <p className="text-sm text-gray-500 mt-1">{settings.office_address}</p>}
            {settings?.contact_email && <p className="text-sm text-gray-500">{settings.contact_email}</p>}
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-3xl font-light text-gray-800">Tax Invoice</h2>
            <p className="text-sm text-gray-500 mt-1"># {invoice.invoice_number}</p>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mt-4">Balance Due</p>
            <p className="text-xl font-bold text-gray-900">{formatMoney(invoice.balance_due)}</p>
          </div>
        </div>

        {/* Bill To / Invoice meta */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 mt-10">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1.5">Bill To</p>
            <p className="font-semibold" style={{ color: '#2563eb' }}>{invoice.bill_to_name}</p>
            <p className="text-sm text-gray-500">{invoice.bill_to_email}</p>
          </div>
          <table className="text-sm sm:ml-auto">
            <tbody>
              <tr>
                <td className="text-gray-500 pr-6 py-0.5">Invoice Date :</td>
                <td className="font-medium text-gray-800 text-right py-0.5">{formatDate(invoice.invoice_date)}</td>
              </tr>
              <tr>
                <td className="text-gray-500 pr-6 py-0.5">Terms :</td>
                <td className="font-medium text-gray-800 text-right py-0.5">{invoice.terms}</td>
              </tr>
              <tr>
                <td className="text-gray-500 pr-6 py-0.5">Due Date :</td>
                <td className="font-medium text-gray-800 text-right py-0.5">{formatDate(invoice.due_date)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Item table */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr style={{ background: '#2d2d2d' }}>
                <th className="text-white text-[11px] uppercase tracking-wide font-semibold text-left px-3 py-2.5 w-10">#</th>
                <th className="text-white text-[11px] uppercase tracking-wide font-semibold text-left px-3 py-2.5">Item &amp; Description</th>
                <th className="text-white text-[11px] uppercase tracking-wide font-semibold text-right px-3 py-2.5">Qty</th>
                <th className="text-white text-[11px] uppercase tracking-wide font-semibold text-right px-3 py-2.5">Rate</th>
                {hasDiscount && <th className="text-white text-[11px] uppercase tracking-wide font-semibold text-right px-3 py-2.5">Discount</th>}
                {hasTax && <th className="text-white text-[11px] uppercase tracking-wide font-semibold text-right px-3 py-2.5">Tax</th>}
                <th className="text-white text-[11px] uppercase tracking-wide font-semibold text-right px-3 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, idx) => (
                <tr key={li.id || idx} className="border-b" style={{ borderColor: '#f1f5f9' }}>
                  <td className="px-3 py-3 text-gray-500 align-top">{idx + 1}</td>
                  <td className="px-3 py-3 align-top">
                    <p className="font-semibold text-gray-800">{li.item_name}</p>
                    {li.description && <p className="text-xs text-gray-500 mt-0.5">{li.description}</p>}
                  </td>
                  <td className="px-3 py-3 text-right align-top text-gray-700">{Number(li.quantity).toFixed(2)}</td>
                  <td className="px-3 py-3 text-right align-top text-gray-700">{Number(li.rate).toFixed(2)}</td>
                  {hasDiscount && <td className="px-3 py-3 text-right align-top text-gray-700">{li.discount_percent ? `${li.discount_percent}%` : '-'}</td>}
                  {hasTax && <td className="px-3 py-3 text-right align-top text-gray-700">{li.tax_percent ? `${li.tax_percent}%` : '-'}</td>}
                  <td className="px-3 py-3 text-right align-top font-semibold text-gray-800">{formatMoney(li.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-72 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Sub Total</span><span className="text-gray-800">{formatMoney(invoice.subtotal)}</span></div>
            {invoice.discount_total > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-gray-800">- {formatMoney(invoice.discount_total)}</span></div>
            )}
            {invoice.tax_total > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="text-gray-800">{formatMoney(invoice.tax_total)}</span></div>
            )}
            <div className="flex justify-between pt-2 border-t font-bold text-gray-900" style={{ borderColor: '#e5e7eb' }}>
              <span>Total</span><span>{formatMoney(invoice.total)}</span>
            </div>
            {invoice.amount_paid > 0 && (
              <div className="flex justify-between" style={{ color: '#dc2626' }}>
                <span>Payment Made</span><span>(-) {formatMoney(invoice.amount_paid)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 px-3 py-1.5 -mx-3 rounded" style={{ background: '#f9fafb' }}>
              <span>Balance Due</span><span>{formatMoney(invoice.balance_due)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-10 pt-6 border-t" style={{ borderColor: '#e5e7eb' }}>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {websiteLabel && (
          <p className="text-center text-xs text-gray-400 mt-10">{settings?.business_name} &middot; {websiteLabel}</p>
        )}
      </div>
    </div>
  )
}

export default function InvoiceEditorPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const isNew = params.id === 'new'

  const [mode, setMode] = useState<'view' | 'edit'>(isNew ? 'edit' : 'view')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [catalogItems, setCatalogItems] = useState<InvoiceCatalogItem[]>([])
  const [customerSuggestions, setCustomerSuggestions] = useState<{ name: string; email: string; phone: string | null }[]>([])

  // Form state
  const [billToName, setBillToName] = useState('')
  const [billToEmail, setBillToEmail] = useState('')
  const [billToPhone, setBillToPhone] = useState('')
  const [billToAddress, setBillToAddress] = useState('')
  const [status, setStatus] = useState<InvoiceStatus>('draft')
  const [invoiceDate, setInvoiceDate] = useState(todayISO())
  const [dueDate, setDueDate] = useState(todayISO())
  const [terms, setTerms] = useState('Due on Receipt')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<InvoiceLineItemInput[]>([emptyLine()])

  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [paymentRef, setPaymentRef] = useState('')
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)

  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function loadFormFromInvoice(inv: Invoice) {
    setBillToName(inv.bill_to_name)
    setBillToEmail(inv.bill_to_email)
    setBillToPhone(inv.bill_to_phone || '')
    setBillToAddress(inv.bill_to_address || '')
    setStatus(inv.status)
    setInvoiceDate(inv.invoice_date)
    setDueDate(inv.due_date)
    setTerms(inv.terms || 'Due on Receipt')
    setNotes(inv.notes || '')
    setLineItems(
      (inv.line_items || []).map(li => ({
        item_name: li.item_name,
        description: li.description || '',
        quantity: Number(li.quantity),
        rate: Number(li.rate),
        discount_percent: Number(li.discount_percent),
        tax_percent: Number(li.tax_percent),
      }))
    )
    setPaymentAmount(String(inv.balance_due))
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        // One round trip for everything this page needs, instead of 3-4
        // separate action calls each paying their own admin-check cost.
        const { catalogItems: items, customerSuggestions: customers, settings: appSettings, invoice: inv } =
          await getInvoiceEditorDataAction(isNew ? undefined : params.id)
        if (ignore) return

        setCatalogItems(items as InvoiceCatalogItem[])
        setCustomerSuggestions(customers)
        setSettings(appSettings)

        if (isNew) {
          setTerms(appSettings.invoice_default_terms)
          setNotes(appSettings.invoice_notes)
        } else {
          if (!inv) {
            setError('Invoice not found.')
            return
          }
          setInvoice(inv)
          loadFormFromInvoice(inv)
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [params.id, isNew])

  const totals = useMemo(() => {
    let subtotal = 0
    let discountTotal = 0
    let taxTotal = 0
    for (const item of lineItems) {
      const gross = item.quantity * item.rate
      const discount = gross * ((item.discount_percent || 0) / 100)
      const amount = gross - discount
      subtotal += amount
      discountTotal += discount
      taxTotal += amount * ((item.tax_percent || 0) / 100)
    }
    const total = subtotal + taxTotal
    const amountPaid = invoice?.amount_paid || 0
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      amountPaid,
      balanceDue: Math.max(Math.round((total - amountPaid) * 100) / 100, 0),
    }
  }, [lineItems, invoice])

  function updateLine(index: number, patch: Partial<InvoiceLineItemInput>) {
    setLineItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addLine() {
    setLineItems(prev => [...prev, emptyLine()])
  }

  function removeLine(index: number) {
    setLineItems(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function handleCatalogPick(index: number, itemName: string) {
    const match = catalogItems.find(c => c.name === itemName)
    updateLine(index, {
      item_name: itemName,
      rate: match ? Number(match.default_rate) : lineItems[index].rate,
      description: match?.description || lineItems[index].description,
    })
  }

  function handleCustomerPick(name: string) {
    setBillToName(name)
    const match = customerSuggestions.find(c => c.name === name)
    if (match) {
      setBillToEmail(match.email)
      setBillToPhone(match.phone || '')
    }
  }

  function buildPayload() {
    return {
      bill_to_name: billToName.trim(),
      bill_to_email: billToEmail.trim(),
      bill_to_phone: billToPhone.trim() || undefined,
      bill_to_address: billToAddress.trim() || undefined,
      booking_id: invoice?.booking_id ?? null,
      status,
      invoice_date: invoiceDate,
      due_date: dueDate,
      terms,
      notes,
      line_items: lineItems
        .filter(li => li.item_name.trim())
        .map(li => ({
          ...li,
          quantity: Number(li.quantity) || 0,
          rate: Number(li.rate) || 0,
          discount_percent: Number(li.discount_percent) || 0,
          tax_percent: Number(li.tax_percent) || 0,
        })),
    }
  }

  function handleCancelEdit() {
    if (isNew) {
      router.push('/admin/invoices')
      return
    }
    if (invoice) loadFormFromInvoice(invoice)
    setError(null)
    setMode('view')
  }

  async function handleSave(andSend = false) {
    setError(null)
    if (!billToName.trim() || !billToEmail.trim()) {
      setError('Customer name and email are required.')
      return
    }
    const payload = buildPayload()
    if (payload.line_items.length === 0) {
      setError('Add at least one item to the invoice.')
      return
    }

    try {
      setSaving(true)
      let savedInvoice: Invoice
      if (isNew) {
        const res = await createInvoiceAction(payload)
        savedInvoice = res.invoice
      } else {
        const res = await updateInvoiceAction(params.id, payload)
        savedInvoice = res.invoice
      }

      if (andSend) {
        await sendInvoiceEmailAction(savedInvoice.id)
        const refreshed = await getInvoiceAction(savedInvoice.id)
        if (refreshed) savedInvoice = refreshed
      }

      if (isNew) {
        router.push(`/admin/invoices/${savedInvoice.id}`)
      } else {
        setInvoice(savedInvoice)
        loadFormFromInvoice(savedInvoice)
        setMode('view')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!invoice) return
    try {
      setIsRecordingPayment(true)
      const res = await recordInvoicePaymentAction(invoice.id, {
        amount: Number(paymentAmount),
        payment_date: todayISO(),
        mode: paymentMode,
        reference_number: paymentRef || undefined,
      })
      setInvoice(res.invoice)
      setStatus(res.invoice.status)
      setIsPaymentModalOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRecordingPayment(false)
    }
  }

  async function handleSendEmail() {
    if (!invoice) return
    try {
      setIsSendingEmail(true)
      await sendInvoiceEmailAction(invoice.id)
      setSuccessMsg(`Invoice emailed to ${invoice.bill_to_email}.`)
      const refreshed = await getInvoiceAction(invoice.id)
      if (refreshed) {
        setInvoice(refreshed)
        setStatus(refreshed.status)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSendingEmail(false)
    }
  }

  async function handleDelete() {
    if (!invoice) return
    if (!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return
    try {
      setIsDeleting(true)
      await deleteInvoiceAction(invoice.id)
      router.push('/admin/invoices')
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

  if (error && !invoice && !isNew) {
    return (
      <div className="admin-error-bar">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  // ---------------------------------------------------------------------
  // VIEW MODE — Zoho-style toolbar + printed-document preview
  // ---------------------------------------------------------------------
  if (mode === 'view' && invoice) {
    return (
      <div className="admin-page space-y-4 max-w-4xl">
        <Link href="/admin/invoices" className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
        </Link>

        {successMsg && (
          <div className="p-3 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
          </div>
        )}

        {invoice.booking_id && invoice.bookings && (
          <div className="p-3 rounded-md border flex items-center gap-2 text-xs font-semibold" style={{ borderColor: 'var(--color-badge-info-border)', background: 'var(--color-badge-info-bg)', color: 'var(--color-badge-info-text)' }}>
            <Calendar className="w-4 h-4 shrink-0" />
            Linked to a consultation booking on {invoice.bookings.date} at {invoice.bookings.time}
            {invoice.bookings.plans?.name ? ` — ${invoice.bookings.plans.name}` : ''}
          </div>
        )}

        {/* Flat action toolbar */}
        <div className="bg-white border rounded-2xl flex flex-wrap items-center gap-1 p-1.5" style={{ borderColor: 'var(--color-admin-card-border)' }}>
          <button onClick={() => setMode('edit')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer" style={{ color: 'var(--color-admin-subtext)' }}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button disabled={isSendingEmail} onClick={handleSendEmail} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer" style={{ color: 'var(--color-admin-subtext)' }}>
            {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send
          </button>
          <a href={`/api/invoices/${invoice.id}/pdf?download=1`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors" style={{ color: 'var(--color-admin-subtext)' }}>
            <Download className="w-3.5 h-3.5" /> PDF/Print
          </a>
          {invoice.balance_due > 0 && (
            <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer" style={{ color: 'var(--color-admin-subtext)' }}>
              <CreditCard className="w-3.5 h-3.5" /> Record Payment
            </button>
          )}
          <div className="flex-1" />
          <button disabled={isDeleting} onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer">
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
          </button>
        </div>

        <InvoiceDocument invoice={invoice} settings={settings} />

        {isPaymentModalOpen && (
          <PaymentModal
            invoice={invoice}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            paymentRef={paymentRef}
            setPaymentRef={setPaymentRef}
            isRecordingPayment={isRecordingPayment}
            onSubmit={handleRecordPayment}
            onClose={() => setIsPaymentModalOpen(false)}
          />
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------
  // EDIT MODE — the New/Edit Invoice form
  // ---------------------------------------------------------------------
  return (
    <div className="admin-page space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {isNew ? (
            <Link href="/admin/invoices" className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
            </Link>
          ) : (
            <button onClick={handleCancelEdit} className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 mb-1 cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> Cancel Editing
            </button>
          )}
          <h1 className="admin-heading">{isNew ? 'New Invoice' : `Editing ${invoice?.invoice_number}`}</h1>
        </div>
      </div>

      {error && (
        <div className="admin-error-bar">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-card-padded space-y-6">
        {/* Customer + meta */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="admin-label block mb-1.5">Customer Name *</label>
              <Combobox
                value={billToName}
                onChangeText={setBillToName}
                options={customerSuggestions}
                getLabel={c => c.name}
                getKey={c => c.email}
                onSelect={c => handleCustomerPick(c.name)}
                placeholder="Select or type a customer name..."
                className="admin-input"
                emptyHint="No matching customer — this will be added as a new one."
                renderOption={c => (
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  </div>
                )}
              />
            </div>
            <div>
              <label className="admin-label block mb-1.5">Email *</label>
              <input
                type="email"
                value={billToEmail}
                onChange={e => setBillToEmail(e.target.value)}
                placeholder="client@example.com"
                className="admin-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="admin-label block mb-1.5">Phone</label>
                <input value={billToPhone} onChange={e => setBillToPhone(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-label block mb-1.5">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as InvoiceStatus)} className="admin-select">
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="admin-label block mb-1.5">Billing Address</label>
              <textarea value={billToAddress} onChange={e => setBillToAddress(e.target.value)} rows={2} className="admin-input" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="admin-label block mb-1.5">Invoice Date *</label>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-label block mb-1.5">Due Date *</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="admin-input" />
              </div>
            </div>
            <div>
              <label className="admin-label block mb-1.5">Terms</label>
              <input value={terms} onChange={e => setTerms(e.target.value)} className="admin-input" />
            </div>
            {!isNew && invoice && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p className="flex justify-between"><span className="text-gray-500">Amount Paid</span><span className="font-bold">{formatMoney(invoice.amount_paid)}</span></p>
                <p className="flex justify-between"><span className="text-gray-500">Balance Due</span><span className="font-bold" style={{ color: invoice.balance_due > 0 ? 'var(--color-admin-red)' : undefined }}>{formatMoney(invoice.balance_due)}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Item Table */}
        <div>
          <label className="admin-label block mb-2">Item Table</label>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-admin-card-border)' }}>
            <table className="w-full text-left text-xs sm:text-sm min-w-[720px]">
              <thead className="admin-thead">
                <tr>
                  <th className="w-[30%]">Item &amp; Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Discount %</th>
                  <th>Tax %</th>
                  <th className="text-right">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="admin-tbody">
                {lineItems.map((item, idx) => (
                  <tr key={idx} className="admin-tr align-top">
                    <td className="admin-td">
                      <Combobox
                        value={item.item_name}
                        onChangeText={text => updateLine(idx, { item_name: text })}
                        options={catalogItems}
                        getLabel={c => c.name}
                        getKey={c => c.id}
                        onSelect={c => handleCatalogPick(idx, c.name)}
                        placeholder="Type or select an item..."
                        className="admin-input mb-1.5"
                        emptyHint="No matching item — set up more in Settings › Item Catalog."
                        renderOption={c => (
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">{c.name}</p>
                              {c.description && <p className="text-xs text-gray-400 truncate">{c.description}</p>}
                            </div>
                            <span className="text-xs font-semibold text-gray-600 shrink-0">{formatMoney(c.default_rate)}</span>
                          </div>
                        )}
                      />
                      <input
                        value={item.description || ''}
                        onChange={e => updateLine(idx, { description: e.target.value })}
                        placeholder="Description (optional)"
                        className="admin-input text-[11px]"
                      />
                    </td>
                    <td className="admin-td">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.quantity}
                        onChange={e => updateLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                        className="admin-input w-20"
                      />
                    </td>
                    <td className="admin-td">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.rate}
                        onChange={e => updateLine(idx, { rate: parseFloat(e.target.value) || 0 })}
                        className="admin-input w-24"
                      />
                    </td>
                    <td className="admin-td">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={item.discount_percent}
                        onChange={e => updateLine(idx, { discount_percent: parseFloat(e.target.value) || 0 })}
                        className="admin-input w-20"
                      />
                    </td>
                    <td className="admin-td">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={item.tax_percent}
                        onChange={e => updateLine(idx, { tax_percent: parseFloat(e.target.value) || 0 })}
                        className="admin-input w-20"
                      />
                    </td>
                    <td className="admin-td text-right font-bold whitespace-nowrap" style={{ color: 'var(--color-admin-heading)' }}>
                      {formatMoney(lineAmount(item))}
                    </td>
                    <td className="admin-td">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lineItems.length === 1}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-3 flex items-center gap-1.5 text-xs font-bold hover:underline cursor-pointer"
            style={{ color: 'var(--color-admin-navy)' }}
          >
            <Plus className="w-3.5 h-3.5" /> Add New Row
          </button>
        </div>

        {/* Totals + Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: 'var(--color-admin-card-border)' }}>
          <div>
            <label className="admin-label block mb-1.5">Customer Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} className="admin-input" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{formatMoney(totals.subtotal)}</span></div>
            {totals.discountTotal > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="font-semibold">- {formatMoney(totals.discountTotal)}</span></div>
            )}
            {totals.taxTotal > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-semibold">{formatMoney(totals.taxTotal)}</span></div>
            )}
            <div className="flex justify-between pt-2 border-t text-base" style={{ borderColor: 'var(--color-admin-card-border)' }}>
              <span className="font-bold" style={{ color: 'var(--color-admin-heading)' }}>Total</span>
              <span className="font-extrabold" style={{ color: 'var(--color-admin-heading)' }}>{formatMoney(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        {!isNew && (
          <button
            disabled={saving}
            onClick={handleCancelEdit}
            className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          disabled={saving}
          onClick={() => handleSave(false)}
          className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isNew ? 'Save as Draft' : 'Save'}
        </button>
        <button
          disabled={saving}
          onClick={() => handleSave(true)}
          className="px-5 py-2.5 rounded-xl bg-[#012269] hover:bg-[#011a4f] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Save &amp; Send
        </button>
      </div>
    </div>
  )
}

interface PaymentModalProps {
  invoice: Invoice
  paymentAmount: string
  setPaymentAmount: (v: string) => void
  paymentMode: string
  setPaymentMode: (v: string) => void
  paymentRef: string
  setPaymentRef: (v: string) => void
  isRecordingPayment: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

function PaymentModal({
  invoice, paymentAmount, setPaymentAmount, paymentMode, setPaymentMode,
  paymentRef, setPaymentRef, isRecordingPayment, onSubmit, onClose,
}: PaymentModalProps) {
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-backdrop" onClick={onClose} />
      <div className="admin-modal-box max-w-sm">
        <div className="flex justify-between items-start mb-2">
          <h3 className="admin-modal-title mb-0">Record Payment</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Balance due: <strong>{formatMoney(invoice.balance_due)}</strong></p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="admin-label block mb-1.5">Amount *</label>
            <input
              type="number" step="0.01" min="0.01" required
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label block mb-1.5">Mode</label>
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="admin-select">
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Card</option>
              <option>Stripe</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="admin-label block mb-1.5">Reference Number</label>
            <input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} className="admin-input" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-gray-600 hover:bg-gray-100 font-medium text-xs cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isRecordingPayment} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
              {isRecordingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
