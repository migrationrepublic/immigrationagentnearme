'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Signature,
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  Mail,
  Eye,
  XCircle,
  CheckCircle2,
  Info,
  Copy,
  ExternalLink,
  ArrowLeft,
  Trash2,
  PenTool,
  Users,
  UploadCloud,
  ChevronRight,
  ArrowRight,
  History,
} from 'lucide-react'
import {
  createSignatureRequestAction,
  sendSignatureReminderAction,
} from '@/app/actions/signature'
import { uploadFileAction, getSignedUrlAction } from '@/app/actions/storage'
import { mergePdfsAction } from '@/app/actions/document'
import { SignatureRequest, Document, DocumentTemplate } from '@/lib/types'

// ── Toast types ─────────────────────────────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'info'
interface Toast { id: number; variant: ToastVariant; message: string }
let _toastId = 0

interface RecipientRow {
  email: string
  name: string
  role: 'Needs to sign' | 'Receives copy'
  order: number
  privateNote?: string
}

type ViewState = 'selection' | 'setup' | 'history'

export default function SignatureRequestsPage() {
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>('selection')
  const [signingType, setSigningType] = useState<'others' | 'self'>('others')

  // History tracking states
  const [requests, setRequests] = useState<SignatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'signed'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Document Templates/Client Documents to select as source
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [approvedDocs, setApprovedDocs] = useState<Document[]>([])
  const [selectedSourceType, setSelectedSourceType] = useState<'upload' | 'approved_doc' | 'template'>('upload')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedDocId, setSelectedDocId] = useState('')

  // Setup Form states
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string
    size: number
    mimeType: string
    base64Data: string
  }>>([])
  const [documentName, setDocumentName] = useState('')
  const [recipients, setRecipients] = useState<RecipientRow[]>([
    { email: '', name: '', role: 'Needs to sign', order: 1, privateNote: '' }
  ])
  const [sendInOrder, setSendInOrder] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  // Advanced Zoho configurations
  const [expirationDays, setExpirationDays] = useState('15')
  const [reminderDays, setReminderDays] = useState('5')
  const [submitting, setSubmitting] = useState(false)

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((variant: ToastVariant, message: string) => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, variant, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5500)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('signature_requests')
        .select('*, documents:documents(name, file_path)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (e) {
      showToast('error', `Failed to load requests: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const fetchApprovedDocs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('status', 'approved')
      setApprovedDocs(data || [])
    } catch (e) {
      console.error('[SignatureRequests] Error loading approved docs:', e)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
      setTemplates(data || [])
    } catch (e) {
      console.error('[SignatureRequests] Error loading templates:', e)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchApprovedDocs()
    fetchTemplates()
  }, [fetchRequests, fetchApprovedDocs, fetchTemplates])

  // File drop handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (pdfFiles.length !== files.length) {
      showToast('error', 'Only PDF files are supported. Non-PDF files were skipped.')
    }

    if (pdfFiles.length === 0) return

    let loadedCount = 0
    const newFiles: Array<{ name: string; size: number; mimeType: string; base64Data: string }> = []

    pdfFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        newFiles.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          base64Data: base64
        })
        loadedCount++
        if (loadedCount === pdfFiles.length) {
          setUploadedFiles(prev => {
            const updated = [...prev, ...newFiles]
            if (!documentName && updated.length > 0) {
              setDocumentName(updated[0].name.replace(/\.[^/.]+$/, ""))
            }
            return updated
          })
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Add me (admin) to signers list
  const handleAddMe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const exists = recipients.some(r => r.email.toLowerCase() === user.email?.toLowerCase())
        if (exists) {
          showToast('info', 'You are already added as a recipient.')
          return
        }

        const newRecipients = [...recipients]
        const emptyIndex = newRecipients.findIndex(r => !r.email && !r.name)
        const newRow = {
          email: user.email || '',
          name: 'Principal Agent (Me)',
          role: 'Needs to sign' as const,
          order: sendInOrder ? newRecipients.length + 1 : 1,
          privateNote: ''
        }

        if (emptyIndex > -1) {
          newRecipients[emptyIndex] = newRow
        } else {
          newRecipients.push(newRow)
        }
        setRecipients(newRecipients)
        showToast('success', 'Added yourself to signers list.')
      } else {
        showToast('error', 'Unable to fetch user credentials.')
      }
    } catch (e) {
      showToast('error', `Failed to fetch active user: ${(e as Error).message}`)
    }
  }

  // Manage recipient rows
  const handleAddRecipient = () => {
    setRecipients([
      ...recipients,
      { email: '', name: '', role: 'Needs to sign', order: sendInOrder ? recipients.length + 1 : 1, privateNote: '' }
    ])
  }

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length === 1) {
      setRecipients([{ email: '', name: '', role: 'Needs to sign', order: 1, privateNote: '' }])
      return
    }
    const filtered = recipients.filter((_, i) => i !== index)
    if (sendInOrder) {
      filtered.forEach((r, idx) => { r.order = idx + 1 })
    }
    setRecipients(filtered)
  }

  const updateRecipientRow = (index: number, key: keyof RecipientRow, val: string | number) => {
    const updated = [...recipients]
    updated[index] = { ...updated[index], [key]: val }
    setRecipients(updated)
  }

  // Swap rows for ordering
  const handleSwapOrder = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === recipients.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...recipients]

    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    updated.forEach((r, idx) => {
      r.order = sendInOrder ? idx + 1 : 1
    })

    setRecipients(updated)
  }

  // Toggle order mode
  const handleToggleOrderMode = (checked: boolean) => {
    setSendInOrder(checked)
    setRecipients(prev =>
      prev.map((r, idx) => ({
        ...r,
        order: checked ? idx + 1 : 1
      }))
    )
  }

  // Submit flow & create draft requests
  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedSourceType === 'upload' && uploadedFiles.length === 0) {
      showToast('error', 'Please upload at least one PDF document first.')
      return
    }
    if (selectedSourceType === 'approved_doc' && !selectedDocId) {
      showToast('error', 'Please select a client document.')
      return
    }
    if (selectedSourceType === 'template' && !selectedTemplateId) {
      showToast('error', 'Please select a document template.')
      return
    }
    if (!documentName.trim()) {
      showToast('error', 'Document name is required.')
      return
    }

    const activeSigners = recipients.filter(r => r.email.trim() && r.name.trim())
    if (activeSigners.length === 0) {
      showToast('error', 'Please add at least one recipient with valid email and name.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const r of activeSigners) {
      if (!emailRegex.test(r.email)) {
        showToast('error', `Invalid email format: ${r.email}`)
        return
      }
    }

    try {
      setSubmitting(true)
      let docId = ''
      let finalFilePath = ''

      // 1. Calculate Expiry Date dynamically based on Zoho configuration
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + parseInt(expirationDays, 10))
      const finalExpiryIso = expireDate.toISOString()

      // 2. Document Setup
      if (selectedSourceType === 'upload') {
        let mergedBase64 = ''
        let mainFileName = ''

        if (uploadedFiles.length === 1) {
          mergedBase64 = uploadedFiles[0].base64Data
          mainFileName = uploadedFiles[0].name
        } else {
          // Merge multiple files on the server
          const mergeRes = await mergePdfsAction(uploadedFiles.map(f => f.base64Data))
          if (!mergeRes.success || !mergeRes.base64Data) {
            throw new Error(mergeRes.error || 'Failed to merge PDF files.')
          }
          mergedBase64 = mergeRes.base64Data
          mainFileName = `${documentName.replace(/\s+/g, '_')}_merged.pdf`
        }

        const uploadPath = `signatures/${Date.now()}_${mainFileName.replace(/\s+/g, '_')}`
        const uploadRes = await uploadFileAction({
          bucket: 'documents',
          path: uploadPath,
          base64Data: mergedBase64,
          mimeType: 'application/pdf'
        })

        if (!uploadRes.success || !uploadRes.path) {
          throw new Error(uploadRes.error || 'Failed to upload document file.')
        }

        finalFilePath = uploadRes.path

        const { data: newDoc, error: docErr } = await supabase
          .from('documents')
          .insert([{
            name: documentName.trim(),
            file_path: finalFilePath,
            mime_type: 'application/pdf',
            status: 'pending_review',
          }])
          .select()
          .single()

        if (docErr || !newDoc) {
          throw new Error(`Failed to create document record: ${docErr?.message}`)
        }

        docId = newDoc.id
      } else if (selectedSourceType === 'approved_doc') {
        docId = selectedDocId
      } else {
        const tpl = templates.find(t => t.id === selectedTemplateId)
        if (!tpl) throw new Error('Selected template not found.')

        const { data: newDoc, error: docErr } = await supabase
          .from('documents')
          .insert([{
            name: documentName.trim(),
            file_path: tpl.file_path,
            template_id: tpl.id,
            mime_type: 'application/pdf',
            status: 'pending_review',
          }])
          .select()
          .single()

        if (docErr || !newDoc) {
          throw new Error(`Failed to initialize template copy: ${docErr?.message}`)
        }

        docId = newDoc.id
      }

      // 3. Create Draft requests
      for (const r of activeSigners) {
        let signerMsg = emailMessage.trim()
        if (r.privateNote?.trim()) {
          signerMsg = signerMsg
            ? `${signerMsg}\n\n[Private Note to ${r.name}]: ${r.privateNote.trim()}`
            : `[Private Note to ${r.name}]: ${r.privateNote.trim()}`
        }

        const res = await createSignatureRequestAction({
          document_id: docId,
          signer_email: r.email.trim(),
          signer_name: r.name.trim(),
          expires_at: finalExpiryIso,
          fields: [],
          signing_order: r.order,
          signing_message: signerMsg || undefined,
          status: 'draft',
        })

        if (!res.success) {
          throw new Error(res.error || `Failed to create signature request for ${r.email}`)
        }
      }

      showToast('success', 'Document setup successfully. Opening layout editor…')
      router.push(`/admin/pdf-editor?documentId=${docId}`)
    } catch (e) {
      showToast('error', `Flow setup failed: ${(e as Error).message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLaunchSelfSign = () => {
    setSigningType('self')
    setViewState('setup')
    setRecipients([
      { email: '', name: 'Signer', role: 'Needs to sign', order: 1, privateNote: '' }
    ])
    handleAddMe()
  }

  const handleCopySigningLink = async (req: SignatureRequest) => {
    try {
      const secureLink = `${window.location.origin}/sign/${req.token}`
      await navigator.clipboard.writeText(secureLink)
      showToast('success', `Copied secure signing link for ${req.signer_name}!`)
    } catch {
      showToast('error', 'Failed to copy to clipboard.')
    }
  }

  const handleSendReminder = async (req: SignatureRequest) => {
    try {
      setProcessingId(req.id)
      const res = await sendSignatureReminderAction(req.id)
      if (res.success) {
        showToast('success', `Manual email signature reminder sent to ${req.signer_name}!`)
      } else {
        throw new Error(res.error || 'Failed to dispatch notification.')
      }
    } catch (e) {
      showToast('error', `Reminder failed: ${(e as Error).message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleViewSignedFile = async (docPath: string) => {
    try {
      const res = await getSignedUrlAction({ bucket: 'signed', path: docPath, expiresIn: 120 })
      if (res.success) {
        window.open(res.signedUrl, '_blank')
      } else {
        throw new Error(res.error || 'Could not retrieve signed URL')
      }
    } catch (e) {
      showToast('error', `Failed to open signed file: ${(e as Error).message}`)
    }
  }

  const pendingRequests = requests.filter(r => r.status !== 'signed')
  const signedRequests = requests.filter(r => r.status === 'signed')
  const currentList = activeTab === 'pending' ? pendingRequests : signedRequests

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      signed: 'admin-badge-success',
      declined: 'admin-badge-error',
      sent: 'admin-badge-warn',
      expired: 'admin-badge-navy',
      draft: 'admin-badge-info',
    }
    return map[status] ?? 'admin-badge-navy'
  }

  return (
    <div className="admin-page">

      {/* ── Toast notifications ──────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={`
              flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl max-w-sm w-full
              text-sm font-medium cursor-pointer pointer-events-auto border
              ${toast.variant === 'success' ? 'bg-white border-green-200 text-green-800' : ''}
              ${toast.variant === 'error' ? 'bg-white border-red-200 text-red-800' : ''}
              ${toast.variant === 'info' ? 'bg-white border-gray-200 text-gray-800' : ''}
            `}
          >
            {toast.variant === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />}
            {toast.variant === 'error' && <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />}
            {toast.variant === 'info' && <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />}
            <span className="leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* ── VIEW 1: HOME SELECTION DASHBOARD (Screen 1) ───────────────── */}
      {viewState === 'selection' && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="admin-heading text-4xl flex items-center justify-center gap-3">
              <Signature className="w-10 h-10" style={{ color: 'var(--color-admin-gold)' }} /> Dynamic Signing Portal
            </h1>
            <p className="admin-subheading text-base mt-2">
              Prepare, manage, and execute legally binding electronic signatures seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div
              onClick={() => { setSigningType('others'); setViewState('setup') }}
              className="admin-card p-8 rounded-3xl hover:shadow-xl hover:border-[#012269]/40 transition-all duration-300 cursor-pointer flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border mb-6 group-hover:scale-110 transition-transform duration-300" style={{ background: 'color-mix(in srgb, var(--color-admin-gold), white 90%)', borderColor: 'color-mix(in srgb, var(--color-admin-gold), white 60%)' }}>
                <Users className="w-8 h-8" style={{ color: 'var(--color-admin-gold)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-admin-heading)' }}>Send for Signatures</h2>
              <p className="admin-cell-muted text-sm leading-relaxed mb-6">
                Upload a document, set recipient signers, configure sequence order, and send invitations.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider group-hover:gap-2 transition-all" style={{ color: 'var(--color-admin-gold)' }}>
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={handleLaunchSelfSign}
              className="admin-card p-8 rounded-3xl hover:shadow-xl hover:border-green-200 transition-all duration-300 cursor-pointer flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center border border-green-200 group-hover:scale-110 transition-transform duration-300 mb-6">
                <PenTool className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-admin-heading)' }}>Sign Yourself</h2>
              <p className="admin-cell-muted text-sm leading-relaxed mb-6">
                Add signatures, initials, dates, or details to any document instantly for your own approval.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-green-600 group-hover:gap-2 transition-all">
                Self Sign Now <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setViewState('history')}
              className="flex items-center gap-2 px-6 py-3 bg-[#0a1b32] border border-gray-800 hover:border-gray-700 rounded-2xl transition-all font-semibold text-sm hover:bg-[#0f2440] text-gray-300 hover:text-white"
            >
              <History className="w-4 h-4 text-blue-400" /> View Signature Requests History
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW 2: SETUP WORKFLOW (Screen 2 & 3) ────────────────────── */}
      {viewState === 'setup' && (
        <div className="max-w-4xl mx-auto">

          {/* Zoho Sign wizard horizontal progress header */}
          <div className="mb-8 flex flex-col items-center justify-center border-b pb-6" style={{ borderColor: 'var(--color-admin-card-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setViewState('selection')}
                className="p-1.5 border rounded-lg mr-2 hover:bg-gray-50"
                style={{ borderColor: 'var(--color-admin-card-border)' }}
              >
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-admin-heading)' }}>
                {signingType === 'self' ? 'Self Sign Document Setup' : 'Create Sign Workflow'}
              </h1>
            </div>

            {/* Steps indicator bar */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 mt-4 text-[10px] uppercase tracking-wider font-extrabold w-full max-w-lg">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#012269] text-white shrink-0">
                <span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[9px]">1</span>
                Add Document & Recipients
              </span>
              <span className="hidden sm:block w-6 md:w-10 h-px bg-gray-200 shrink-0" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 shrink-0">
                <span className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[9px]">2</span>
                Drag & Drop Fields
              </span>
              <span className="hidden sm:block w-6 md:w-10 h-px bg-gray-200 shrink-0" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 shrink-0">
                <span className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[9px]">3</span>
                Send Out
              </span>
            </div>
          </div>

          <form onSubmit={handleCreateFlow} className="space-y-6">

            {/* 1. Document Source Selection */}
            <div className="admin-card-padded space-y-4">
              <h3 className="admin-section-title">
                <UploadCloud className="w-5 h-5" style={{ color: 'var(--color-admin-gold)' }} /> 1. Select Document File
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-[#F9FAFC] border rounded-xl" style={{ borderColor: 'var(--color-admin-card-border)' }}>
                {[
                  { key: 'upload', label: 'Upload PDF' },
                  { key: 'approved_doc', label: 'Client File' },
                  { key: 'template', label: 'From Template' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedSourceType(opt.key as 'upload' | 'approved_doc' | 'template')}
                    className={`
                      py-2.5 text-xs font-bold rounded-lg transition-all
                      ${selectedSourceType === opt.key
                        ? 'bg-[#012269] text-white shadow-sm'
                        : 'text-gray-500 hover:text-[#012269] hover:bg-gray-100'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {selectedSourceType === 'upload' && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-colors relative bg-[#F9FAFC] hover:bg-gray-50" style={{ borderColor: 'var(--color-admin-card-border)' }}>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--color-admin-heading)' }}>Drag files here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">Accepts multiple PDF files up to 20MB each</p>
                    </div>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Uploaded PDF Package ({uploadedFiles.length} files)</p>
                      <div className="border rounded-2xl overflow-hidden divide-y bg-white" style={{ borderColor: 'var(--color-admin-card-border)' }}>
                        {uploadedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0" style={{ background: 'var(--color-admin-navy)', color: '#fff' }}>
                                {idx + 1}
                              </span>
                              <div className="truncate pr-4">
                                <p className="text-sm font-semibold text-gray-800 truncate" title={file.name}>{file.name}</p>
                                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (idx === 0) return
                                  setUploadedFiles(prev => {
                                    const updated = [...prev]
                                    const temp = updated[idx]
                                    updated[idx] = updated[idx - 1]
                                    updated[idx - 1] = temp
                                    return updated
                                  })
                                }}
                                disabled={idx === 0}
                                className="p-1.5 text-gray-400 hover:text-[#012269] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                                title="Move up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (idx === uploadedFiles.length - 1) return
                                  setUploadedFiles(prev => {
                                    const updated = [...prev]
                                    const temp = updated[idx]
                                    updated[idx] = updated[idx + 1]
                                    updated[idx + 1] = temp
                                    return updated
                                  })
                                }}
                                disabled={idx === uploadedFiles.length - 1}
                                className="p-1.5 text-gray-400 hover:text-[#012269] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                                title="Move down"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
                                }}
                                className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                                title="Delete file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedSourceType === 'approved_doc' && (
                <div>
                  <select
                    value={selectedDocId}
                    onChange={e => {
                      setSelectedDocId(e.target.value)
                      const doc = approvedDocs.find(d => d.id === e.target.value)
                      if (doc) setDocumentName(doc.name)
                    }}
                    className="admin-select"
                  >
                    <option value="">— Choose Approved Client Document —</option>
                    {approvedDocs.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSourceType === 'template' && (
                <div>
                  <select
                    value={selectedTemplateId}
                    onChange={e => {
                      setSelectedTemplateId(e.target.value)
                      const tpl = templates.find(t => t.id === e.target.value)
                      if (tpl) setDocumentName(tpl.name)
                    }}
                    className="admin-select"
                  >
                    <option value="">— Choose a Document Template —</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Subclass {t.visa_subclass || 'General'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="admin-label block ml-1">Document Name (Sender-Facing)</label>
                <input
                  type="text"
                  value={documentName}
                  onChange={e => setDocumentName(e.target.value)}
                  placeholder="Enter custom document name"
                  className="admin-input"
                />
              </div>
            </div>

            {/* 2. Recipients Config */}
            <div className="admin-card-padded space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="admin-section-title mb-0">
                  <Users className="w-5 h-5" style={{ color: 'var(--color-admin-navy)' }} /> 2. Add Recipients
                </h3>
                {signingType !== 'self' && (
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer" style={{ color: 'var(--color-admin-heading)' }}>
                    <input
                      type="checkbox"
                      checked={sendInOrder}
                      onChange={e => handleToggleOrderMode(e.target.checked)}
                      className="rounded border-gray-300 bg-white accent-[#012269] w-4 h-4"
                    />
                    Send in order (Sequential signing workflow)
                  </label>
                )}
              </div>

              <div className="space-y-4">
                {recipients.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-5 border rounded-2xl relative space-y-4 shadow-sm"
                    style={{ borderColor: 'var(--color-admin-card-border)', background: 'var(--color-admin-table-head)' }}
                  >
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">

                      {/* Index / Order Indicator */}
                      <div className="flex items-center gap-2 shrink-0">
                        {sendInOrder && signingType !== 'self' && (
                          <div className="flex flex-col gap-1 mr-1 shrink-0 text-gray-400">
                            <button
                              type="button"
                              onClick={() => handleSwapOrder(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 hover:text-[#012269] disabled:opacity-30 disabled:hover:text-gray-400 text-[10px]"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSwapOrder(idx, 'down')}
                              disabled={idx === recipients.length - 1}
                              className="p-1 hover:text-[#012269] disabled:opacity-30 disabled:hover:text-gray-400 text-[10px]"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        <span className="w-8 h-8 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0" style={{ background: 'var(--color-admin-navy)', color: '#fff' }}>
                          {idx + 1}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="flex-1 space-y-1">
                        <label className="admin-label block ml-1 text-[9px]">Full Name</label>
                        <input
                          type="text"
                          required
                          value={rec.name}
                          onChange={e => updateRecipientRow(idx, 'name', e.target.value)}
                          placeholder="Recipient Full Name"
                          disabled={signingType === 'self'}
                          className="admin-input"
                        />
                      </div>

                      {/* Email */}
                      <div className="flex-1 space-y-1">
                        <label className="admin-label block ml-1 text-[9px]">Email Address</label>
                        <input
                          type="email"
                          required
                          value={rec.email}
                          onChange={e => updateRecipientRow(idx, 'email', e.target.value)}
                          placeholder="Recipient Email"
                          disabled={signingType === 'self'}
                          className="admin-input"
                        />
                      </div>

                      {/* Role Dropdown */}
                      <div className="shrink-0 space-y-1 w-full md:w-44">
                        <label className="admin-label block ml-1 text-[9px]">Action / Role</label>
                        <select
                          value={rec.role}
                          onChange={e => updateRecipientRow(idx, 'role', e.target.value)}
                          disabled={signingType === 'self'}
                          className="admin-select"
                        >
                          <option value="Needs to sign">Needs to sign</option>
                          <option value="Receives copy">Receives copy</option>
                        </select>
                      </div>

                      {/* Delete handle */}
                      {signingType !== 'self' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(idx)}
                          className="p-2 border rounded-xl hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors shrink-0 md:self-end"
                          style={{ borderColor: 'var(--color-badge-error-border)' }}
                          title="Remove signer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Zoho private note sub-drawer inside recipient row */}
                    {signingType !== 'self' && (
                      <div className="pt-2 border-t" style={{ borderColor: 'var(--color-admin-card-border)' }}>
                        <label className="admin-label block text-[9px] mb-1">Private message to this recipient (Optional)</label>
                        <textarea
                          rows={2}
                          value={rec.privateNote || ''}
                          onChange={e => updateRecipientRow(idx, 'privateNote', e.target.value)}
                          placeholder="Add private note that only this recipient will see..."
                          className="admin-input text-xs resize-none"
                        />
                      </div>
                    )}

                  </div>
                ))}
              </div>

              {signingType !== 'self' && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="flex items-center gap-1.5 text-xs font-extrabold hover:underline"
                    style={{ color: 'var(--color-admin-gold)' }}
                  >
                    + Add Recipient
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleAddMe}
                    className="flex items-center gap-1.5 text-xs font-extrabold hover:underline"
                    style={{ color: 'var(--color-admin-navy)' }}
                  >
                    + Add Me (Principal Agent)
                  </button>
                </div>
              )}
            </div>

            {/* 3. Note to Recipients & Zoho Advanced Options */}
            {signingType !== 'self' && (
              <div className="admin-card-padded space-y-4">
                <h3 className="admin-section-title">
                  <Mail className="w-5 h-5" style={{ color: 'var(--color-admin-red)' }} /> 3. Note to Recipients &amp; Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="admin-label block ml-1">Email Subject</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)}
                        placeholder="e.g. Signature Required: Client Agreement Document"
                        className="admin-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="admin-label block ml-1">Custom Message / Invitation Note</label>
                      <textarea
                        rows={4}
                        value={emailMessage}
                        onChange={e => setEmailMessage(e.target.value)}
                        placeholder="Type a custom message that signers will see in their notification email..."
                        className="admin-input resize-none"
                      />
                    </div>
                  </div>

                  {/* Migration Republic Advanced settings panel */}
                  <div className="space-y-3 p-4 border rounded-2xl bg-[#F9FAFC]" style={{ borderColor: 'var(--color-admin-card-border)' }}>
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">Migration Republic Workflow Parameters</h4>

                    <div className="space-y-2 mt-2">
                      <div>
                        <label className="admin-label block ml-1 mb-1">Link Expiration Period</label>
                        <select
                          value={expirationDays}
                          onChange={e => setExpirationDays(e.target.value)}
                          className="admin-select"
                        >
                          <option value="5">5 Days</option>
                          <option value="10">10 Days</option>
                          <option value="15">15 Days (Default)</option>
                          <option value="30">30 Days</option>
                          <option value="60">60 Days</option>
                        </select>
                      </div>

                      <div>
                        <label className="admin-label block ml-1 mb-1">Email Reminder Interval</label>
                        <select
                          value={reminderDays}
                          onChange={e => setReminderDays(e.target.value)}
                          className="admin-select"
                        >
                          <option value="0">Do Not Remind</option>
                          <option value="3">Every 3 Days</option>
                          <option value="5">Every 5 Days (Default)</option>
                          <option value="7">Every 7 Days</option>
                          <option value="10">Every 10 Days</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-400 mt-4 leading-relaxed">
                      Reminders are automatically sent to recipients at selected intervals. The signing link will automatically expire at the end of the selected period.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-admin-card-border)' }}>
              <button
                type="submit"
                disabled={submitting}
                className="admin-btn-primary flex-1 justify-center py-4 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Preparing Documents…
                  </>
                ) : (
                  <>
                    Continue to Layout Editor <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewState('selection')}
                className="px-6 py-4 border text-gray-500 hover:text-[#012269] hover:bg-gray-50 font-semibold text-sm rounded-xl transition-all"
                style={{ borderColor: 'var(--color-admin-card-border)' }}
              >
                Cancel
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ── VIEW 3: REQUESTS HISTORY & TRACKING (Original Table) ──────── */}
      {viewState === 'history' && (
        <div className="max-w-6xl mx-auto py-6">

          {/* Header */}
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewState('selection')}
                className="p-2 border border-gray-800 hover:border-gray-700 bg-[#0a1b32]/40 rounded-xl hover:text-white text-gray-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Signature Requests History</h1>
                <p className="text-gray-400 text-sm mt-1.5">Track active workflows, send manual reminders, and view signed client documents.</p>
              </div>
            </div>

            <button
              onClick={() => { setSigningType('others'); setViewState('setup') }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#bfa032] text-[#030E1E] font-bold rounded-xl transition-all shadow-md text-sm uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> Request Signature
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-800/80 mb-6 pb-px">
            {[
              { key: 'pending', label: 'Pending / Active', count: pendingRequests.length, icon: Clock },
              { key: 'signed', label: 'Completed (Executed)', count: signedRequests.length, icon: CheckCircle },
            ].map(({ key, label, count, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'pending' | 'signed')}
                className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 px-2 transition-all ${activeTab === key
                  ? 'border-[#D4AF37] text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
                  }`}
              >
                <Icon className="w-4 h-4" /> {label} ({count})
              </button>
            ))}
          </div>

          {/* Table container */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="bg-[#07162c] rounded-2xl border border-gray-800 shadow-xl p-16 text-center flex flex-col items-center justify-center">
              <Signature className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Signature Requests Found</h3>
              <p className="text-gray-400 text-sm max-w-sm">
                {activeTab === 'pending'
                  ? 'No pending signature workflows. Click "Request Signature" to begin.'
                  : 'No completed document templates yet.'}
              </p>
            </div>
          ) : (
            <div className="bg-[#07162c] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0c1e35] text-gray-400 text-xs font-bold border-b border-gray-800/80 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-4">Signer Info</th>
                      <th className="px-5 py-4">Document Details</th>
                      <th className="px-5 py-4">Order Status</th>
                      <th className="px-5 py-4">{activeTab === 'pending' ? 'Created At' : 'Signed At'}</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {currentList.map(req => {
                      const doc = req.documents
                      return (
                        <tr key={req.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-white">{req.signer_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{req.signer_email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-white text-sm">{doc?.name || 'Untitled document'}</p>
                            <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                              req_id: {req.id.substring(0, 8)}...
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${statusBadge(req.status)}`}>
                              {req.status === 'draft' ? 'draft (in editor)' : req.status}
                            </span>
                            {(req.signing_order ?? 0) > 1 && req.status === 'draft' && (
                              <span className="text-[10px] text-gray-500 ml-2 block mt-1">
                                Wait order: {req.signing_order}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-400 font-mono">
                            {req.status === 'signed' && req.signed_at
                              ? new Date(req.signed_at).toLocaleString('en-AU')
                              : new Date(req.created_at).toLocaleString('en-AU')}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {req.status === 'draft' ? (
                                <button
                                  onClick={() => router.push(`/admin/pdf-editor?documentId=${req.document_id}`)}
                                  className="px-3 py-1.5 bg-blue-900/40 border border-blue-700 hover:bg-blue-800 text-blue-300 hover:text-white rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                                  title="Edit layout placement map"
                                >
                                  <PenTool className="w-3 h-3" />
                                  <span>Edit Layout</span>
                                </button>
                              ) : req.status !== 'signed' ? (
                                <>
                                  {/* Copy Link */}
                                  <button
                                    onClick={() => handleCopySigningLink(req)}
                                    className="px-3 py-1.5 border border-gray-800 bg-[#0a1b32]/40 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
                                    title="Copy client link"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Link</span>
                                  </button>

                                  {/* Send Reminder */}
                                  <button
                                    onClick={() => handleSendReminder(req)}
                                    disabled={processingId === req.id}
                                    className="px-3 py-1.5 border border-gray-800 bg-[#0a1b32]/40 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
                                    title="Send reminder notification"
                                  >
                                    {processingId === req.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />
                                    ) : (
                                      <Mail className="w-3 h-3" />
                                    )}
                                    <span>Remind</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleViewSignedFile(doc?.file_path || '')}
                                  className="px-3 py-1.5 bg-green-950/20 border border-green-800 hover:bg-green-900 text-green-400 hover:text-green-200 rounded-xl inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide transition-colors"
                                  title="Open signed copy"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Signed</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
