'use client'

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { useParams } from 'next/navigation'
import {
  getSignatureRequestByTokenAction,
  updateSignatureStatusAction,
} from '@/app/actions/signature'
import { getSignedUrlAction } from '@/app/actions/storage'
import {
  PenLine,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Clock,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
  X,
  ListChecks,
} from 'lucide-react'

import { PdfRenderContext, PdfDocument } from '@/lib/types'

// ── Domain field types ──────────────────────────────────────────────────────────
type FieldType = 'signature' | 'initial' | 'sign_date' | 'full_name' | 'first_name' | 'last_name' | 'email' | 'checkbox' | 'text'

interface SignField {
  id: string
  type: FieldType
  page: number
  x: number
  y: number
  w: number
  h: number
  value: string | boolean | null
  /** Optional admin-set caption (e.g. "Business Address") shown in place of a generic "Text box #1". */
  label?: string
}

// Overlay inputs sit directly inside the PDF's own printed field box, so the
// border stays thin and muted (never a bold competing box) — just enough to
// show the signer at a glance which fields still need attention (teal) vs
// which are already filled (emerald), matching the field's real placed size.
const overlayInputClass = "w-full h-full rounded-[3px] text-gray-900 text-xs px-0.5 py-0 outline-none text-left font-sans font-semibold transition-colors"

function overlayFieldClass(filled: boolean): string {
  return `${overlayInputClass} ${
    filled
      ? 'border border-emerald-300/80 bg-emerald-50/40 focus:bg-emerald-50/70 focus:ring-1 focus:ring-emerald-400'
      : 'border border-teal-300/80 bg-teal-50/20 focus:bg-teal-50/50 focus:ring-1 focus:ring-teal-400'
  }`
}

// Fields a signer must complete before submitting (checkboxes stay optional).
const REQUIRED_FIELD_TYPES: FieldType[] = ['signature', 'initial', 'text', 'sign_date', 'first_name', 'last_name', 'full_name', 'email']

function isFieldFilled(field: SignField): boolean {
  if (field.type === 'signature' || field.type === 'initial') return !!field.value
  if (field.type === 'checkbox') return true // optional — never blocks progress
  if (['full_name', 'first_name', 'last_name', 'sign_date', 'email'].includes(field.type)) {
    return field.value !== '' && field.value !== null
  }
  return !!field.value && String(field.value).trim() !== ''
}

// Short guided prompt shown in the callout next to the active field.
function fieldPromptText(type: FieldType): string {
  switch (type) {
    case 'signature':
    case 'initial':
      return 'Sign here.'
    case 'sign_date':
      return 'Enter date.'
    case 'email':
      return 'Enter email.'
    case 'first_name':
      return 'Enter first name.'
    case 'last_name':
      return 'Enter last name.'
    case 'full_name':
      return 'Enter full name.'
    default:
      return 'Enter text.'
  }
}

// The native <input type="date"> picker requires ISO (YYYY-MM-DD); the rest
// of the app (PDF fill, validation) works with the AU display format.
function ddmmyyyyToIso(value: string): string {
  const [dd, mm, yyyy] = value.split('/')
  if (!dd || !mm || !yyyy || yyyy.length !== 4) return ''
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function isoToDdmmyyyy(value: string): string {
  const [yyyy, mm, dd] = value.split('-')
  if (!dd || !mm || !yyyy) return ''
  return `${dd}/${mm}/${yyyy}`
}

// ── Types ─────────────────────────────────────────────────────────────────
interface RequestData {
  requestId: string
  signerName: string
  signerEmail: string
  status: string
  documentName: string
  documentPath: string
  documentBucket: string
  expiresAt: string | null
  isExpired: boolean
  signedAt: string | null
  fields: SignField[]
}

type PageState = 'loading' | 'error' | 'expired' | 'already_signed' | 'declined' | 'ready' | 'submitting' | 'success'

// ─────────────────────────────────────────────────────────────────
// Signature Drawing Canvas Modal
// ─────────────────────────────────────────────────────────────────
interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (dataUrl: string) => void
}

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (dataUrl: string) => void
  defaultSignerName?: string
}

function SignatureModal({ isOpen, onClose, onConfirm, defaultSignerName = 'Signer' }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'type' | 'draw' | 'upload'>('type')
  const [strokeColor, setStrokeColor] = useState('#000000')

  // TYPE Tab state
  const [typedName, setTypedName] = useState(defaultSignerName)
  const [typedInitial, setTypedInitial] = useState(defaultSignerName ? defaultSignerName.charAt(0).toUpperCase() : 'S')
  const fontFamilies = [
    { name: 'Great Vibes', font: "'Great Vibes', cursive" },
    { name: 'Caveat', font: "'Caveat', cursive" },
    { name: 'Mrs Saint Delafield', font: "'Mrs Saint Delafield', cursive" },
    { name: 'Sacramento', font: "'Sacramento', cursive" },
    { name: 'Alex Brush', font: "'Alex Brush', cursive" }
  ]
  const [selectedFontIndex, setSelectedFontIndex] = useState(0)

  // DRAW Tab refs and states
  const sigCanvasRef = useRef<HTMLCanvasElement>(null)
  const initCanvasRef = useRef<HTMLCanvasElement>(null)

  const [sigIsDrawing, setSigIsDrawing] = useState(false)
  const [sigHasStrokes, setSigHasStrokes] = useState(false)
  const sigLastPos = useRef<{ x: number; y: number } | null>(null)

  const [initIsDrawing, setInitIsDrawing] = useState(false)
  const initLastPos = useRef<{ x: number; y: number } | null>(null)

  // UPLOAD Tab state
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState('')

  // Inject Google Fonts dynamic link
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Caveat:wght@400;700&family=Great+Vibes&family=Mrs+Saint+Delafield&family=Sacramento&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }, [])

  // (Removed prop-to-state sync effect; now handled via React key resetting on instantiation)

  // Clear Canvas helpers
  const handleClearSig = () => {
    const canvas = sigCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSigHasStrokes(false)
  };

  const handleClearInit = () => {
    const canvas = initCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // Draw setup
  const initCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [strokeColor])

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      setTimeout(() => {
        initCanvas(sigCanvasRef.current)
        initCanvas(initCanvasRef.current)
      }, 100)
    }
  }, [isOpen, activeTab, initCanvas])

  if (!isOpen) return null

  // Sign drawing helper
  const getCanvasPos = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 }
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  // Signature drawing events
  const startSigDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = sigCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setSigIsDrawing(true)
    const p = getCanvasPos(canvas, e)
    sigLastPos.current = p
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }

  const sigDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = sigCanvasRef.current
    if (!sigIsDrawing || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const p = getCanvasPos(canvas, e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    sigLastPos.current = p
    setSigHasStrokes(true)
  }

  const stopSigDraw = () => {
    setSigIsDrawing(false)
    sigLastPos.current = null
  }

  // Initial drawing events
  const startInitDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = initCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setInitIsDrawing(true)
    const p = getCanvasPos(canvas, e)
    initLastPos.current = p
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }

  const initDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = initCanvasRef.current
    if (!initIsDrawing || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const p = getCanvasPos(canvas, e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    initLastPos.current = p
  }

  const stopInitDraw = () => {
    setInitIsDrawing(false)
    initLastPos.current = null
  }

  // Upload handler
  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image signature file.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setUploadedBase64(reader.result as string)
      setUploadedFileName(file.name)
    }
    reader.readAsDataURL(file)
  }

  // Confirm and Generate final Image
  const handleConfirmSignature = () => {
    if (activeTab === 'type') {
      if (!typedName.trim()) return
      const canvas = document.createElement('canvas')
      canvas.width = 500
      canvas.height = 150
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Leave the canvas transparent (its default state) instead of painting
        // a white backing rectangle — a solid fill here bakes an opaque box
        // into the exported PNG, which then shows up as a visible white/grey
        // block behind the signature once it's stamped onto the PDF page.
        ctx.fillStyle = strokeColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `50px ${fontFamilies[selectedFontIndex].font}`
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2)
      }
      onConfirm(canvas.toDataURL('image/png'))
      onClose()
    } else if (activeTab === 'draw') {
      if (!sigHasStrokes || !sigCanvasRef.current) return
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = sigCanvasRef.current.width
      finalCanvas.height = sigCanvasRef.current.height
      const finalCtx = finalCanvas.getContext('2d')
      if (finalCtx) {
        // Same as above — copy the drawn strokes onto a transparent canvas,
        // no white fill, so the exported PNG blends into the PDF page.
        finalCtx.drawImage(sigCanvasRef.current, 0, 0)
      }
      onConfirm(finalCanvas.toDataURL('image/png'))
      onClose()
    } else {
      if (!uploadedBase64) return
      onConfirm(uploadedBase64)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[94vh] overflow-y-auto">

        {/* Zoho Tabs Selector */}
        <div className="flex border-b border-gray-100 mb-6 gap-6 text-xs font-bold">
          {[
            { key: 'type', label: 'TYPE' },
            { key: 'draw', label: 'DRAW' },
            { key: 'upload', label: 'UPLOAD' }
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as 'type' | 'draw' | 'upload')}
              className={`pb-3 border-b-2 uppercase tracking-wider transition-all ${activeTab === t.key
                ? 'border-[#012269] text-[#012269]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CASE A: TYPE TAB ── */}
        {activeTab === 'type' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1 text-xs">
                <label className="font-bold text-gray-500">Signature Name</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none text-gray-800 focus:border-[#012269]"
                />
              </div>
              <div className="col-span-1 space-y-1 text-xs">
                <label className="font-bold text-gray-500">Initial</label>
                <input
                  type="text"
                  maxLength={3}
                  value={typedInitial}
                  onChange={(e) => setTypedInitial(e.target.value)}
                  placeholder="Initials"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none text-gray-800 focus:border-[#012269] text-center"
                />
              </div>
            </div>

            <div className="border border-gray-150 rounded-2xl overflow-y-auto max-h-52 bg-gray-50 p-2 divide-y divide-gray-100">
              {fontFamilies.map((fam, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedFontIndex(idx)}
                  className={`flex items-center justify-between p-3.5 cursor-pointer rounded-xl transition-all ${selectedFontIndex === idx ? 'bg-white shadow-sm border border-gray-200/50' : 'hover:bg-gray-100'}`}
                >
                  <span className="text-gray-400 text-[10px] font-bold font-mono">Font Option {idx + 1}</span>
                  <div className="flex-1 flex justify-around pl-4">
                    <span className="text-2xl text-gray-800" style={{ fontFamily: fam.font, color: strokeColor }}>{typedName || 'Signature'}</span>
                    <span className="text-2xl text-gray-500 pl-4" style={{ fontFamily: fam.font, color: strokeColor }}>{typedInitial || 'S'}</span>
                  </div>
                  {selectedFontIndex === idx && (
                    <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CASE B: DRAW TAB ── */}
        {activeTab === 'draw' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

              {/* Signature drawing pad */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">Signature Pad</span>
                  <button type="button" onClick={handleClearSig} className="text-blue-500 hover:text-blue-700 font-semibold">Clear</button>
                </div>
                <div className="border border-dashed border-gray-300 rounded-2xl overflow-hidden bg-gray-50 h-36 relative">
                  <canvas
                    ref={sigCanvasRef}
                    style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
                    onMouseDown={startSigDraw}
                    onMouseMove={sigDraw}
                    onMouseUp={stopSigDraw}
                    onMouseLeave={stopSigDraw}
                    onTouchStart={startSigDraw}
                    onTouchMove={sigDraw}
                    onTouchEnd={stopSigDraw}
                  />
                </div>
              </div>

              {/* Initial drawing pad */}
              <div className="sm:col-span-1 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">Initial Pad</span>
                  <button type="button" onClick={handleClearInit} className="text-blue-500 hover:text-blue-700 font-semibold">Clear</button>
                </div>
                <div className="border border-dashed border-gray-300 rounded-2xl overflow-hidden bg-gray-50 h-36 relative">
                  <canvas
                    ref={initCanvasRef}
                    style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
                    onMouseDown={startInitDraw}
                    onMouseMove={initDraw}
                    onMouseUp={stopInitDraw}
                    onMouseLeave={stopInitDraw}
                    onTouchStart={startInitDraw}
                    onTouchMove={initDraw}
                    onTouchEnd={stopInitDraw}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── CASE C: UPLOAD TAB ── */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {uploadedBase64 ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadedBase64} alt="Signature Upload Preview" className="max-h-24 mx-auto object-contain border rounded p-1 bg-white" />
                  <p className="text-xs text-green-600 font-bold">{uploadedFileName}</p>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-gray-400">
                  <span className="block font-semibold text-gray-600">Drag &amp; Drop image or click to browse</span>
                  <span className="block text-[10px]">Accepts PNG, JPG, JPEG signature scan images</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ink Colors selection & Autofill checkbox (Bottom panel options) */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">

            {/* Color circles */}
            {activeTab !== 'upload' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Ink Color</span>
                {[
                  { hex: '#000000', label: 'Black' },
                  { hex: '#012269', label: 'Blue' },
                  { hex: '#E40229', label: 'Red' }
                ].map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setStrokeColor(c.hex)}
                    className="w-6 h-6 rounded-full border-2 transition-all shrink-0"
                    style={{
                      backgroundColor: c.hex,
                      borderColor: strokeColor === c.hex ? 'rgba(0,0,0,0.40)' : 'transparent',
                      transform: strokeColor === c.hex ? 'scale(1.15)' : 'scale(1)'
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 bg-white text-[#012269] focus:ring-0 w-4 h-4"
              />
              <span>Fills the signature in all places</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 border rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={activeTab === 'draw' ? !sigHasStrokes : activeTab === 'upload' ? !uploadedBase64 : !typedName.trim()}
              onClick={handleConfirmSignature}
              className="px-6 py-2.5 bg-[#012269] hover:bg-[#012269]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all"
            >
              Ok
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
export default function SignPage() {
  const params = useParams()
  const token = typeof params.token === 'string' ? params.token : ''

  const [pageState, setPageState] = useState<PageState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [requestData, setRequestData] = useState<RequestData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  // Signature captured states
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('')
  const [isSigModalOpen, setIsSigModalOpen] = useState(false)

  // Electronic Record and Signature Disclosure — confirmed at the end, next to the
  // final submit button, rather than gating access to the document up front.
  const [disclosureAccepted, setDisclosureAccepted] = useState(false)

  // PDFJS rendering states
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false)
  const [pdfDocInstance, setPdfDocInstance] = useState<PdfDocument | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [renderedPages, setRenderedPages] = useState<Record<number, boolean>>({})
  const [canvasDimensions, setCanvasDimensions] = useState<Record<number, { width: number; height: number }>>({})
  const [zoomScale, setZoomScale] = useState(1.2)

  // Interactive dynamic fields tracking (initialized from request.fields)
  const [signFields, setSignFields] = useState<SignField[]>([])

  // Guided field-by-field navigation
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Show inline error helper
  const showToastError = useCallback((msg: string) => {
    setErrorMsg(msg)
    setPageState('error')
  }, [])

  // Injection of PDFJS client reader
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
      console.error('PDF.js injection failed:', err)
      showToastError('Failed to initialize document viewer.')
    }
  }, [showToastError])

  const loadRequest = useCallback(async () => {
    try {
      setPageState('loading')
      const res = await getSignatureRequestByTokenAction(token)

      if (!res.success) {
        showToastError(res.error || 'Unable to load signature request.')
        return
      }

      const data: RequestData = {
        requestId: res.requestId as string,
        signerName: res.signerName as string,
        signerEmail: res.signerEmail as string,
        status: res.status as string,
        documentName: res.documentName as string,
        documentPath: res.documentPath as string,
        documentBucket: res.documentBucket as string,
        expiresAt: (res.expiresAt as string | null) ?? null,
        isExpired: res.isExpired as boolean,
        signedAt: (res.signedAt as string | null) ?? null,
        fields: (res.fields ?? []) as SignField[],
      }
      setRequestData(data)

      // Initialize local signable fields list
      setSignFields(data.fields)

      // Expiry & status checks
      if (data.isExpired) {
        setPageState('expired')
        return
      }
      if (data.status === 'signed') {
        setPageState('already_signed')
        return
      }
      if (data.status === 'declined') {
        setPageState('declined')
        return
      }

      // Generate signed file URL
      const urlRes = await getSignedUrlAction({
        bucket: data.documentBucket,
        path: data.documentPath,
        expiresIn: 3600,
      })
      if (urlRes.success) {
        setPdfUrl(urlRes.signedUrl)
      } else {
        throw new Error(urlRes.error || 'Unable to load PDF source.')
      }

      setPageState('ready')
    } catch (e: unknown) {
      showToastError(e instanceof Error ? e.message : 'An unexpected error occurred.')
    }
  }, [token, showToastError])

  // Load signature token request metadata
  useEffect(() => {
    if (!token) {
      Promise.resolve().then(() => {
        showToastError('Invalid or missing signature link.')
      })
      return
    }
    Promise.resolve().then(() => {
      loadRequest()
      injectPdfjs()
    })
  }, [token, loadRequest, injectPdfjs, showToastError])

  // Render individual page canvas helper
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({})

  const renderPdfPage = useCallback(async (pageNum: number) => {
    if (!pdfjsLoaded || !pdfUrl || !canvasRefs.current[pageNum]) return

    try {
      const pdfjsLib = window.pdfjsLib
      if (!pdfjsLib) return
      let pdf = pdfDocInstance

      if (!pdf) {
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const loadedPdf = await loadingTask.promise
        setPdfDocInstance(loadedPdf)
        setTotalPages(loadedPdf.numPages)
        pdf = loadedPdf
      }

      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: zoomScale })
      const canvas = canvasRefs.current[pageNum]
      if (canvas) {
        const context = canvas.getContext('2d')
        if (context) {
          canvas.height = viewport.height
          canvas.width = viewport.width

          setCanvasDimensions(prev => ({
            ...prev,
            [pageNum]: { width: viewport.width, height: viewport.height }
          }))

          const renderContext: PdfRenderContext = {
            canvasContext: context,
            viewport,
          }
          await page.render(renderContext).promise
          setRenderedPages(prev => ({ ...prev, [pageNum]: true }))
        }
      }
    } catch (e: unknown) {
      console.error(`Page ${pageNum} render error:`, e)
    }
  }, [pdfjsLoaded, pdfUrl, pdfDocInstance, zoomScale])

  // Trigger page render when canvas element mounts
  const handleRefSetup = (pageNum: number, el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current[pageNum] = el
      if (!renderedPages[pageNum]) {
        renderPdfPage(pageNum)
      }
    }
  }

  // Re-render every already-mounted page whenever zoom changes
  useEffect(() => {
    if (!pdfjsLoaded || !pdfUrl) return
    Object.keys(canvasRefs.current).forEach(key => {
      const pageNum = Number(key)
      if (canvasRefs.current[pageNum]) renderPdfPage(pageNum)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomScale])

  // Update dynamic input field value
  const handleUpdateFieldValue = (id: string, val: string | boolean) => {
    setSignFields(prev =>
      prev.map(f => (f.id === id ? { ...f, value: val } : f))
    )
  }

  // ── Guided field-by-field navigation ──────────────────────────────────────
  // Every required field in reading order (page, then top-to-bottom, then left-to-right)
  const orderedRequiredFields = signFields
    .filter(f => REQUIRED_FIELD_TYPES.includes(f.type))
    .sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x)
  const remainingFieldsCount = orderedRequiredFields.filter(f => !isFieldFilled(f)).length

  const goToField = useCallback((fieldId: string) => {
    setActiveFieldId(fieldId)
    const wrapperEl = fieldRefs.current[fieldId]
    if (wrapperEl) {
      wrapperEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const inputEl = inputRefs.current[fieldId]
    if (inputEl) {
      setTimeout(() => inputEl.focus(), 300) // wait for the smooth scroll to settle
    }
  }, [])

  const goToNextField = useCallback(() => {
    const list = orderedRequiredFields
    if (list.length === 0) return
    const currentIdx = list.findIndex(f => f.id === activeFieldId)
    // Prefer the next *unfilled* field so the signer is guided straight to what's left
    for (let step = 1; step <= list.length; step++) {
      const idx = (currentIdx + step) % list.length
      if (!isFieldFilled(list[idx])) { goToField(list[idx].id); return }
    }
    // Everything is filled — just step forward in sequence
    goToField(list[(currentIdx + 1) % list.length].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFieldId, signFields, goToField])

  const goToPrevField = useCallback(() => {
    const list = orderedRequiredFields
    if (list.length === 0) return
    const currentIdx = list.findIndex(f => f.id === activeFieldId)
    const idx = currentIdx <= 0 ? list.length - 1 : currentIdx - 1
    goToField(list[idx].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFieldId, signFields, goToField])

  // Jump to the first unfilled required field once the document's fields have
  // actually mounted. The real work happens in a setTimeout (not synchronously),
  // so calling this from an effect below doesn't trip the setState-in-effect rule.
  const jumpToFirstUnfilledField = useCallback(() => {
    setTimeout(() => {
      const firstUnfilled = orderedRequiredFields.find(f => !isFieldFilled(f))
      if (firstUnfilled) goToField(firstUnfilled.id)
    }, 80)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signFields, goToField])

  // Auto-jump once, the first time the document's first page has rendered.
  const hasAutoJumpedRef = useRef(false)
  useEffect(() => {
    if (!hasAutoJumpedRef.current && renderedPages[1] && orderedRequiredFields.length > 0) {
      hasAutoJumpedRef.current = true
      jumpToFirstUnfilledField()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderedPages])

  // Apply signature to elements
  const handleConfirmSignature = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl)
    // Update all signature/initial widgets with the captured signature URL
    setSignFields(prev =>
      prev.map(f => {
        if (f.type === 'signature' || f.type === 'initial') {
          return { ...f, value: dataUrl }
        }
        return f
      })
    )
  }

  // Submit client signature
  const handleSubmitSignature = async () => {
    if (!requestData || !pdfUrl) return

    // 1. Check if signature was drawn
    if (!signatureDataUrl) {
      alert('Please sign the document before submitting.')
      return
    }

    // 2. Check if required custom fields are filled
    const missingFields = signFields.filter(f => {
      if (f.type === 'checkbox') return false // Checkboxes are optional / true/false
      if (f.type === 'signature' || f.type === 'initial') return false // Handled above
      if (f.type === 'full_name' || f.type === 'first_name' || f.type === 'last_name' || f.type === 'sign_date' || f.type === 'email') {
        // If edited and explicitly cleared (empty string), flag as missing
        return f.value === '';
      }
      return !f.value || !String(f.value).trim() // User texts are required
    })

    if (missingFields.length > 0) {
      alert('Please fill out all highlight text boxes in the document before submitting.')
      return
    }

    if (!disclosureAccepted) {
      alert('Please accept the Electronic Record and Signature Disclosure before submitting.')
      return
    }

    try {
      setPageState('submitting')

      const res = await updateSignatureStatusAction({
        request_id: requestData.requestId,
        status: 'signed',
        signature_image_base64: signatureDataUrl,
        fields: signFields, // Pass filled coordinates values list
      })

      if (res.success) {
        setPageState('success')
      } else {
        throw new Error(res.error || 'Signing failed. Please try again.')
      }
    } catch (e: unknown) {
      showToastError(e instanceof Error ? e.message : 'Signing submit encountered a critical error.')
    }
  }

  // Decline signature workflow
  async function handleDecline() {
    if (!requestData) return
    if (!confirm('Are you sure you want to decline this signature request?')) return

    try {
      setPageState('submitting')
      await updateSignatureStatusAction({
        request_id: requestData.requestId,
        status: 'declined',
      })
      setPageState('declined')
    } catch (e: unknown) {
      showToastError(e instanceof Error ? e.message : 'Decline request failed.')
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // UI Panels
  // ─────────────────────────────────────────────────────────────────

  const brandHeader = (
    <header className="flex items-center justify-center gap-3 py-4 px-4 text-center sm:text-left">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center shadow-sm shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logobgwhite.jpg"
          alt="Migration Republic Logo"
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <p className="text-xs sm:text-sm font-black text-[#012269] uppercase tracking-widest leading-none">
          Migration Republic
        </p>
        <p className="text-[9px] text-gray-500 leading-tight mt-1">
          Secure Document Signing Portal
        </p>
      </div>
    </header>
  )

  const brandHeaderDark = (
    <header className="flex items-center gap-2.5 py-1.5">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/20 bg-white flex items-center justify-center shadow-sm shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logobgwhite.jpg"
          alt="Migration Republic Logo"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] sm:text-sm font-black text-white uppercase tracking-widest leading-none truncate">
          Migration Republic
        </p>
        <p className="text-[8px] sm:text-[9px] text-gray-300 leading-tight mt-1 hidden sm:block">
          Secure Document Signing Portal
        </p>
      </div>
    </header>
  )

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        {brandHeader}
        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="w-14 h-14 rounded-full border-4 border-[#012269]/20 border-t-[#012269] animate-spin" />
          <p className="text-gray-500 text-sm font-semibold">Loading your document…</p>
        </div>
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        {brandHeader}
        <div className="max-w-md w-full bg-white border border-red-200 rounded-3xl p-8 text-center shadow-xl mt-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
            <XCircle className="w-9 h-9 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-[#012269] mb-2">Portal Error</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{errorMsg}</p>
          <p className="text-gray-500 text-xs mt-4">Please contact Migration Republic support if you believe this link is valid.</p>
        </div>
      </div>
    )
  }

  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        {brandHeader}
        <div className="max-w-md w-full bg-white border border-yellow-200 rounded-3xl p-8 text-center shadow-xl mt-4">
          <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-200">
            <Clock className="w-9 h-9 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-[#012269] mb-2">Signing Link Expired</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            This signature link expired on {requestData?.expiresAt ? new Date(requestData.expiresAt).toLocaleDateString('en-AU', { dateStyle: 'long' }) : 'a previous date'}.
          </p>
          <p className="text-gray-500 text-xs mt-4">Please request Migration Republic to send a fresh invitation link.</p>
        </div>
      </div>
    )
  }

  if (pageState === 'already_signed') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        {brandHeader}
        <div className="max-w-md w-full bg-white border border-green-200 rounded-3xl p-8 text-center shadow-xl mt-4">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-200">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#012269] mb-2">Document Signed</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Thank you. This document was successfully signed by <strong className="text-gray-900">{requestData?.signerName}</strong> on{' '}
            {requestData?.signedAt ? new Date(requestData.signedAt).toLocaleString('en-AU') : 'a previous date'}.
          </p>
          <p className="text-gray-500 text-xs mt-4">A copy of the finalized PDF was sent to {requestData?.signerEmail}.</p>
        </div>
      </div>
    )
  }

  if (pageState === 'declined') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        {brandHeader}
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-xl mt-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
            <XCircle className="w-9 h-9 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-[#012269] mb-2">Workflow Declined</h2>
          <p className="text-gray-600 text-sm">You declined to sign this document. We have recorded your choice and informed the agent.</p>
        </div>
      </div>
    )
  }

  if (pageState === 'submitting') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        {brandHeader}
        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="w-16 h-16 rounded-full border-4 border-[#012269]/20 border-t-[#012269] animate-spin" />
          <p className="text-gray-600 text-sm font-semibold">Embedding signature &amp; compiling final PDF…</p>
          <p className="text-gray-500 text-xs">Please do not close this window.</p>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        {brandHeader}
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-xl mt-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-200">
            <CheckCircle2 className="w-11 h-11 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#012269] mb-3">Signature Confirmed!</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Thank you, <strong className="text-gray-900">{requestData?.signerName}</strong>. Your signature has been successfully applied to the document.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            A copy of the completed document <strong>&quot;{requestData?.documentName}&quot;</strong> has been emailed to you and sent to our registered migration agent for verification and visa processing.
          </p>
        </div>
      </div>
    )
  }

  // ─── READY / MAIN SIGNING SCREEN ──────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-gray-800">

      {/* Signing toolbar — fields remaining, zoom, download/print, decline/submit.
          The document and fields are interactive right away; the disclosure is
          just a checkbox confirmed later, next to the final submit button. */}
      <div className="shrink-0 bg-[#012269] border-b-2 border-[#e40229] sticky top-0 z-30 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 py-1.5 flex-wrap">
          {brandHeaderDark}

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {/* Fields remaining badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 text-white text-[11px] font-bold">
              <ListChecks className="w-3.5 h-3.5 text-emerald-300" />
              Fields remaining: <span className="text-emerald-300">{remainingFieldsCount}</span>
            </span>

            {/* Zoom controls */}
            <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-lg px-1">
              <button
                type="button"
                onClick={() => setZoomScale(z => Math.max(0.6, parseFloat((z - 0.1).toFixed(2))))}
                className="p-1.5 text-white/70 hover:text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(z => Math.min(2.2, parseFloat((z + 0.1).toFixed(2))))}
                className="p-1.5 text-white/70 hover:text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download / Print */}
            <a
              href={pdfUrl || undefined}
              download
              className="hidden sm:flex p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Download original document"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:flex p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Print"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleDecline}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 border border-white/20 text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
            >
              <span className="sm:hidden">Decline</span>
              <span className="hidden sm:inline">Decline Sign</span>
            </button>
            <button
              onClick={handleSubmitSignature}
              className="px-3 sm:px-5 py-1.5 sm:py-2 bg-[#e40229] hover:bg-[#e40229]/90 text-white text-[10px] sm:text-xs font-black rounded-xl uppercase tracking-wider shadow-lg shadow-[#e40229]/15 transition-all whitespace-nowrap"
            >
              Finish
            </button>
          </div>
        </div>
      </div>

      {/* Main portal grid split */}
      <div className="flex-grow max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:overflow-hidden">

        {/* Left Side: Document Viewer (Vertical scroll of canvases) */}
        <div className="lg:col-span-3 lg:overflow-y-auto space-y-6 lg:max-h-[calc(100vh-160px)] lg:pr-2 select-none relative bg-gray-100 p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-inner">
          {!pdfjsLoaded || !pdfUrl ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#012269] mb-3" />
              <p className="text-gray-500 text-sm">Rendering document pages…</p>
            </div>
          ) : (
            Array.from({ length: totalPages || 1 }).map((_, idx) => {
              const pNum = idx + 1
              const pageFields = signFields.filter(f => f.page === pNum)

              return (
                <div
                  key={pNum}
                  className="relative mx-auto bg-white border border-gray-300 shadow-xl"
                  style={{
                    width: canvasDimensions[pNum] ? `${canvasDimensions[pNum].width}px` : 'auto',
                    height: canvasDimensions[pNum] ? `${canvasDimensions[pNum].height}px` : 'auto',
                    maxWidth: '100%',
                  }}
                >
                  <canvas
                    ref={(el) => handleRefSetup(pNum, el)}
                    className="block max-w-full h-auto bg-white"
                  />

                  {/* Render overlays for this page */}
                  {renderedPages[pNum] && pageFields.map(field => {
                    const hasValue = !!field.value
                    const type = field.type.toLowerCase()
                    const filled = isFieldFilled(field)
                    const isActive = activeFieldId === field.id
                    const isTextLike = ['text', 'sign_date', 'first_name', 'last_name', 'full_name', 'email'].includes(type)

                    // Single-line fields should never grow taller than a form line,
                    // even if the admin's saved box is oversized — otherwise the
                    // input balloons over the printed row underneath it.
                    const isSingleLine = isTextLike

                    return (
                      <div
                        key={field.id}
                        ref={(el) => { fieldRefs.current[field.id] = el }}
                        style={{
                          position: 'absolute',
                          left: `${field.x}%`,
                          top: `${field.y}%`,
                          width: `${field.w}%`,
                          height: `${field.h}%`,
                          // Native <input type="date"> refuses to shrink its own
                          // segments/icon below ~90px and just clips the value
                          // instead — this is the one field type that needs a
                          // hard floor to stay legible; everything else should
                          // render at exactly the size the admin placed it.
                          minWidth: type === 'sign_date' ? '92px' : undefined,
                          maxHeight: isSingleLine ? '30px' : undefined,
                          zIndex: isActive ? 20 : undefined,
                        }}
                        className="group select-none"
                      >
                        {/* 1. SIGNATURE OR INITIAL OVERLAY */}
                        {(type === 'signature' || type === 'initial') && (
                          <div
                            onClick={() => { setActiveFieldId(field.id); setIsSigModalOpen(true) }}
                            className={`
                              w-full h-full border-2 border-dashed flex flex-col items-center justify-center rounded cursor-pointer transition-all
                              ${hasValue
                                ? 'border-green-400 bg-green-500/5'
                                : 'border-blue-500 bg-blue-500/5 hover:bg-blue-500/10'
                              }
                            `}
                          >
                            {hasValue ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={field.value as string}
                                alt="Signature"
                                className="max-w-full max-h-full object-contain pointer-events-none"
                              />
                            ) : (
                              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                                <PenLine className="w-3.5 h-3.5" /> Sign Here
                              </span>
                            )}
                          </div>
                        )}

                        {/* 2. TEXT BOX WIDGET */}
                        {type === 'text' && (
                          <input
                            ref={(el) => { inputRefs.current[field.id] = el }}
                            type="text"
                            required
                            value={field.value as string || ''}
                            onChange={(e) => handleUpdateFieldValue(field.id, e.target.value)}
                            onFocus={() => setActiveFieldId(field.id)}
                            placeholder={field.label || 'Type text'}
                            className={overlayFieldClass(filled)}
                          />
                        )}

                        {/* 3. CHECKBOX WIDGET */}
                        {type === 'checkbox' && (
                          <div className="w-full h-full flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={field.value === true || field.value === 'true'}
                              onChange={(e) => handleUpdateFieldValue(field.id, e.target.checked)}
                              className="w-full h-full max-w-4 max-h-4 accent-blue-600 cursor-pointer"
                            />
                          </div>
                        )}

                        {/* 4. PREFILLED FIELDS (DATE/NAME/EMAIL) */}
                        {type === 'sign_date' && (() => {
                          const currentDdmmyyyy = field.value !== null ? (field.value as string) : new Date().toLocaleDateString('en-AU')
                          return (
                            <input
                              ref={(el) => { inputRefs.current[field.id] = el }}
                              type="date"
                              required
                              value={ddmmyyyyToIso(currentDdmmyyyy)}
                              onChange={(e) => handleUpdateFieldValue(field.id, isoToDdmmyyyy(e.target.value))}
                              onFocus={() => setActiveFieldId(field.id)}
                              className={`${overlayFieldClass(filled)} text-[11px] leading-none`}
                            />
                          )
                        })()}

                        {type === 'full_name' && (
                          <input
                            ref={(el) => { inputRefs.current[field.id] = el }}
                            type="text"
                            required
                            value={field.value !== null ? (field.value as string) : (requestData?.signerName || '')}
                            onChange={(e) => handleUpdateFieldValue(field.id, e.target.value)}
                            onFocus={() => setActiveFieldId(field.id)}
                            placeholder="Full Name"
                            className={overlayFieldClass(filled)}
                          />
                        )}

                        {(type === 'first_name' || type === 'last_name') && (() => {
                          const nameParts = (requestData?.signerName || '').trim().split(/\s+/).filter(Boolean)
                          const defaultValue = type === 'first_name'
                            ? (nameParts[0] || '')
                            : (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '')

                          return (
                            <input
                              ref={(el) => { inputRefs.current[field.id] = el }}
                              type="text"
                              required
                              value={field.value !== null ? (field.value as string) : defaultValue}
                              onChange={(e) => handleUpdateFieldValue(field.id, e.target.value)}
                              onFocus={() => setActiveFieldId(field.id)}
                              placeholder={type === 'first_name' ? 'First Name' : 'Last Name'}
                              className={overlayFieldClass(filled)}
                            />
                          )
                        })()}

                        {type === 'email' && (
                          <input
                            ref={(el) => { inputRefs.current[field.id] = el }}
                            type="email"
                            required
                            value={field.value !== null ? (field.value as string) : (requestData?.signerEmail || '')}
                            onChange={(e) => handleUpdateFieldValue(field.id, e.target.value)}
                            onFocus={() => setActiveFieldId(field.id)}
                            placeholder="Email"
                            className={overlayFieldClass(filled)}
                          />
                        )}

                        {/* Guided-fill callout — points at the field the signer is currently on */}
                        {isActive && REQUIRED_FIELD_TYPES.includes(field.type) && (
                          <div className="absolute top-full left-0 mt-1.5 z-40 bg-emerald-50 border border-emerald-300 rounded-lg shadow-lg px-3 py-2 text-[11px] text-emerald-900 whitespace-nowrap flex items-center gap-3">
                            <span className="font-semibold">{fieldPromptText(field.type)}</span>
                            <div className="flex items-center gap-2 text-emerald-700 font-bold">
                              <button type="button" onClick={goToPrevField} className="hover:underline">Previous</button>
                              <button type="button" onClick={goToNextField} className="hover:underline">Next</button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveFieldId(null)}
                              className="text-emerald-500 hover:text-emerald-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Right Side: Signer Checklist, Details & Legal Approval */}
        <div className="lg:col-span-1 flex flex-col gap-5 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:pr-1">

          {/* Doc Banner */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#012269]/10 rounded-xl flex items-center justify-center border border-[#012269]/20 shrink-0">
                <FileText className="w-5.5 h-5.5 text-[#012269]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Document name</p>
                <h2 className="text-sm font-bold text-[#012269] leading-tight truncate">{requestData?.documentName}</h2>
                <p className="text-[10px] text-gray-500 mt-1">Pending your signature</p>
              </div>
            </div>
          </div>

          {/* Form Widgets Status */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-extrabold text-[#012269] uppercase tracking-widest mb-3 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#012269]" /> Completion Status
            </h3>

            <div className="space-y-3.5">
              {/* Signature captured checklist item */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Drawn Signature:</span>
                {signatureDataUrl ? (
                  <span className="text-green-600 font-bold flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Captured
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" /> Required
                  </span>
                )}
              </div>

              {/* Text box variables status */}
              {signFields.filter(f => f.type === 'text').map((field, idx) => (
                <div key={field.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate max-w-[50%]">{field.label || `Text box #${idx + 1}`}:</span>
                  {field.value && String(field.value).trim() ? (
                    <span className="text-green-600 font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Filled
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" /> Required
                    </span>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setIsSigModalOpen(true)}
                className="w-full py-2 border border-[#012269]/30 bg-[#012269]/5 hover:bg-[#012269]/10 text-[#012269] text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
              >
                {signatureDataUrl ? 'Change Signature' : 'Draw Signature'}
              </button>
            </div>
          </div>

          {/* Legal and Terms Approval — checked here at the end, right before submitting */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-[#012269] uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#e40229]" /> Dynamic Consent
            </h3>

            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={disclosureAccepted}
                onChange={e => setDisclosureAccepted(e.target.checked)}
                className="mt-0.5 w-4.5 h-4.5 rounded border-gray-300 bg-white text-[#e40229] accent-[#e40229] cursor-pointer"
              />
              <span className="text-[10px] text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                I, <strong className="text-gray-900">{requestData?.signerName}</strong>, confirm that I have read and understood the{' '}
                <strong className="text-[#012269]">Electronic Record and Signature Disclosure</strong>, have reviewed the document, and agree that my placed signatures constitute a legally binding electronic execution.
              </span>
            </label>

            <button
              onClick={handleSubmitSignature}
              className="w-full py-3.5 bg-[#e40229] hover:bg-[#e40229]/90 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg shadow-[#e40229]/15 transition-all"
            >
              Sign &amp; Finalize Document
            </button>
          </div>

        </div>

      </div>

      {/* Signature pad popup modal */}
      <SignatureModal
        key={requestData?.signerName || 'modal'}
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onConfirm={handleConfirmSignature}
        defaultSignerName={requestData?.signerName}
      />

    </div>
  )
}
