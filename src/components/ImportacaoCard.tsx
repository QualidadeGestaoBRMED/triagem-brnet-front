import { useState } from "react"
import { AlertTriangleIcon, Loader2Icon } from "lucide-react"
import { salvarReview, type Review } from "../api"
import { juntarNotas, notaDaAvaliacao, notaDaImportacao } from "../lib/notas"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"

const OPCOES: Array<{ valor: boolean | null; rotulo: string; descricao: string }> = [
  { valor: true, rotulo: "Importou", descricao: "O BR NET aceitou as planilhas." },
  { valor: false, rotulo: "Não importou", descricao: "O BR NET recusou ou importou errado." },
  { valor: null, rotulo: "Ainda não testei", descricao: "Volto aqui depois de importar." },
]

type Props = {
  jobId: string
  review: Review
  onSalvo: (review: Review) => void
}

export function ImportacaoCard({ jobId, review, onSalvo }: Props) {
  const [importou, setImportou] = useState<boolean | null>(review.import_success)
  const [detalhe, setDetalhe] = useState(notaDaImportacao(review.notes))
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar() {
    setSalvando(true)
    setErro(null)
    try {
      const salvo = await salvarReview(jobId, {
        status: review.status,
        issue_categories: review.issue_categories,
        import_success: importou,
        notes: juntarNotas(notaDaAvaliacao(review.notes), importou === false ? detalhe : ""),
      })
      setAlterado(false)
      onSalvo(salvo)
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <p className="text-sm text-slate-600">
        Leve as planilhas do passo 3 para o BR NET e conte aqui como foi a importação. É esta
        resposta que fecha o ciclo da extração.
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.rotulo}
            type="button"
            onClick={() => {
              setImportou(opcao.valor)
              setAlterado(true)
              setErro(null)
            }}
            className={cn(
              "cursor-pointer rounded-md border px-4 py-3 text-left transition-colors",
              importou === opcao.valor
                ? "border-secondary bg-cyan-50/60 ring-1 ring-secondary/20"
                : "hover:border-slate-400 hover:bg-slate-50"
            )}
          >
            <span className="block text-sm font-medium text-slate-900">{opcao.rotulo}</span>
            <span className="mt-1 block text-xs leading-4 text-slate-500">{opcao.descricao}</span>
          </button>
        ))}
      </div>

      {importou === false && (
        <label className="mt-5 block">
          <span className="text-xs font-semibold uppercase tracking-[.08em] text-slate-500">
            O que o BR NET recusou?
          </span>
          <textarea
            value={detalhe}
            onChange={(e) => {
              setDetalhe(e.target.value)
              setAlterado(true)
            }}
            rows={3}
            maxLength={2000}
            placeholder="Ex.: a planilha PCMSO foi recusada por exame sem periodicidade."
            className="mt-2 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-secondary"
          />
        </label>
      )}

      {erro && (
        <p className="mt-4 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangleIcon className="size-4" /> {erro}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-slate-500">
          Enquanto este resultado estiver aberto você pode voltar aqui e atualizar a resposta.
        </p>
        <Button onClick={enviar} disabled={salvando || !alterado}>
          {salvando && <Loader2Icon className="animate-spin" />}
          Registrar importação
        </Button>
      </div>
    </>
  )
}
