'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  FolderOpen, Loader2, Eye, Check, X, FileText, Download, User, UserCheck, Search, RefreshCw
} from 'lucide-react'
import { getSignedUrlAction } from '@/app/actions/storage'
import { reviewDocumentAction, generateFilledDocumentAction } from '@/app/actions/document'
import { Document } from '@/lib/types'

type DocumentWithRelations = Document & {
  signature_requests?: Array<{ signer_name?: string; signer_email?: string }>
}

// Helper to extract clean human-readable filename from file path
function formatCleanFileName(filePath: string): { cleanName: string; ext: string } {
  const fileName = filePath.split('/').pop() || filePath
  // Remove leading numeric timestamps (e.g. 1764878775710_) or UUIDs (e.g. b2b4d733-544b-4b31-b365-1fc7b6d026f1_)
  let clean = fileName.replace(/^(\d{10,13}_|[0-9a-fA-F-]{36}_)/, '')
  // Replace underscores with spaces for readability
  clean = clean.replace(/_/g, ' ')
  
  const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/)
  const ext = extMatch ? extMatch[1].toUpperCase() : 'PDF'
  
  return { cleanName: clean, ext }
}

// Helper to render Client ID (Never blank)
function renderClientIdCell(doc: DocumentWithRelations) {
  if (doc.client_id) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/90 text-[#012269] border border-blue-200/90 rounded-lg text-xs font-bold font-mono shadow-2xs">
        <User className="w-3.5 h-3.5 text-[#012269]" />
        <span>CLI-{doc.client_id.substring(0, 8).toUpperCase()}</span>
      </div>
    )
  }

  // Check if signature requests or field values have user information
  const sig = doc.signature_requests?.[0]
  if (sig?.signer_name || sig?.signer_email) {
    const label = sig.signer_name || sig.signer_email
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50/90 text-purple-900 border border-purple-200/90 rounded-lg text-xs font-semibold max-w-[170px]" title={sig.signer_email || sig.signer_name}>
        <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
    )
  }

  if (doc.field_values && typeof doc.field_values === 'object') {
    const fv = doc.field_values as Record<string, unknown>
    const nameOrEmail = fv.email || fv.client_name || fv.name || fv.user_email
    if (nameOrEmail && typeof nameOrEmail === 'string') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/90 text-emerald-900 border border-emerald-200/90 rounded-lg text-xs font-semibold max-w-[170px]" title={nameOrEmail}>
          <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{nameOrEmail}</span>
        </div>
      )
    }
  }

  // Fallback when client_id is not assigned to a registered user
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium" title="Uploaded directly by admin or system portal">
      <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      <span>Admin / System</span>
    </div>
  )
}

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingDoc, setRejectingDoc] = useState<DocumentWithRelations | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all')

  useEffect(() => { fetchDocuments() }, [])

  async function fetchDocuments() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*, templates:document_templates(*), signature_requests(signer_name, signer_email)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setDocuments((data as unknown as DocumentWithRelations[]) || [])
    } catch (e: unknown) {
      alert(`Error loading documents: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleViewFile(doc: DocumentWithRelations) {
    try {
      const bucket = doc.status === 'approved' && (doc.file_path.includes('_final') || doc.file_path.includes('_signed'))
        ? 'signed' : 'documents'
      const res = await getSignedUrlAction({ bucket, path: doc.file_path, expiresIn: 120 })
      if (res.success) window.open(res.signedUrl, '_blank')
      else throw new Error(res.error || "Could not retrieve signed link")
    } catch (e: unknown) {
      alert(`Failed to retrieve file link: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handleApprove(doc: DocumentWithRelations) {
    try {
      setProcessingId(doc.id)
      const res = await reviewDocumentAction({ document_id: doc.id, status: 'approved' })
      if (!res.success) throw new Error(res.error || "Review failed")
      const template = doc.templates
      if (template && template.file_path) {
        const mergeRes = await generateFilledDocumentAction(doc.id)
        if (mergeRes.success) alert("Document approved and filled PDF generated!")
        else alert(`Document approved, but form autofill failed: ${mergeRes.error}`)
      } else {
        alert("Document approved successfully!")
      }
      await fetchDocuments()
    } catch (e: unknown) {
      alert(`Failed to approve document: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleConfirmReject() {
    if (!rejectingDoc || !rejectReason.trim()) return
    try {
      setProcessingId(rejectingDoc.id)
      const res = await reviewDocumentAction({ document_id: rejectingDoc.id, status: 'rejected', rejection_reason: rejectReason.trim() })
      if (!res.success) throw new Error(res.error || "Rejection failed")
      setRejectingDoc(null)
      await fetchDocuments()
      alert("Document flagged rejected with notice sent successfully.")
    } catch (e: unknown) {
      alert(`Failed to reject document: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setProcessingId(null)
    }
  }

  // Filter documents based on search query and status filter
  const filteredDocuments = documents.filter(doc => {
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const query = searchQuery.toLowerCase().trim()
    if (!query) return matchesStatus

    const fileName = doc.file_path.toLowerCase()
    const docName = doc.name.toLowerCase()
    const clientId = (doc.client_id || '').toLowerCase()
    const templateName = (doc.templates?.name || '').toLowerCase()

    const matchesSearch = docName.includes(query) || fileName.includes(query) || clientId.includes(query) || templateName.includes(query)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="admin-page">
      {/* Title & Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="admin-heading">Client Documents</h1>
          <p className="admin-subheading">Review compliance submissions, download files, and trigger PDF auto-fill generation.</p>
        </div>
        <button
          onClick={fetchDocuments}
          disabled={loading}
          className="admin-btn-icon self-start md:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-semibold"
          title="Refresh Documents List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Document Name, File, or Client ID..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#012269] transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: 'All Files', count: documents.length },
            { key: 'pending_review', label: 'Pending Review', count: documents.filter(d => d.status === 'pending_review').length },
            { key: 'approved', label: 'Approved', count: documents.filter(d => d.status === 'approved').length },
            { key: 'rejected', label: 'Rejected', count: documents.filter(d => d.status === 'rejected').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-[#012269] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loader py-16 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <Loader2 className="admin-loader-icon" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="admin-empty">
          <FolderOpen className="admin-empty-icon" />
          <h3 className="admin-empty-title">
            {searchQuery || statusFilter !== 'all' ? 'No Matching Documents Found' : 'No Document Uploads'}
          </h3>
          <p className="admin-empty-text">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search query or filter settings.' 
              : 'When clients upload compliance items, they will appear here for review.'}
          </p>
        </div>
      ) : (
        <div className="admin-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="admin-thead">
                <tr>
                  <th>Client ID</th>
                  <th>Document Type</th>
                  <th>Attached File</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="admin-tbody">
                {filteredDocuments.map(doc => {
                  const template = doc.templates
                  const { cleanName, ext } = formatCleanFileName(doc.file_path)

                  return (
                    <tr key={doc.id} className="admin-tr">
                      {/* 1. Client ID Column (Formatted & Never Blank) */}
                      <td className="admin-td">
                        {renderClientIdCell(doc)}
                      </td>

                      {/* 2. Document Type Column */}
                      <td className="admin-td max-w-[240px]">
                        <span className="admin-cell-primary block font-bold text-gray-900 truncate" title={doc.name}>
                          {doc.name}
                        </span>
                        {template ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#012269] font-medium mt-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate max-w-full">
                            Template: {template.name} ({template.visa_subclass ? `Subclass ${template.visa_subclass}` : 'General'})
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            Client Uploaded File
                          </span>
                        )}
                      </td>

                      {/* 3. Attached File Column (Modern File Badge Card) */}
                      <td className="admin-td">
                        <button
                          onClick={() => handleViewFile(doc)}
                          className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-red-300 transition-all text-left max-w-[280px] shadow-2xs"
                          title={`Click to view/download ${cleanName}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 truncate group-hover:text-red-600 transition-colors" title={cleanName}>
                              {cleanName}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold mt-0.5">
                              <span className="px-1.5 py-0.2 bg-red-100/70 text-red-700 rounded text-[9px] font-extrabold">{ext}</span>
                              {doc.file_size ? (
                                <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                              ) : (
                                <span>Document</span>
                              )}
                            </div>
                          </div>
                          <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600 transition-colors shrink-0" />
                        </button>
                      </td>

                      {/* 4. Status Column */}
                      <td className="admin-td">
                        <span className={`admin-badge ${
                          doc.status === 'approved' ? 'admin-badge-success'
                          : doc.status === 'rejected' ? 'admin-badge-error'
                          : 'admin-badge-warn'
                        }`}>
                          {doc.status === 'approved' ? 'Approved' : doc.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                        </span>
                        {doc.rejection_reason && (
                          <p className="admin-cell-muted mt-1.5 max-w-[200px] whitespace-normal" style={{ color: 'var(--color-badge-error-text)' }}>
                            Reason: {doc.rejection_reason}
                          </p>
                        )}
                      </td>

                      {/* 5. Submitted At Column */}
                      <td className="admin-td admin-cell-muted">
                        {new Date(doc.created_at).toLocaleString('en-AU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* 6. Actions Column */}
                      <td className="admin-td text-right space-x-2">
                        <button onClick={() => handleViewFile(doc)} className="admin-btn-icon inline-flex" title="View file">
                          <Eye className="w-4 h-4" />
                        </button>
                        {doc.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(doc)}
                            disabled={processingId === doc.id}
                            className="p-2 rounded-xl border transition-all border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 inline-flex"
                            title="Approve & fill form"
                          >
                            {processingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                        )}
                        {doc.status !== 'rejected' && (
                          <button
                            onClick={() => setRejectingDoc(doc)}
                            disabled={processingId === doc.id}
                            className="p-2 rounded-xl border transition-all border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 inline-flex"
                            title="Reject document"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingDoc && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={() => setRejectingDoc(null)} />
          <div className="admin-modal-box">
            <h3 className="admin-modal-title">Reject Document Submission</h3>
            <p className="admin-cell-muted mb-4">Specify a clear rejection reason — this message will be shown to the client.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              required
              placeholder="e.g. Passport copy page is blurry. Please upload a high-resolution colour scan."
              className="admin-input resize-none"
            />
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={() => setRejectingDoc(null)} className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--color-admin-subtext)' }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingId === rejectingDoc.id || !rejectReason.trim()}
                className="admin-btn-danger disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

