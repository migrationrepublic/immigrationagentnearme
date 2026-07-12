'use client'

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  FileCode,
  Loader2,
  Settings,
  Eye,
  Play,
  Save,
  FileText,
  CheckCircle2,
  XCircle,
  Info,
  ArrowLeft,
  Send,
  PenTool,
  Signature,
  Calendar,
  User,
  Mail,
  Move,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Trash2,
} from 'lucide-react'
import { getSignedUrlAction } from '@/app/actions/storage'
import {
  extractPdfFieldsAction,
  saveFieldMappingsAction,
  previewFillPdfAction,
} from '@/app/actions/document'
import {
  getSignatureRequestsByDocumentAction,
  sendSignatureRequestsAction,
} from '@/app/actions/signature'
import { DocumentTemplate, DocumentField, SignatureRequest, PlacedFieldData, PDFRenderTask, PdfViewport, PdfRenderContext, PdfPage, PdfDocument } from '@/lib/types'

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------
type ToastVariant = 'success' | 'error' | 'info'
interface Toast { id: number; variant: ToastVariant; message: string }
let toastCounter = 0

// ── Domain types ─────────────────────────────────────────────────────────────
type FieldType = 'signature' | 'initial' | 'sign_date' | 'full_name' | 'email' | 'checkbox' | 'text'

interface PlacedField {
  id: string
  type: FieldType
  page: number
  x: number
  y: number
  w: number
  h: number
  signer_id: string
  value: string | boolean | null
}


// ---------------------------------------------------------------------------
// Main Wrapper Component with Suspense
// ---------------------------------------------------------------------------
export default function PDFEditorPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030E1E] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37] mb-3" />
        <p className="text-gray-400 text-sm font-medium">Loading layout editor…</p>
      </div>
    }>
      <PDFEditorPage />
    </Suspense>
  )
}

function PDFEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams.get('documentId') // If present, open Visual Signature Editor

  // Shared states
  const [toasts, setToasts] = useState<Toast[]>([])

  // ── 1. STATE FOR LEGACY FORM MAPPINGS ──────────────────────────────────────
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [fields, setFields] = useState<DocumentField[]>([])
  const [pdfFields, setPdfFields] = useState<Array<{ name: string; type: string }>>([])
  const [mappings, setMappings] = useState<Record<string, string>>({}) // fieldId → pdfFieldName
  const [sandboxData, setSandboxData] = useState<Record<string, string>>({})
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingFields, setLoadingFields] = useState(false)
  const [extractingPdf, setExtractingPdf] = useState(false)
  const [savingMapping, setSavingMapping] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [viewerLabel, setViewerLabel] = useState<'template' | 'preview'>('template')

  // ── 2. STATE FOR DYNAMIC SIGNATURE PLACEMENT EDITOR ─────────────────────────
  const [sigRequests, setSigRequests] = useState<SignatureRequest[]>([])
  const [activeSignerId, setActiveSignerId] = useState<string>('')
  const [pdfDocName, setPdfDocName] = useState('')
  const [pdfFileUrl, setPdfFileUrl] = useState<string | null>(null)
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false)
  const [pdfInstance, setPdfInstance] = useState<PdfDocument | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomScale, setZoomScale] = useState(1.2)
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]) // array of placed elements
  const [savingVisualPlacements, setSavingVisualPlacements] = useState(false)
  const [loadingVisualDoc, setLoadingVisualDoc] = useState(false)
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number } | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<PDFRenderTask | null>(null)

  // Signer color badges helper
  const colors = [
    { bg: 'bg-green-500/10 border-green-500/30 text-green-400', badge: 'green', color: '#10b981', hexBg: 'rgba(16,185,129,0.1)' },
    { bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400', badge: 'orange', color: '#f97316', hexBg: 'rgba(249,115,22,0.1)' },
    { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400', badge: 'blue', color: '#3b82f6', hexBg: 'rgba(59,130,246,0.1)' },
    { bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400', badge: 'purple', color: '#a855f7', hexBg: 'rgba(168,85,247,0.1)' },
    { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', badge: 'pink', color: '#f43f5e', hexBg: 'rgba(244,63,94,0.1)' }
  ]

  const getSignerColor = (signerEmail: string) => {
    const idx = sigRequests.findIndex(r => r.signer_email === signerEmail)
    return colors[idx % colors.length] || colors[0]
  }

  // Toast Helpers
  const showToast = useCallback((variant: ToastVariant, message: string) => {
    const id = ++toastCounter
    setToasts(prev => [...prev, { id, variant, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])


  // Inject PDF.js scripts dynamically
  const injectPdfjs = useCallback(async () => {
    if (window.pdfjsLib) {
      setTimeout(() => setPdfjsLoaded(true), 0)
      return
    }

    try {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        const pdfjsLib = window.pdfjsLib
        if (!pdfjsLib) return
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        setPdfjsLoaded(true)
      }
    } catch (err) {
      console.error('Failed to inject PDF.js library:', err)
      showToast('error', 'Failed to load PDF viewer engine.')
    }
  }, [showToast])

  // Load setup data for visual coordinates mapper
  const loadVisualEditorData = useCallback(async () => {
    if (!documentId) return
    try {
      setLoadingVisualDoc(true)

      // 1. Fetch document record to get its storage path
      const { data: doc, error: docErr } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (docErr || !doc) throw new Error(docErr?.message || 'Document not found.')
      setPdfDocName(doc.name)

      // 2. Fetch all signature requests linked to this document
      const res = await getSignatureRequestsByDocumentAction(documentId)
      if (!res.success) {
        throw new Error(res.error || 'Failed to load recipients list.')
      }

      const requests = res.requests || []
      setSigRequests(requests)
      if (requests.length > 0) {
        setActiveSignerId(requests[0].id)
      }

      // Re-hydrate placed fields from database
      const loadedFields: PlacedField[] = []
      requests.forEach((req: SignatureRequest) => {
        if (req.fields && Array.isArray(req.fields)) {
          req.fields.forEach((f: PlacedFieldData) => {
            loadedFields.push({
              id: f.id || `field_${Math.random().toString(36).substr(2, 9)}`,
              type: (f.type as FieldType) || 'text',
              page: f.page ?? 1,
              x: f.x ?? 0,
              y: f.y ?? 0,
              w: f.w ?? 24,
              h: f.h ?? 8,
              signer_id: req.id,
              value: f.value ?? null,
            })
          })
        }
      })
      setPlacedFields(loadedFields)

      // 3. Generate a signed URL for the original document PDF
      // Unsigned/filled docs are in 'signed' or 'documents' bucket
      let urlRes = await getSignedUrlAction({ bucket: 'documents', path: doc.file_path, expiresIn: 3600 })
      if (!urlRes.success) {
        urlRes = await getSignedUrlAction({ bucket: 'signed', path: doc.file_path, expiresIn: 3600 })
      }

      if (urlRes.success) {
        setPdfFileUrl(urlRes.signedUrl)
      } else {
        throw new Error(urlRes.error || 'Could not retrieve PDF file url.')
      }
    } catch (e: unknown) {
      showToast('error', `Failed to load document: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoadingVisualDoc(false)
    }
  }, [documentId, showToast])

  // Render PDF page to canvas
  const renderPdfPage = useCallback(async () => {
    if (!pdfjsLoaded || !pdfFileUrl || !canvasRef.current) return

    try {
      const pdfjsLib = window.pdfjsLib
      if (!pdfjsLib) return
      let pdf = pdfInstance

      if (!pdf) {
        const loadingTask = pdfjsLib.getDocument(pdfFileUrl)
        const loadedPdf = await loadingTask.promise
        setPdfInstance(loadedPdf)
        setTotalPages(loadedPdf.numPages)
        pdf = loadedPdf
      }

      // Cancel ongoing render task if any
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }

      const page = await pdf.getPage(currentPage)
      const viewport = page.getViewport({ scale: zoomScale })
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.height = viewport.height
        canvas.width = viewport.width
        setCanvasDimensions({ width: viewport.width, height: viewport.height })
        const renderContext: PdfRenderContext = {
          canvasContext: context,
          viewport,
        }

        const renderTask = page.render(renderContext)
        renderTaskRef.current = renderTask
        await renderTask.promise
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'RenderingCancelledException') {
        console.error('PDF page render error:', err)
      }
    }
  }, [pdfjsLoaded, pdfFileUrl, pdfInstance, currentPage, zoomScale])

  useEffect(() => {
    if (pdfjsLoaded && pdfFileUrl) {
      Promise.resolve().then(() => {
        renderPdfPage()
      })
    }
  }, [pdfjsLoaded, pdfFileUrl, currentPage, zoomScale, renderPdfPage])

  // Drag and drop visual elements mechanics
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('text/plain', type)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const container = e.currentTarget as HTMLDivElement
    const rect = container.getBoundingClientRect()
    const type = e.dataTransfer.getData('text/plain')

    if (!type || !activeSignerId) return

    // Compute coordinate percentages relative to viewport size
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Set standard size percentages based on type (scaled smaller to fit PDF grids)
    let w = 15 // Width percentage
    let h = 3.5  // Height percentage

    if (type === 'signature') {
      w = 15
      h = 5
    } else if (type === 'initial') {
      w = 8
      h = 4
    } else if (type === 'sign_date') {
      w = 11
      h = 3.5
    } else if (type === 'checkbox') {
      w = 3
      h = 2.5
    }

    const newField: PlacedField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: type as FieldType,
      page: currentPage,
      x: Math.min(Math.max(0, x - w / 2), 100 - w),
      y: Math.min(Math.max(0, y - h / 2), 100 - h),
      w,
      h,
      signer_id: activeSignerId,
      value: null,
    }

    setPlacedFields(prev => [...prev, newField])
    setSelectedFieldId(newField.id) // Automatically select newly placed field to show properties
    showToast('info', `Placed ${type} field on page ${currentPage}.`)
  }

  // Remove placed field
  const handleRemoveField = (id: string) => {
    setPlacedFields(prev => prev.filter(f => f.id !== id))
  }

  // Placed field reposition dragging refs
  const activeDraggingFieldIdRef = useRef<string | null>(null)
  const fieldDragStartPos = useRef<{ clientX: number; clientY: number; fieldX: number; fieldY: number } | null>(null)

  const handleFieldDragStart = (e: React.MouseEvent, field: PlacedField) => {
    e.stopPropagation()
    e.preventDefault()
    activeDraggingFieldIdRef.current = field.id
    fieldDragStartPos.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      fieldX: field.x,
      fieldY: field.y
    }
  }

  // Container level handlers to support smooth dragging without freezing
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!activeDraggingFieldIdRef.current || !fieldDragStartPos.current || !containerRef.current) return
    e.preventDefault()

    const fieldId = activeDraggingFieldIdRef.current
    const field = placedFields.find(f => f.id === fieldId)
    if (!field) return

    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = ((e.clientX - fieldDragStartPos.current.clientX) / rect.width) * 100
    const deltaY = ((e.clientY - fieldDragStartPos.current.clientY) / rect.height) * 100

    const nextX = Math.min(Math.max(0, fieldDragStartPos.current.fieldX + deltaX), 100 - field.w)
    const nextY = Math.min(Math.max(0, fieldDragStartPos.current.fieldY + deltaY), 100 - field.h)

    setPlacedFields(prev =>
      prev.map(f => (f.id === fieldId ? { ...f, x: parseFloat(nextX.toFixed(2)), y: parseFloat(nextY.toFixed(2)) } : f))
    )
  }

  const handleContainerMouseUp = () => {
    activeDraggingFieldIdRef.current = null
    fieldDragStartPos.current = null
  }

  // Finalize & Send visual document signature requests
  const handleSendVisualWorkflow = async () => {
    if (placedFields.length === 0) {
      showToast('error', 'Please drag and drop at least one signature block onto the document.')
      return
    }

    // Verify all signers have at least one signature/initial element placed
    for (const signer of sigRequests) {
      const hasPlacements = placedFields.some(f => f.signer_id === signer.id && (f.type === 'signature' || f.type === 'initial'))
      if (!hasPlacements) {
        showToast('error', `Please place at least one signature or initial box for ${signer.signer_name} (${signer.signer_email}).`)
        return
      }
    }

    try {
      setSavingVisualPlacements(true)

      // Map placed fields back to each recipient row
      const payloadRequests = sigRequests.map(req => {
        // Find fields assigned to this request
        const assignedFields = placedFields
          .filter(f => f.signer_id === req.id)
          .map(f => ({
            id: f.id,
            type: f.type,
            page: f.page,
            x: parseFloat(f.x.toFixed(2)),
            y: parseFloat(f.y.toFixed(2)),
            w: parseFloat(f.w.toFixed(2)),
            h: parseFloat(f.h.toFixed(2)),
            value: null as null,
          }))

        return {
          id: req.id,
          fields: assignedFields,
        }
      })

      // Trigger the server action to activate requests (save mapping + notify first signers)
      const res = await sendSignatureRequestsAction({
        document_id: documentId!,
        requests: payloadRequests,
      })

      if (res.success) {
        showToast('success', 'Document sent for signature successfully!')
        router.push('/admin/signature-requests')
      } else {
        throw new Error(res.error)
      }
    } catch (e: unknown) {
      showToast('error', `Failed to send document: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSavingVisualPlacements(false)
    }
  }

  // ── 3. STATE FOR LEGACY FORM MAPPINGS (UNCHANGED) ───────────────────────────

  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true)
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setTemplates(data || [])
    } catch (e: unknown) {
      showToast('error', `Failed to load templates: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoadingTemplates(false)
    }
  }, [showToast])

  // ── INITIALISE DATA ────────────────────────────────────────────────────────
  // Placed after all three referenced functions so no variable is accessed
  // before its declaration (fixes ESLint no-use-before-define warnings).
  useEffect(() => {
    if (documentId) {
      Promise.resolve().then(() => {
        loadVisualEditorData()
        injectPdfjs()
      })
    } else {
      Promise.resolve().then(() => {
        fetchTemplates()
      })
    }
  }, [documentId, loadVisualEditorData, injectPdfjs, fetchTemplates])

  async function handleSelectTemplate(e: React.ChangeEvent<HTMLSelectElement>) {
    const tplId = e.target.value
    const tpl = templates.find(t => t.id === tplId) || null

    setSelectedTemplate(tpl)
    setFields([])
    setPdfFields([])
    setMappings({})
    setSandboxData({})
    setViewerUrl(null)
    setViewerLabel('template')

    if (!tpl) return

    try {
      setLoadingFields(true)
      const { data, error } = await supabase
        .from('document_fields')
        .select('*')
        .eq('template_id', tpl.id)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setFields(data || [])

      const currentMappings: Record<string, string> = {}
      data?.forEach(f => {
        if (f.pdf_field_name) {
          currentMappings[f.id] = f.pdf_field_name
        }
      })
      setMappings(currentMappings)

      const initialSandbox: Record<string, string> = {}
      data?.forEach(f => { initialSandbox[f.field_name] = '' })
      setSandboxData(initialSandbox)

      if (tpl.file_path) {
        const urlRes = await getSignedUrlAction({
          bucket: 'templates',
          path: tpl.file_path,
          expiresIn: 1200,
        })

        if (urlRes.success) {
          setViewerUrl(urlRes.signedUrl)
          setViewerLabel('template')
        } else {
          throw new Error(urlRes.error || 'Failed to generate PDF signed URL')
        }
        await loadPdfFormFields(tpl.file_path)
      }
    } catch (err: unknown) {
      showToast('error', `Error loading template: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoadingFields(false)
    }
  }

  async function loadPdfFormFields(filePath: string) {
    try {
      setExtractingPdf(true)
      const res = await extractPdfFieldsAction(filePath)
      if (res.success && res.fields) {
        setPdfFields(res.fields)
        showToast('info', `${res.fields.length} PDF form field(s) detected`)
      }
    } catch (e) {
      console.error('[PDF Editor] loadPdfFormFields error:', e)
    } finally {
      setExtractingPdf(false)
    }
  }

  async function handleSaveMappings() {
    if (!selectedTemplate) return
    try {
      setSavingMapping(true)
      const payload = Object.entries(mappings)
        .filter(([, pdfFieldName]) => !!pdfFieldName)
        .map(([fieldId, pdfFieldName]) => ({ fieldId, pdfFieldName }))

      const res = await saveFieldMappingsAction({
        templateId: selectedTemplate.id,
        mappings: payload,
      })

      if (res.success) {
        showToast('success', 'Field mappings saved successfully!')
      } else {
        throw new Error(res.error)
      }
    } catch (e: unknown) {
      showToast('error', `Failed to save mappings: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSavingMapping(false)
    }
  }

  async function handleGeneratePreview() {
    if (!selectedTemplate || !selectedTemplate.file_path) return

    try {
      setPreviewLoading(true)
      const res = await previewFillPdfAction(selectedTemplate.id, sandboxData)
      if (!res.success || !res.dataUri) {
        throw new Error(res.error || 'Preview generation failed')
      }
      setViewerUrl(res.dataUri)
      setViewerLabel('preview')
      showToast('success', 'Preview generated!')
    } catch (e: unknown) {
      showToast('error', `Preview failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Visual drag canvas reference wrapper
  const containerRef = useRef<HTMLDivElement>(null)

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#030E1E] text-white p-6 relative">

      {/* ── Toast Notifications ───────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={`
              flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl max-w-sm w-full
              text-sm font-medium cursor-pointer pointer-events-auto
              border backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300
              ${toast.variant === 'success'
                ? 'bg-green-950/90 border-green-700/60 text-green-200'
                : toast.variant === 'error'
                  ? 'bg-red-950/90 border-red-700/60 text-red-200'
                  : 'bg-[#07162c]/95 border-gray-700/60 text-gray-200'
              }
            `}
          >
            {toast.variant === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />}
            {toast.variant === 'error' && <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
            {toast.variant === 'info' && <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />}
            <span className="leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* ─── CASE A: DYNAMIC SIGNATURE PLACEMENT WRITER (Screen 5) ────────── */}
      {documentId ? (
        <div className="flex flex-col h-[calc(100vh-50px)]">

          {/* Top Navbar */}
          <div className="bg-[#07162c] border border-gray-800 rounded-2xl p-4 mb-5 flex items-center justify-between shadow-xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/signature-requests')}
                className="p-2 border border-gray-800 hover:border-gray-700 bg-[#0a1b32]/40 rounded-xl hover:text-white text-gray-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight truncate max-w-md">{pdfDocName}</h1>
                <p className="text-[10px] text-gray-500 mt-0.5">Drag-and-drop interactive blocks to define signature coordinates.</p>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
              <div className="flex items-center gap-3 bg-[#0a1b32]/50 px-3 py-1.5 border border-gray-800 rounded-xl">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold font-mono">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-2 bg-[#0a1b32]/50 px-3 py-1.5 border border-gray-800 rounded-xl">
              <button
                onClick={() => setZoomScale(z => Math.max(0.6, z - 0.1))}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold font-mono w-10 text-center">{Math.round(zoomScale * 100)}%</span>
              <button
                onClick={() => setZoomScale(z => Math.min(2.0, z + 0.1))}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSendVisualWorkflow}
              disabled={savingVisualPlacements || loadingVisualDoc}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#bfa032] disabled:opacity-50 text-[#030E1E] text-xs font-black rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-[#D4AF37]/10"
            >
              {savingVisualPlacements ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Send Document
                </>
              )}
            </button>
          </div>

          {/* Main Layout Workspace */}
          {loadingVisualDoc ? (
            <div className="flex-1 flex flex-col justify-center items-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37] mb-3" />
              <p className="text-sm text-gray-400">Loading document configuration…</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden min-h-0">

              {/* Panel 1: Left Columns (Draggable elements, Active Signer and Document Thumbnails) */}
              <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-1">

                {/* 1A. Active Signer Selector */}
                <div className="bg-[#07162c] border border-gray-800 rounded-2xl p-4 shadow-xl">
                  <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Signers list
                  </h3>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {sigRequests.map(req => {
                      const signerColor = getSignerColor(req.signer_email)
                      const isSelected = activeSignerId === req.id
                      const count = placedFields.filter(f => f.signer_id === req.id).length

                      return (
                        <button
                          key={req.id}
                          type="button"
                          onClick={() => setActiveSignerId(req.id)}
                          className="w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all"
                          style={{
                            borderColor: isSelected ? signerColor.color : 'rgba(31, 41, 55, 0.8)',
                            backgroundColor: isSelected ? signerColor.hexBg : '#051020',
                            color: isSelected ? '#ffffff' : '#9ca3af',
                          }}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{req.signer_name}</p>
                            <p className="text-[9px] text-gray-500 truncate font-mono">{req.signer_email}</p>
                          </div>
                          {count > 0 && (
                            <span
                              className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full text-white shrink-0 ml-1"
                              style={{ backgroundColor: signerColor.color }}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 1B. Standard Fields Palette */}
                <div className="bg-[#07162c] border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col max-h-64">
                  <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-800 pb-2 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-[#D4AF37]" /> Standard Fields
                  </h3>

                  <div className="space-y-2 overflow-y-auto pr-1">
                    {[
                      { type: 'signature', label: 'Signature Box', icon: PenTool },
                      { type: 'initial', label: 'Initial Stamp', icon: Signature },
                      { type: 'sign_date', label: 'Sign Date', icon: Calendar },
                      { type: 'full_name', label: 'Full Name', icon: User },
                      { type: 'email', label: 'Email Text', icon: Mail },
                      { type: 'checkbox', label: 'Checkbox', icon: CheckCircle2 },
                      { type: 'text', label: 'Custom Text Box', icon: FileText }
                    ].map(field => {
                      const Icon = field.icon
                      return (
                        <div
                          key={field.type}
                          draggable
                          onDragStart={(e) => handleDragStart(e, field.type)}
                          className="flex items-center gap-3 px-3 py-2 bg-[#0a1b32]/60 hover:bg-[#0c1f38] border border-gray-800 hover:border-gray-700 rounded-xl cursor-grab active:cursor-grabbing text-xs text-gray-300 hover:text-white transition-all"
                        >
                          <Icon className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          <span className="font-semibold">{field.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 1C. Document Pages Thumbnail list */}
                <div className="bg-[#07162c] border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col flex-1 min-h-[160px]">
                  <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2">
                    Document Pages
                  </h3>
                  <div className="space-y-2 overflow-y-auto flex-1 max-h-56">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pNum = i + 1
                      const pageFieldsCount = placedFields.filter(f => f.page === pNum).length

                      return (
                        <button
                          key={pNum}
                          onClick={() => setCurrentPage(pNum)}
                          className={`
                            w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left shrink-0 transition-all
                            ${currentPage === pNum
                              ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white'
                              : 'border-gray-800 bg-[#051020] text-gray-400 hover:text-white hover:border-gray-700'
                            }
                          `}
                        >
                          <span className="text-xs font-bold">Page {pNum}</span>
                          {pageFieldsCount > 0 && (
                            <span className="bg-blue-500 text-white font-bold font-mono text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                              {pageFieldsCount}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Panel 2: Center Canvas (Viewport) */}
              <div className="lg:col-span-3 bg-gray-950 border border-gray-800 rounded-2xl overflow-auto shadow-xl relative flex items-start justify-center p-6 min-h-96">
                {!pdfjsLoaded ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mb-2" />
                    <p className="text-xs text-gray-500">Loading render engine…</p>
                  </div>
                ) : (
                  <div
                    ref={containerRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onMouseMove={handleContainerMouseMove}
                    onMouseUp={handleContainerMouseUp}
                    onMouseLeave={handleContainerMouseUp}
                    className="relative border border-gray-800 shadow-2xl bg-white select-none shrink-0"
                    style={{
                      width: canvasDimensions?.width ? `${canvasDimensions.width}px` : 'auto',
                      height: canvasDimensions?.height ? `${canvasDimensions.height}px` : 'auto',
                    }}
                  >
                    <canvas ref={canvasRef} className="block w-full h-full" />

                    {/* Visual elements overlays */}
                    {placedFields
                      .filter(f => f.page === currentPage)
                      .map(field => {
                        const signer = sigRequests.find(r => r.id === field.signer_id)
                        const signerColor = getSignerColor(signer?.signer_email || '')
                        const isSelected = selectedFieldId === field.id

                        return (
                          <div
                            key={field.id}
                            style={{
                              position: 'absolute',
                              left: `${field.x}%`,
                              top: `${field.y}%`,
                              width: `${field.w}%`,
                              height: `${field.h}%`,
                              border: isSelected ? `2.5px solid ${signerColor.color}` : `1.5px dashed ${signerColor.color}`,
                              backgroundColor: signerColor.hexBg,
                              color: signerColor.color,
                              zIndex: isSelected ? 30 : 10
                            }}
                            className="rounded px-1.5 py-1 flex flex-col justify-between cursor-move shadow-md group select-none overflow-hidden"
                            onMouseDown={(e) => {
                              handleFieldDragStart(e, field)
                              setSelectedFieldId(field.id)
                            }}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[7.5px] uppercase font-black tracking-wider leading-none truncate max-w-[80%] flex items-center gap-0.5">
                                <Move className="w-2 h-2 shrink-0" />
                                {field.type}
                              </span>
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                  handleRemoveField(field.id)
                                  if (selectedFieldId === field.id) setSelectedFieldId(null)
                                }}
                                className="w-3.5 h-3.5 text-red-500 hover:text-red-400 flex items-center justify-center text-[9px] font-bold leading-none select-none"
                              >
                                ×
                              </button>
                            </div>

                            <div className="text-[7px] truncate font-medium text-gray-800 bg-white/80 rounded px-0.5 py-px mt-0.5 border border-gray-300 w-full leading-none">
                              {signer?.signer_name || 'Signer'}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>

              {/* Panel 3: Right Sidebar Selected Field Properties Drawer (Zoho Style) */}
              <div className="lg:col-span-1 bg-[#07162c] border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col">
                <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-orange-400" /> Field Properties
                </h3>

                {selectedFieldId ? (() => {
                  const field = placedFields.find(f => f.id === selectedFieldId)
                  if (!field) return <p className="text-xs text-gray-500 text-center py-8">Select a field on the canvas to configure properties.</p>

                  return (
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">Field ID</span>
                        <code className="bg-[#051020] p-1.5 rounded block text-[9.5px] text-gray-300 font-mono truncate">{field.id}</code>
                      </div>

                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">Field Type</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize bg-gray-800 text-gray-300 border border-gray-700">{field.type}</span>
                      </div>

                      {/* Signer Assignment */}
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">Assigned Signer</span>
                        <select
                          value={field.signer_id}
                          onChange={(e) => {
                            setPlacedFields(prev =>
                              prev.map(f => (f.id === selectedFieldId ? { ...f, signer_id: e.target.value } : f))
                            )
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-800 bg-[#0c1e35] outline-none text-white focus:border-[#D4AF37]"
                        >
                          {sigRequests.map(r => (
                            <option key={r.id} value={r.id}>{r.signer_name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Coordinate and Size Adjustments */}
                      <div className="space-y-2 pt-2 border-t border-gray-800">
                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Dimensions (%)</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-gray-500 block mb-0.5">Width (%)</label>
                            <input
                              type="number"
                              min={2}
                              max={100}
                              value={Math.round(field.w)}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(2, parseInt(e.target.value) || 2))
                                setPlacedFields(prev => prev.map(f => (f.id === selectedFieldId ? { ...f, w: val } : f)))
                              }}
                              className="w-full px-2.5 py-1 rounded bg-[#0c1e35] border border-gray-800 text-white text-center font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-500 block mb-0.5">Height (%)</label>
                            <input
                              type="number"
                              min={2}
                              max={100}
                              value={Math.round(field.h)}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(2, parseInt(e.target.value) || 2))
                                setPlacedFields(prev => prev.map(f => (f.id === selectedFieldId ? { ...f, h: val } : f)))
                              }}
                              className="w-full px-2.5 py-1 rounded bg-[#0c1e35] border border-gray-800 text-white text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-800">
                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Offsets / Coordinates (%)</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-gray-500 block mb-0.5">X Offset</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={Math.round(field.x)}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                setPlacedFields(prev => prev.map(f => (f.id === selectedFieldId ? { ...f, x: val } : f)))
                              }}
                              className="w-full px-2.5 py-1 rounded bg-[#0c1e35] border border-gray-800 text-white text-center font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-500 block mb-0.5">Y Offset</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={Math.round(field.y)}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                setPlacedFields(prev => prev.map(f => (f.id === selectedFieldId ? { ...f, y: val } : f)))
                              }}
                              className="w-full px-2.5 py-1 rounded bg-[#0c1e35] border border-gray-800 text-white text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Required Field Checkbox */}
                      <div className="pt-2 border-t border-gray-800">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold py-1">
                          <input
                            type="checkbox"
                            className="rounded border-gray-800 bg-[#0c1e35] text-[#D4AF37] focus:ring-0"
                            checked={field.value === 'required'}
                            onChange={(e) => {
                              setPlacedFields(prev =>
                                prev.map(f => (f.id === selectedFieldId ? { ...f, value: e.target.checked ? 'required' : null } : f))
                              )
                            }}
                          />
                          <span>Required validation field</span>
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-gray-800">
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveField(field.id)
                            setSelectedFieldId(null)
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-950/20 border border-red-800 text-red-400 hover:bg-red-900 hover:text-red-200 transition-colors uppercase tracking-wider font-extrabold text-[10px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Field
                        </button>
                      </div>

                    </div>
                  )
                })() : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                    <Info className="w-8 h-8 mb-2" />
                    <p className="text-xs">Click any placed field on the document to edit its configurations and constraints.</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      ) : (
        /* ─── CASE B: LEGACY PDF CHECKLIST ACROFORM KEY MAPPER ────────────── */
        <div className="flex flex-col h-[calc(100vh-140px)] relative">

          {/* Selector Toolbar */}
          <div className="bg-[#07162c] rounded-2xl border border-gray-800 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <Settings className="w-6 h-6 text-[#D4AF37] shrink-0" />
              <div className="w-full md:w-80">
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading templates…
                  </div>
                ) : (
                  <select
                    onChange={handleSelectTemplate}
                    defaultValue=""
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-800 bg-[#0c1e35] outline-none text-white focus:border-[#D4AF37] text-sm"
                  >
                    <option value="">— Choose Visa PDF Template —</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.visa_subclass ? ` (Subclass ${t.visa_subclass})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {selectedTemplate && (
              <div className="flex gap-3 shrink-0">
                <button
                  id="btn-save-field-mappings"
                  onClick={handleSaveMappings}
                  disabled={savingMapping || loadingFields}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#bfa032] disabled:opacity-50 disabled:cursor-not-allowed text-[#030E1E] text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
                >
                  {savingMapping
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Save className="w-3.5 h-3.5" />}
                  Save Field Mappings
                </button>
                <button
                  id="btn-generate-preview"
                  onClick={handleGeneratePreview}
                  disabled={previewLoading || !selectedTemplate.file_path || loadingFields}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
                >
                  {previewLoading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Play className="w-3.5 h-3.5" />}
                  Generate &amp; Preview Fill
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          {selectedTemplate ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8 overflow-hidden min-h-0">

              {/* Left column — mapping + sandbox panels */}
              <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 min-h-0 font-sans">

                {/* Field Mapping Panel */}
                <div className="bg-[#07162c] rounded-2xl border border-gray-800 p-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2 uppercase tracking-wider">
                    <FileCode className="w-4 h-4 text-[#D4AF37]" /> Field Mapping Keys
                  </h3>
                  <p className="text-[11px] text-gray-400 mb-4 font-normal">
                    Select the AcroForm PDF field that each template field should fill.
                  </p>

                  {loadingFields ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                    </div>
                  ) : extractingPdf ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 py-4 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" /> Extracting PDF form fields…
                    </div>
                  ) : fields.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      No fields configured for this template yet.
                    </p>
                  ) : (
                    <div className="space-y-3.5">
                      {fields.map(f => (
                        <div key={f.id} className="p-3 bg-[#0a1b32]/50 border border-gray-800/80 rounded-xl space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-xs text-white leading-tight">{f.field_label}</span>
                            <span className="text-[9px] font-mono text-gray-500 shrink-0">key: {f.field_name}</span>
                          </div>
                          <select
                            value={mappings[f.id] || ''}
                            onChange={e => setMappings(prev => ({ ...prev, [f.id]: e.target.value }))}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-700 bg-[#0c1e35] outline-none text-white focus:border-[#D4AF37]"
                          >
                            <option value="">— Do Not Map —</option>
                            {pdfFields.map(pf => (
                              <option key={pf.name} value={pf.name}>
                                {pf.name} ({pf.type})
                              </option>
                            ))}
                          </select>
                          {mappings[f.id] && (
                            <p className="text-[10px] text-green-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Mapped → <span className="font-mono">{mappings[f.id]}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sandbox Simulation Panel */}
                <div className="bg-[#07162c] rounded-2xl border border-gray-800 p-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2 uppercase tracking-wider">
                    <Eye className="w-4 h-4 text-[#D4AF37]" /> Live Preview Sandbox
                  </h3>
                  <p className="text-[11px] text-gray-400 mb-4 font-normal">
                    Enter test values below, then click <strong className="text-white">Generate &amp; Preview Fill</strong> to see them placed in the PDF.
                  </p>

                  {fields.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      Add fields to the template first to simulate a data merge.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {fields.map(f => (
                        <div key={f.id} className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 font-semibold">
                            {f.field_label}
                            {!mappings[f.id] && (
                              <span className="ml-1 text-yellow-600 normal-case tracking-normal font-normal">(not mapped)</span>
                            )}
                          </label>
                          <input
                            type={f.field_type === 'date' ? 'date' : f.field_type === 'number' ? 'number' : 'text'}
                            value={sandboxData[f.field_name] || ''}
                            onChange={e => setSandboxData(prev => ({ ...prev, [f.field_name]: e.target.value }))}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-800 bg-[#0c1e35] outline-none text-white focus:border-[#D4AF37]"
                            placeholder={`Test value for ${f.field_label}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column — PDF viewer */}
              <div className="lg:col-span-3 bg-[#07162c] rounded-2xl border border-gray-800 shadow-xl overflow-hidden flex flex-col h-full min-h-0">
                <div className="bg-[#0c1e35] p-3.5 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#D4AF37]" />
                    PDF Template Viewer
                  </span>
                  <div className="flex items-center gap-2">
                    {previewLoading && (
                      <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Generating…
                      </span>
                    )}
                    {viewerLabel === 'preview' && !previewLoading && (
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                        Preview Fill
                      </span>
                    )}
                    {selectedTemplate.file_path ? (
                      <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                        Active PDF
                      </span>
                    ) : (
                      <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                        No PDF Uploaded
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 bg-gray-950 relative min-h-0">
                  {viewerUrl ? (
                    <iframe
                      src={`${viewerUrl}${viewerLabel === 'template' ? '#toolbar=0&navpanes=0' : ''}`}
                      className="w-full h-full border-none"
                      title="PDF template viewer"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gray-950">
                      <FileText className="w-16 h-16 text-gray-800 mb-3" />
                      <h4 className="text-sm font-bold text-gray-500">No PDF Rendered</h4>
                      <p className="text-xs text-gray-600 max-w-xs mt-1">
                        {selectedTemplate.file_path
                          ? 'Loading PDF viewer…'
                          : 'Upload a fillable PDF in Document Templates first, then return here to map fields.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 bg-[#07162c] rounded-2xl border border-gray-800 shadow-xl p-12 text-center flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Template Selected</h3>
              <p className="text-gray-400 text-sm max-w-sm font-normal">
                Choose a document template from the dropdown above to map its fields to PDF AcroForm keys and test the fill preview.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
