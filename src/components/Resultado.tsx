import { useEffect, useRef, useState } from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  DownloadIcon,
  FileJsonIcon,
  Loader2Icon,
  SearchIcon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"
import { obterReview, rotuloGhe, type Resposta, type Review } from "../api"
import { Button } from "./ui/button"
import { ConfidenceScore } from "./ConfidenceScore"
import { FeedbackCard } from "./FeedbackCard"
import { ImportacaoCard } from "./ImportacaoCard"
import { PassoCard, TrilhaPassos, type EstadoPasso } from "./FluxoPassos"

type Props = {
  dados: Resposta
  conferenciaAberta: boolean
  onConferir: () => void
  onNovo: () => void
}

const TITULOS = [
  "Conferir extração",
  "Avaliar resultado",
  "Baixar arquivos",
  "Importar no BR NET",
]

const ROTULO_AVALIACAO: Record<string, string> = {
  APROVADO_SEM_CORRECOES: "Resultado correto",
  APROVADO_COM_CORRECOES: "Correto após ajustes",
  REPROVADO: "Resultado incorreto",
}

export function Resultado({ dados, conferenciaAberta, onConferir, onNovo }: Props) {
  const r = dados.resumo
  // planilha e PDF usam visualizadores diferentes na conferência
  const planilha = dados.meta?.tipo_documento === "planilha"
  const origem = planilha ? "a planilha" : "o PDF"
  const comAtencao = dados.ghes_detalhe.filter((g) => g.pontos_atencao.length > 0).length
  const avisosDoc = r.avisos_documento ?? []
  const totalAtencao = comAtencao + avisosDoc.length
  const arquivos = Object.entries(dados.downloads)
  const planilhas = arquivos.filter(([, url]) => !url.endsWith(".json"))
  const debug = arquivos.filter(([, url]) => url.endsWith(".json"))

  const [review, setReview] = useState<Review | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [conferiu, setConferiu] = useState(false)
  const [baixou, setBaixou] = useState(false)
  const [ativo, setAtivo] = useState(1)
  const cards = useRef<Record<number, HTMLDivElement | null>>({})
  const estavaAberta = useRef(false)

  useEffect(() => {
    let vivo = true
    obterReview(dados.job_id)
      .then((salvo) => {
        if (!vivo) return
        const avaliado = salvo?.status === "NAO_AVALIADO" ? null : salvo
        setReview(avaliado)
        // execução já avaliada em outra sessão: os passos anteriores estão vencidos
        if (avaliado) {
          setConferiu(true)
          setBaixou(true)
          setAtivo(4)
        }
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [dados.job_id])

  // fechar a conferência leva direto para a avaliação, sem depender de rolagem
  useEffect(() => {
    if (conferenciaAberta) {
      setConferiu(true)
      estavaAberta.current = true
      return
    }
    if (estavaAberta.current) {
      estavaAberta.current = false
      setAtivo((atual) => (atual === 1 ? 2 : atual))
    }
  }, [conferenciaAberta])

  useEffect(() => {
    cards.current[ativo]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [ativo])

  const concluido = [conferiu, Boolean(review), baixou, review?.import_success != null]
  const bloqueado = [false, !conferiu, !review, !baixou]

  function estadoDe(numero: number): EstadoPasso {
    const i = numero - 1
    if (bloqueado[i]) return "bloqueado"
    if (concluido[i]) return "concluido"
    return numero === ativo ? "ativo" : "pendente"
  }

  function abrir(numero: number) {
    if (bloqueado[numero - 1]) return
    setAtivo((atual) => (atual === numero ? 0 : numero))
  }

  // o backend responde com Content-Disposition: attachment, então a âncora
  // baixa direto e evita a aba que pisca do window.open
  function baixar(urls: string[], avanca = true) {
    urls.forEach((url, i) => {
      window.setTimeout(() => {
        const link = document.createElement("a")
        link.href = url
        link.download = ""
        document.body.appendChild(link)
        link.click()
        link.remove()
      }, i * 400)
    })
    if (!avanca) return
    setBaixou(true)
    setAtivo(4)
  }

  function aoSalvarAvaliacao(salvo: Review) {
    setReview(salvo)
    setAtivo(3)
  }

  function aoRegistrarImportacao(salvo: Review) {
    toast.success(
      salvo.import_success == null
        ? "Avaliação salva. A importação ficou pendente nesta extração."
        : "Importação registrada. Ciclo desta extração concluído."
    )
    onNovo()
  }

  const passos = TITULOS.map((titulo, i) => ({
    numero: i + 1,
    titulo,
    estado: estadoDe(i + 1),
  }))

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 animate-in fade-in duration-300">
      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="flex items-start justify-between gap-5 px-6 py-5">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
              Processamento concluído
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{r.empresa}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Siga os quatro passos abaixo: conferir, avaliar, baixar e importar.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1 text-sm text-slate-600">
            {/* Três estados, não dois. Em planilha há um leitor só: dizer
                "Leitores concordam" com check verde afirmaria uma verificação
                que não aconteceu — o estado neutro diz o que de fato houve. */}
            {planilha ? (
              <span
                className="flex items-center gap-2"
                title="Planilha tem um leitor único: não há segundo leitor para conferir a leitura. A conferência humana é a única rede."
              >
                <InfoIcon className="size-4 text-slate-500" />
                Sem validação cruzada · leitor único
              </span>
            ) : dados.validacao_ok ? (
              <><CheckCircle2Icon className="size-4 text-emerald-700" /> Leitores concordam</>
            ) : (
              <><AlertTriangleIcon className="size-4 text-amber-700" /> Divergências encontradas</>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-3 border-y bg-slate-50/60">
          <Numero rotulo="GHEs" valor={r.total_ghes} />
          <Numero rotulo="Funções" valor={r.total_funcoes} />
          <Numero rotulo="Para revisar" valor={totalAtencao} destaque={totalAtencao > 0} />
        </dl>

        <TrilhaPassos passos={passos} ativo={ativo} onIr={abrir} />
      </section>

      {(avisosDoc.length > 0 || dados.divergencias.length > 0) && (
        <section className="rounded-lg border bg-white px-6 py-5">
          <h3 className="text-sm font-semibold text-slate-900">Ocorrências do processamento</h3>
          <div className="mt-3 divide-y border-y">
            {dados.divergencias.map((texto, i) => (
              <Ocorrencia key={`d-${i}`} texto={texto} importante />
            ))}
            {avisosDoc.map((texto, i) => <Ocorrencia key={`a-${i}`} texto={texto} />)}
          </div>
        </section>
      )}

      <div ref={(el) => { cards.current[1] = el }}>
        <PassoCard
          numero={1}
          titulo="Conferir extração"
          estado={estadoDe(1)}
          resumo={
            conferiu
              ? `${r.ghes.length} registros conferidos lado a lado com ${origem}`
              : `${r.ghes.length} registros extraídos · compare com ${origem} antes de avaliar`
          }
          aberto={ativo === 1}
          onAlternar={() => abrir(1)}
          acao={
            <Button size="sm" variant={conferiu ? "outline" : "default"} onClick={onConferir}>
              <SearchIcon /> {conferiu ? "Abrir de novo" : "Abrir conferência"}
            </Button>
          }
        >
          <p className="text-sm text-slate-600">
            A conferência abre {origem} ao lado dos dados extraídos, com {planilha
              ? "as linhas de cada registro destacadas"
              : "a região de cada registro destacada"}. Ao fechar, você segue para a avaliação.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-slate-50/70 text-left text-[11px] uppercase tracking-[.08em] text-slate-500">
                  <th className="px-3 py-2.5 font-semibold">Setor / função</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Riscos</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Exames</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Funções</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Confiança</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {r.ghes.map((g, i) => {
                  const detalhe = dados.ghes_detalhe[i]
                  return (
                    <tr key={dados.ghes_detalhe[i]?.codigo ?? i} className="text-slate-700 hover:bg-slate-50/70">
                      <td className="px-3 py-2.5 text-slate-800">{rotuloGhe(dados.ghes_detalhe, i)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{g.riscos}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{g.exames}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{g.funcoes}</td>
                      <td className="px-3 py-2.5 text-right text-xs">
                        {detalhe && <ConfidenceScore ghe={detalhe} />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </PassoCard>
      </div>

      <div ref={(el) => { cards.current[2] = el }}>
        <PassoCard
          numero={2}
          titulo="Avaliar resultado"
          estado={estadoDe(2)}
          resumo={
            review
              ? `${ROTULO_AVALIACAO[review.status] ?? review.status} · por ${review.reviewed_by}`
              : conferiu
                ? "Obrigatório para liberar os arquivos"
                : "Disponível depois de abrir a conferência"
          }
          aberto={ativo === 2}
          onAlternar={() => abrir(2)}
        >
          {carregando ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2Icon className="size-4 animate-spin" /> Carregando avaliação…
            </p>
          ) : (
            <FeedbackCard
              jobId={dados.job_id}
              review={review}
              onSalvo={aoSalvarAvaliacao}
            />
          )}
        </PassoCard>
      </div>

      <div ref={(el) => { cards.current[3] = el }}>
        <PassoCard
          numero={3}
          titulo="Baixar arquivos"
          estado={estadoDe(3)}
          resumo={
            baixou
              ? "Arquivos gerados nesta execução já baixados"
              : review
                ? "PGR e PCMSO liberados"
                : "Liberado depois da avaliação"
          }
          aberto={ativo === 3}
          onAlternar={() => abrir(3)}
        >
          <p className="text-sm text-slate-600">
            PGR e PCMSO no formato de importação do BR NET.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button onClick={() => baixar(planilhas.map(([, url]) => url))}>
              <DownloadIcon /> Baixar planilhas
            </Button>
            {debug.map(([rotulo, url]) => (
              <button
                key={url}
                type="button"
                onClick={() => baixar([url], false)}
                className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
              >
                <FileJsonIcon className="size-3.5" /> {rotulo}
              </button>
            ))}
          </div>
        </PassoCard>
      </div>

      <div ref={(el) => { cards.current[4] = el }}>
        <PassoCard
          numero={4}
          titulo="Importar no BR NET"
          estado={estadoDe(4)}
          resumo={
            review?.import_success === true
              ? "Importou sem problemas"
              : review?.import_success === false
                ? "Não importou — motivo registrado"
                : baixou
                  ? "Conte como foi a importação quando testar"
                  : "Disponível depois de baixar os arquivos"
          }
          aberto={ativo === 4}
          onAlternar={() => abrir(4)}
        >
          {review ? (
            <ImportacaoCard
              jobId={dados.job_id}
              review={review}
              onSalvo={aoRegistrarImportacao}
            />
          ) : (
            <p className="text-sm text-slate-500">Avalie o resultado primeiro.</p>
          )}
        </PassoCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2">
        <p className="text-xs text-slate-500">
          Pode sair a qualquer momento: o que já foi salvo fica no histórico.
        </p>
        <Button variant="ghost" size="sm" onClick={onNovo}>
          <UploadIcon /> Processar outro documento
        </Button>
      </div>
    </div>
  )
}

function Numero({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string
  valor: number
  destaque?: boolean
}) {
  return (
    <div className={`border-r px-6 py-4 last:border-r-0 ${destaque ? "bg-amber-50/70" : ""}`}>
      <dt className={`text-[11px] font-semibold uppercase tracking-[.1em] ${destaque ? "text-amber-800" : "text-slate-500"}`}>
        {rotulo}
      </dt>
      <dd className={`mt-1 text-2xl font-semibold tabular-nums tracking-tight ${destaque ? "text-amber-700" : "text-slate-900"}`}>
        {valor}
      </dd>
    </div>
  )
}

function Ocorrencia({ texto, importante = false }: { texto: string; importante?: boolean }) {
  return (
    <div className="flex gap-3 py-2.5 text-sm leading-5 text-slate-600">
      <AlertTriangleIcon className={`mt-0.5 size-4 shrink-0 ${importante ? "text-amber-700" : "text-slate-400"}`} />
      <span>{texto.replace(/^INFO:\s*/, "")}</span>
    </div>
  )
}
