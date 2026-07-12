'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  FolderOpen, Loader2, Eye, Check, X 
} from 'lucide-react'
import { getSignedUrlAction } from '@/app/actions/storage'
import { reviewDocumentAction, generateFilledDocumentAction } from '@/app/actions/document'
import { Document } from '@/lib/types'

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingDoc, setRejectingDoc] = useState<Document | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => { fetchDocuments() }, [])

  async function fetchDocuments() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*, templates:document_templates(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setDocuments((data as unknown as Document[]) || [])
    } catch (e: unknown) {
      alert(`Error loading documents: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleViewFile(doc: Document) {
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

  async function handleApprove(doc: Document) {
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

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-heading">Client Documents</h1>
        <p className="admin-subheading">Review compliance submissions, download files, and trigger PDF auto-fill generation.</p>
      </div>

      {loading ? (
        <div className="admin-loader py-12">
          <Loader2 className="admin-loader-icon" />
        </div>
      ) : documents.length === 0 ? (
        <div className="admin-empty">
          <FolderOpen className="admin-empty-icon" />
          <h3 className="admin-empty-title">No Document Uploads</h3>
          <p className="admin-empty-text">When clients upload compliance items, they will appear here for review.</p>
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
                {documents.map(doc => {
                  const template = doc.templates
                  return (
                    <tr key={doc.id} className="admin-tr">
                      <td className="admin-td font-mono text-xs" style={{ color: 'var(--color-admin-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.client_id}
                      </td>
                      <td className="admin-td">
                        <span className="admin-cell-primary block">{doc.name}</span>
                        {template && (
                          <span className="admin-cell-muted block mt-1">
                            Template: {template.name} (Subclass {template.visa_subclass})
                          </span>
                        )}
                      </td>
                      <td className="admin-td font-mono text-xs" style={{ color: 'var(--color-admin-muted)' }}>
                        {doc.file_path.split('/').pop()}
                      </td>
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
                      <td className="admin-td admin-cell-muted">
                        {new Date(doc.created_at).toLocaleString('en-AU')}
                      </td>
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
