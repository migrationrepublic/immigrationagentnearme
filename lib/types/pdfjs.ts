export interface PDFRenderTask {
  promise: Promise<void>
  cancel: () => void
}

export interface PdfViewport {
  width: number
  height: number
}

export interface PdfRenderContext {
  canvasContext: CanvasRenderingContext2D
  viewport: PdfViewport
}

export interface PdfPage {
  getViewport: (opts: { scale: number }) => PdfViewport
  render: (ctx: PdfRenderContext) => PDFRenderTask
}

export interface PdfDocument {
  numPages: number
  getPage: (num: number) => Promise<PdfPage>
}

export interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (src: string) => { promise: Promise<PdfDocument> }
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib
  }
}
