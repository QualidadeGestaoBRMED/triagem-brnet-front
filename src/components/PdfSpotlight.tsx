import { useEffect, useRef, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react"
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist"
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import type { FocoPdf } from "../api"

GlobalWorkerOptions.workerSrc = workerSrc

export function PdfSpotlight({
  url,
  pagina,
  foco,
}: {
  url: string
  pagina: number
  foco: FocoPdf | null
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderRef = useRef<RenderTask | null>(null)
  const [documento, setDocumento] = useState<PDFDocumentProxy | null>(null)
  const [largura, setLargura] = useState(0)
  const [paginaRenderizada, setPaginaRenderizada] = useState(0)
  const [paginaAtual, setPaginaAtual] = useState(pagina)
  const [escala, setEscala] = useState(1)
  const [altura, setAltura] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setLargura(Math.max(320, Math.floor(entry.contentRect.width - 32)))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelado = false
    setDocumento(null)
    setPaginaRenderizada(0)
    setPaginaAtual(pagina)
    setAltura(0)
    setErro(null)
    setCarregando(true)
    const tarefa = getDocument({ url })
    tarefa.promise
      .then((pdf) => {
        if (!cancelado) setDocumento(pdf)
      })
      .catch((error: unknown) => {
        const mensagem = error instanceof Error ? error.message : String(error)
        // React StrictMode monta, desmonta e monta o efeito novamente em dev.
        // O destroy da primeira montagem rejeita com "Loading aborted"; isso
        // é cancelamento esperado, não uma falha do documento.
        if (cancelado || /loading aborted/i.test(mensagem)) return
        console.error("Falha ao abrir PDF", { url, error })
        if (/404|missing pdf/i.test(mensagem)) {
          setErro(
            "O PDF deste processamento não foi encontrado. Processe o documento novamente."
          )
        } else {
          setErro("Não foi possível renderizar o documento. Recarregue a página e tente novamente.")
        }
        setCarregando(false)
      })
    return () => {
      cancelado = true
      void tarefa.destroy()
    }
  }, [url])

  useEffect(() => {
    setPaginaAtual(pagina)
  }, [pagina])

  useEffect(() => {
    if (!documento || !largura || !canvasRef.current) return
    let cancelado = false
    renderRef.current?.cancel()
    viewportRef.current?.scrollTo({ top: 0 })
    setCarregando(true)
    setErro(null)

    async function renderizar() {
      const numero = Math.min(Math.max(1, paginaAtual), documento!.numPages)
      const pdfPage = await documento!.getPage(numero)
      if (cancelado || !canvasRef.current) return

      const base = pdfPage.getViewport({ scale: 1 })
      const novaEscala = largura / base.width
      const viewport = pdfPage.getViewport({ scale: novaEscala })
      const canvas = canvasRef.current
      const contexto = canvas.getContext("2d")
      if (!contexto) return

      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = Math.floor(viewport.width * pixelRatio)
      canvas.height = Math.floor(viewport.height * pixelRatio)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      const tarefa = pdfPage.render({
        canvas,
        canvasContext: contexto,
        viewport,
        transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
      })
      renderRef.current = tarefa
      try {
        await tarefa.promise
      } catch (e) {
        if ((e as { name?: string }).name !== "RenderingCancelledException") throw e
        return
      }
      if (cancelado) return
      setEscala(novaEscala)
      setAltura(viewport.height)
      setPaginaRenderizada(numero)
      setCarregando(false)
    }

    renderizar().catch(() => {
      if (cancelado) return
      setErro("Não foi possível renderizar esta página.")
      setCarregando(false)
    })
    return () => {
      cancelado = true
      renderRef.current?.cancel()
    }
  }, [documento, largura, paginaAtual])

  const focoAtivo = foco && foco.pagina === paginaRenderizada
  const temFocoAtivo = Boolean(focoAtivo)
  const topo = focoAtivo ? Math.max(0, foco.top * escala) : 0
  const base = focoAtivo ? Math.min(altura, foco.bottom * escala) : 0
  const focoFuncao = focoAtivo && foco.funcao?.pagina === paginaRenderizada
    ? foco.funcao
    : null

  useEffect(() => {
    if (!focoAtivo || !viewportRef.current) return
    const destino = Math.max(0, topo - viewportRef.current.clientHeight * 0.28)
    viewportRef.current.scrollTo({ top: destino, behavior: "smooth" })
  }, [temFocoAtivo, topo, base])

  const numeroExibido = paginaRenderizada || paginaAtual

  function navegarPagina(delta: number) {
    if (!documento) return
    setPaginaAtual((atual) =>
      Math.min(documento.numPages, Math.max(1, atual + delta))
    )
  }

  return (
    <div ref={viewportRef} className="relative h-full overflow-auto bg-[#e8e9ea]">
      {erro ? (
        <div className="grid h-full place-items-center p-8 text-sm text-slate-600">{erro}</div>
      ) : (
        <div className="relative mx-auto my-4 w-fit bg-white shadow-[0_1px_5px_rgba(15,23,42,.22)]">
          <canvas
            ref={canvasRef}
            className={`block transition-opacity duration-150 ${carregando ? "opacity-0" : "opacity-100"}`}
          />
          {focoAtivo && altura > 0 && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {/* escurece o resto da página; a região do registro fica limpa */}
              <div
                className="absolute inset-x-0 top-0 bg-slate-950/58 transition-[height] duration-200"
                style={{ height: topo }}
              />
              <div
                className="absolute inset-x-0 bottom-0 bg-slate-950/58 transition-[top] duration-200"
                style={{ top: base }}
              />
              <div
                className="absolute inset-x-0 border-y border-cyan-600/80 shadow-[0_0_0_1px_rgba(255,255,255,.7)] transition-all duration-200"
                style={{ top: topo, height: Math.max(12, base - topo) }}
              />
              {focoFuncao && (
                <div
                  className="absolute rounded-sm border border-amber-500/90 bg-amber-300/55 shadow-[0_0_0_2px_rgba(255,255,255,.65)] mix-blend-multiply transition-all duration-200"
                  style={{
                    top: focoFuncao.top * escala,
                    left: focoFuncao.left * escala,
                    width: Math.max(12, (focoFuncao.right - focoFuncao.left) * escala),
                    height: Math.max(12, (focoFuncao.bottom - focoFuncao.top) * escala),
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
      {!erro && carregando && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#e8e9ea]">
          <div className="flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <Loader2Icon className="size-4 animate-spin text-primary" />
            Carregando documento…
          </div>
        </div>
      )}
      {documento && !erro && (
        <div className="sticky bottom-3 z-30 mx-auto flex w-fit items-center gap-1 rounded-md bg-slate-900/85 p-1 text-xs tabular-nums text-white shadow-lg">
          <button
            type="button"
            onClick={() => navegarPagina(-1)}
            disabled={numeroExibido <= 1 || carregando}
            className="rounded p-1 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Página anterior do PDF"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <span className="min-w-24 px-2 text-center">
            Página {numeroExibido} de {documento.numPages}
          </span>
          {foco && foco.pagina !== numeroExibido && (
            <button
              type="button"
              onClick={() => setPaginaAtual(foco.pagina)}
              className="rounded px-2 py-1 text-white/80 hover:bg-white/15 hover:text-white"
            >
              voltar ao destaque
            </button>
          )}
          <button
            type="button"
            onClick={() => navegarPagina(1)}
            disabled={numeroExibido >= documento.numPages || carregando}
            className="rounded p-1 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Próxima página do PDF"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
