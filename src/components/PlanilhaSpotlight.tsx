import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2Icon } from "lucide-react"
import { carregarPlanilha, type FocoPlanilha, type Planilha } from "../api"

/** Visualizador de conferência para PCMSO entregue em planilha.
 *
 *  Irmão do PdfSpotlight: onde o PDF tem página e coordenada, a planilha tem
 *  aba e faixa de LINHAS. Renderiza a aba como tabela e destaca as linhas do
 *  GHE selecionado, rolando até elas — o revisor compara o extraído contra a
 *  origem sem sair da tela, como no fluxo de PDF. */
export function PlanilhaSpotlight({
  jobId,
  foco,
}: {
  jobId: string
  foco: FocoPlanilha | null
}) {
  const [planilha, setPlanilha] = useState<Planilha | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const destaqueRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    let vivo = true
    setPlanilha(null)
    setErro(null)
    carregarPlanilha(jobId)
      .then((p) => vivo && setPlanilha(p))
      .catch((e) => vivo && setErro(e instanceof Error ? e.message : "Falha ao carregar."))
    return () => {
      vivo = false
    }
  }, [jobId])

  useEffect(() => {
    destaqueRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [foco, planilha])

  // linhas mescladas verticalmente na 1ª coluna indicam onde o bloco começa
  const larguras = useMemo(() => {
    if (!planilha) return []
    const n = planilha.linhas[0]?.length ?? 0
    // a coluna do GHE é estreita; as de exames concentram o texto
    return Array.from({ length: n }, (_, i) => (i === 0 ? "8%" : undefined))
  }, [planilha])

  if (erro) {
    return (
      <div className="grid h-full place-items-center p-6 text-sm text-red-600">{erro}</div>
    )
  }
  if (!planilha) {
    return (
      <div className="grid h-full place-items-center text-sm text-slate-500">
        <span className="flex items-center gap-2">
          <Loader2Icon className="size-4 animate-spin" />
          Carregando planilha…
        </span>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="sticky top-0 z-10 border-b bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
        Aba: {planilha.aba}
        {foco && (
          <span className="ml-2 text-slate-400">
            · linhas {foco.linha_inicial}
            {foco.linha_final !== foco.linha_inicial ? `–${foco.linha_final}` : ""}
          </span>
        )}
      </div>
      <table className="w-full table-fixed border-collapse text-[11px] leading-snug">
        <colgroup>
          {larguras.map((w, i) => (
            <col key={i} style={w ? { width: w } : undefined} />
          ))}
        </colgroup>
        <tbody>
          {planilha.linhas.map((linha, i) => {
            const numero = i + 1
            const destacada =
              foco !== null &&
              numero >= foco.linha_inicial &&
              numero <= foco.linha_final
            const primeira = foco !== null && numero === foco.linha_inicial
            return (
              <tr
                key={numero}
                ref={primeira ? destaqueRef : undefined}
                className={
                  destacada
                    ? "bg-amber-100 outline outline-2 -outline-offset-2 outline-amber-400"
                    : "odd:bg-slate-50/60"
                }
              >
                <td className="w-10 select-none border-r px-1 text-right align-top text-slate-400">
                  {numero}
                </td>
                {linha.map((celula, j) => (
                  <td
                    key={j}
                    className="max-w-0 truncate border-r border-slate-200 px-1.5 py-1 align-top text-slate-700"
                    title={celula}
                  >
                    {celula.split("\n").map((parte, k) => (
                      <div key={k}>{parte}</div>
                    ))}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
