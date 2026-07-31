import { useEffect, useState } from "react"
import { AlertTriangleIcon, CheckCircle2Icon, Clock3Icon, Loader2Icon } from "lucide-react"
import { listarExtracoes, type ExtracaoHistorico, type ReviewStatus } from "../api"

const ROTULOS: Record<ReviewStatus, string> = {
  APROVADO_SEM_CORRECOES: "Aprovado",
  APROVADO_COM_CORRECOES: "Aprovado com correções",
  REPROVADO: "Reprovado",
  NAO_AVALIADO: "Não avaliado",
}

export function HistoryPage() {
  const [itens, setItens] = useState<ExtracaoHistorico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    listarExtracoes()
      .then(setItens)
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return <div className="grid min-h-60 place-items-center text-sm text-slate-500"><Loader2Icon className="mr-2 inline size-4 animate-spin" />Carregando histórico…</div>
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Histórico de extrações</h2>
        <p className="mt-1 text-sm text-slate-500">Execuções e avaliações persistidas no banco.</p>
      </div>
      {erro && <p className="mb-4 text-sm text-red-700">{erro}</p>}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-[11px] uppercase tracking-[.08em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Empresa / layout</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Avaliação</th>
                <th className="px-4 py-3">Enviado por</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {itens.map((item) => (
                <tr key={item.id} className="text-slate-700 hover:bg-slate-50/70">
                  <td className="max-w-64 px-4 py-3">
                    <div className="truncate font-medium text-slate-900" title={item.filename}>{item.filename}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">{item.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{item.company ?? "—"}</div>
                    <div className="text-xs text-slate-500">{item.layout ?? "layout pendente"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusExecucao item={item} />
                    <div className="mt-1 text-xs text-slate-500">{item.total_ghes ?? 0} GHEs</div>
                  </td>
                  <td className="px-4 py-3">
                    {item.review ? (
                      <>
                        <div className="font-medium text-slate-800">{ROTULOS[item.review.status]}</div>
                        <div className="text-xs text-slate-500">por {item.review.reviewed_by}</div>
                      </>
                    ) : <span className="text-slate-400">Pendente</span>}
                  </td>
                  <td className="px-4 py-3">{item.uploaded_by}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Nenhuma extração persistida ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusExecucao({ item }: { item: ExtracaoHistorico }) {
  if (item.status !== "concluido") return <span className="inline-flex items-center gap-1 text-slate-600"><Clock3Icon className="size-4" />{item.status}</span>
  if (item.validation_ok) return <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2Icon className="size-4" />Validado</span>
  return <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangleIcon className="size-4" />Revisar</span>
}
