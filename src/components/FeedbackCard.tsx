import { useEffect, useState } from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MessageSquareTextIcon,
} from "lucide-react"
import {
  obterReview,
  salvarReview,
  type Review,
  type ReviewInput,
  type ReviewStatus,
} from "../api"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"

const OPCOES: Array<{
  valor: ReviewStatus
  titulo: string
  descricao: string
}> = [
  {
    valor: "APROVADO_SEM_CORRECOES",
    titulo: "Resultado correto",
    descricao: "A extração pode ser usada sem ajustes.",
  },
  {
    valor: "APROVADO_COM_CORRECOES",
    titulo: "Correto após ajustes",
    descricao: "O resultado é aproveitável, mas precisou de correção.",
  },
  {
    valor: "REPROVADO",
    titulo: "Resultado incorreto",
    descricao: "A extração não deve ser usada como está.",
  },
]

const CATEGORIAS: Array<[string, string]> = [
  ["GHE", "GHE"],
  ["FUNCAO", "Função"],
  ["RISCO", "Risco"],
  ["EXAME", "Exame"],
  ["PERIODICIDADE", "Periodicidade"],
  ["NR", "NR"],
  ["DE_PARA", "De-para"],
  ["FORMATO_PLANILHA", "Formato da planilha"],
  ["OUTRO", "Outro"],
]

export function FeedbackCard({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<ReviewStatus | "">("")
  const [categorias, setCategorias] = useState<string[]>([])
  const [importou, setImportou] = useState<boolean | null>(null)
  const [notas, setNotas] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState<Review | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setCarregando(true)
    obterReview(jobId)
      .then((review) => {
        if (!review) return
        setSalvo(review)
        setStatus(review.status === "NAO_AVALIADO" ? "" : review.status)
        setCategorias(review.issue_categories)
        setImportou(review.import_success)
        setNotas(review.notes ?? "")
      })
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)))
      .finally(() => setCarregando(false))
  }, [jobId])

  function selecionarStatus(valor: ReviewStatus) {
    setStatus(valor)
    setSalvo(null)
    if (valor === "APROVADO_SEM_CORRECOES") setCategorias([])
  }

  function alternarCategoria(valor: string) {
    setCategorias((atuais) =>
      atuais.includes(valor) ? atuais.filter((x) => x !== valor) : [...atuais, valor]
    )
    setSalvo(null)
  }

  async function enviar() {
    if (!status) return
    setSalvando(true)
    setErro(null)
    const payload: ReviewInput = {
      status,
      issue_categories: status === "APROVADO_SEM_CORRECOES" ? [] : categorias,
      import_success: importou,
      notes: notas.trim() || null,
    }
    try {
      setSalvo(await salvarReview(jobId, payload))
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="rounded-lg border bg-white px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareTextIcon className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-slate-900">Como foi este resultado?</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Sua avaliação melhora a confiabilidade e forma a base de conhecimento do produto.
          </p>
        </div>
        {salvo && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2Icon className="size-4" /> Avaliação salva
          </span>
        )}
      </div>

      {carregando ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
          <Loader2Icon className="size-4 animate-spin" /> Carregando avaliação…
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-2 md:grid-cols-3">
            {OPCOES.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => selecionarStatus(opcao.valor)}
                className={cn(
                  "rounded-md border px-4 py-3 text-left transition-colors",
                  status === opcao.valor
                    ? "border-secondary bg-cyan-50/60 ring-1 ring-secondary/20"
                    : "hover:border-slate-400 hover:bg-slate-50"
                )}
              >
                <span className="block text-sm font-medium text-slate-900">{opcao.titulo}</span>
                <span className="mt-1 block text-xs leading-4 text-slate-500">{opcao.descricao}</span>
              </button>
            ))}
          </div>

          {status && status !== "APROVADO_SEM_CORRECOES" && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[.08em] text-slate-500">
                O que precisou de atenção?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIAS.map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => alternarCategoria(valor)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors",
                      categorias.includes(valor)
                        ? "border-amber-500 bg-amber-50 text-amber-900"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
          )}

          {status && (
            <div className="mt-5 grid gap-5 md:grid-cols-[280px_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.08em] text-slate-500">
                  Importou no sistema de destino?
                </p>
                <div className="mt-2 flex gap-2">
                  {([
                    [true, "Sim"],
                    [false, "Não"],
                    [null, "Ainda não testei"],
                  ] as const).map(([valor, rotulo]) => (
                    <button
                      key={rotulo}
                      type="button"
                      onClick={() => { setImportou(valor); setSalvo(null) }}
                      className={cn(
                        "rounded-md border px-3 py-2 text-xs",
                        importou === valor ? "border-secondary bg-cyan-50 text-primary" : "text-slate-600"
                      )}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[.08em] text-slate-500">
                  Conte o que aconteceu
                </span>
                <textarea
                  value={notas}
                  onChange={(e) => { setNotas(e.target.value); setSalvo(null) }}
                  rows={3}
                  maxLength={5000}
                  placeholder="Ex.: faltou um exame no GHE 04 ou a planilha foi recusada na importação."
                  className="mt-2 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-secondary"
                />
              </label>
            </div>
          )}

          {erro && (
            <p className="mt-4 flex items-center gap-2 text-sm text-red-700">
              <AlertTriangleIcon className="size-4" /> {erro}
            </p>
          )}

          {status && (
            <div className="mt-4 flex justify-end">
              <Button onClick={enviar} disabled={salvando}>
                {salvando && <Loader2Icon className="animate-spin" />}
                Salvar avaliação
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
