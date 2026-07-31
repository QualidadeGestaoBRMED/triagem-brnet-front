import { useState } from "react"
import { AlertTriangleIcon, Loader2Icon } from "lucide-react"
import { salvarReview, type Review, type ReviewInput, type ReviewStatus } from "../api"
import { juntarNotas, notaDaAvaliacao, notaDaImportacao } from "../lib/notas"
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

type Props = {
  jobId: string
  review: Review | null
  onSalvo: (review: Review) => void
}

export function FeedbackCard({ jobId, review, onSalvo }: Props) {
  const [status, setStatus] = useState<ReviewStatus | "">(review?.status ?? "")
  const [categorias, setCategorias] = useState<string[]>(review?.issue_categories ?? [])
  const [notas, setNotas] = useState(notaDaAvaliacao(review?.notes ?? null))
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function selecionarStatus(valor: ReviewStatus) {
    setStatus(valor)
    setAlterado(true)
    setErro(null)
    if (valor === "APROVADO_SEM_CORRECOES") setCategorias([])
  }

  function alternarCategoria(valor: string) {
    setCategorias((atuais) =>
      atuais.includes(valor) ? atuais.filter((x) => x !== valor) : [...atuais, valor]
    )
    setAlterado(true)
    setErro(null)
  }

  const precisaDetalhes =
    status === "APROVADO_COM_CORRECOES" || status === "REPROVADO"
  const formularioValido = Boolean(
    status &&
    (!precisaDetalhes || (categorias.length > 0 && notas.trim().length > 0))
  )

  async function enviar() {
    if (!formularioValido || !status) {
      setErro(
        precisaDetalhes
          ? "Selecione ao menos uma categoria e descreva o que aconteceu."
          : "Selecione como foi o resultado."
      )
      return
    }
    setSalvando(true)
    setErro(null)
    const payload: ReviewInput = {
      status,
      issue_categories: status === "APROVADO_SEM_CORRECOES" ? [] : categorias,
      import_success: review?.import_success ?? null,
      notes: juntarNotas(notas, notaDaImportacao(review?.notes ?? null)),
    }
    try {
      const salvo = await salvarReview(jobId, payload)
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
        Como foi o resultado desta extração? A resposta libera os arquivos e alimenta a base
        de conhecimento.
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => selecionarStatus(opcao.valor)}
            className={cn(
              "cursor-pointer rounded-md border px-4 py-3 text-left transition-colors",
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

      {precisaDetalhes && (
        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,340px)_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.08em] text-slate-500">
              O que precisou de atenção? <span className="text-red-600">*</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIAS.map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => alternarCategoria(valor)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors",
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
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[.08em] text-slate-500">
              Conte o que aconteceu <span className="text-red-600">*</span>
            </span>
            <textarea
              value={notas}
              onChange={(e) => {
                setNotas(e.target.value)
                setAlterado(true)
                setErro(null)
              }}
              rows={4}
              maxLength={5000}
              required
              placeholder="Ex.: faltou um exame no GHE 04 ou a periodicidade veio errada."
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
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-slate-500">
            {!formularioValido && precisaDetalhes
              ? "Categoria e descrição são obrigatórias para ajustes ou erros."
              : review && alterado
                ? "Alterações não salvas."
                : "Depois de salvar, os arquivos ficam liberados no passo 3."}
          </p>
          <Button onClick={enviar} disabled={salvando || !formularioValido}>
            {salvando && <Loader2Icon className="animate-spin" />}
            {review ? "Salvar alterações" : "Salvar e liberar downloads"}
          </Button>
        </div>
      )}
    </>
  )
}
