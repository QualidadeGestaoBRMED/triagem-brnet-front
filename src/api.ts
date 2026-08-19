export type Risco = { nome: string; grupo: string }

/** Foco de um GHE no documento. Duas formas, conforme a origem:
 *  - PDF: banda vertical da página (pontos PDF)
 *  - planilha: faixa de linhas da aba (a Foresea não tem página nem coordenada) */
export type FocoPdf = {
  pagina: number
  top: number
  bottom: number
  funcao?: {
    pagina: number
    top: number
    bottom: number
    left: number
    right: number
  }
}

export type FocoPlanilha = {
  aba: string
  linha_inicial: number
  linha_final: number
}

export type FocoDocumento = FocoPdf | FocoPlanilha

export function ehFocoPlanilha(f: FocoDocumento | null): f is FocoPlanilha {
  return f !== null && "aba" in f
}

export type Planilha = {
  aba: string
  linhas: string[][]
  mesclas: Array<{ linha: number; linha_fim: number; col: number; col_fim: number }>
  /** a prévia foi cortada por limite de linhas/colunas */
  truncada?: boolean
}

export async function carregarPlanilha(jobId: string): Promise<Planilha> {
  const resp = await fetch(`/api/planilha/${encodeURIComponent(jobId)}`)
  if (!resp.ok) throw new Error("Não foi possível carregar a planilha.")
  return resp.json()
}

export type Exame = {
  nome: string
  admissao: boolean
  apos_adm_meses: number | null
  apos_adm: boolean
  periodico_meses: number | null
  ret_trab: boolean
  mud_riscos: boolean
  demissao: boolean
}

export type GheDetalhe = {
  codigo: string
  setor: string
  pagina: number | null
  foco: FocoDocumento | null
  cargos: string[]
  riscos: Risco[]
  exames: Exame[]
  ausencia_riscos: boolean
  avisos: string[]
  confianca: number
  fatores_confianca?: Array<{ desconto: number; descricao: string }>
  pontos_atencao: string[]
}

export type GheResumo = {
  setor: string
  riscos: number
  exames: number
  funcoes: number
}

export type Resposta = {
  job_id: string
  meta?: {
    layout?: string | null
    schema_version?: string
    engine_version?: string
    /** "pdf" | "planilha" — escolhe o visualizador da conferência */
    tipo_documento?: "pdf" | "planilha"
    /** planilha não tem segundo leitor: a validação cruzada não se aplica */
    validacao_cruzada?: boolean
  }
  resumo: {
    empresa: string
    total_ghes: number
    total_funcoes: number
    ghes: GheResumo[]
    avisos: string[]
    avisos_documento?: string[]
  }
  validacao_ok: boolean
  divergencias: string[]
  downloads: Record<string, string>
  ghes_detalhe: GheDetalhe[]
}

/** Nível visual de confiança: um GHE com QUALQUER ponto de atenção nunca é
 *  "alta" (verde), mesmo com score alto — verde significa "nada a conferir". */
export function nivelConfianca(g: GheDetalhe): "alta" | "media" | "baixa" {
  if (g.confianca < 60) return "baixa"
  if (g.confianca < 90 || g.pontos_atencao.length > 0) return "media"
  return "alta"
}

/** Rótulo do GHE para listas: quando o mesmo setor aparece em vários GHEs
 *  (layouts com 1 GHE por função), acrescenta a função para desambiguar. */
export function rotuloGhe(ghes: GheDetalhe[], i: number): string {
  const g = ghes[i]
  const repetido = ghes.some((outro, j) => j !== i && outro.setor === g.setor)
  if (!repetido) return g.setor
  // Um mesmo Setor pode vir de mais de um registro: o occupare emite um GHE
  // por função, e a Foresea divide o GHE quando só parte das funções tem
  // atividade crítica. Sem desambiguar, a conferência mostra entradas
  // idênticas e o revisor não sabe qual está abrindo.
  if (g.cargos.length === 1) return `${g.setor} — ${g.cargos[0]}`
  const qualificador = g.codigo.includes("/") ? g.codigo.split("/").slice(1).join("/") : null
  return qualificador
    ? `${g.setor} — ${qualificador}`
    : `${g.setor} — ${g.cargos.length} funções`
}

/** Sessão ausente/expirada: o App volta para a tela de login ao capturar. */
export class SessaoExpirada extends Error {
  constructor() {
    super("Sessão expirada — faça login novamente.")
  }
}

export type UsuarioSessao = {
  id: string
  usuario: string
  papel: "admin" | "revisor"
}

export type Usuario = {
  id: string
  username: string
  role: "admin" | "revisor"
  active: boolean
  created_at: string
  last_login_at: string | null
}

export type ReviewStatus =
  | "APROVADO_SEM_CORRECOES"
  | "APROVADO_COM_CORRECOES"
  | "REPROVADO"
  | "NAO_AVALIADO"

export type Review = {
  id: string
  status: ReviewStatus
  issue_categories: string[]
  import_success: boolean | null
  notes: string | null
  reviewed_by: string
  updated_at: string
  corrections: Array<{
    id: string
    entity_type: string
    entity_key: string | null
    field_name: string
    predicted_value: unknown
    corrected_value: unknown
    page: number | null
    bbox: number[] | null
    reason: string | null
  }>
}

export type ReviewInput = {
  status: ReviewStatus
  issue_categories: string[]
  import_success: boolean | null
  notes: string | null
  corrections?: Array<Record<string, unknown>>
}

export type ExtracaoHistorico = {
  id: string
  status: string
  filename: string
  size_bytes: number
  uploaded_by: string
  company: string | null
  layout: string | null
  validation_ok: boolean | null
  total_ghes: number | null
  total_functions: number | null
  created_at: string
  completed_at: string | null
  review: Review | null
}

async function lerJson(resp: Response): Promise<unknown> {
  if (resp.status === 401) throw new SessaoExpirada()
  try {
    return await resp.json()
  } catch {
    // corpo vazio/não-JSON: a requisição não chegou na API da Triagem BR NET
    // (proxy apontando para o serviço errado, API fora do ar, etc.)
    throw new Error(
      `resposta inválida do servidor (HTTP ${resp.status}). ` +
      "Verifique se a API da Triagem BR NET está no ar e se o proxy aponta para ela " +
      "(padrão: container na porta 8890)."
    )
  }
}

async function requisicaoJson<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init)
  if (resp.status === 204) return undefined as T
  const dados = (await lerJson(resp)) as { detail?: string } & T
  if (!resp.ok) throw new Error(dados.detail ?? `falha na requisição (HTTP ${resp.status})`)
  return dados
}

export async function login(usuario: string, senha: string): Promise<UsuarioSessao> {
  return requisicaoJson<UsuarioSessao>("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, senha }),
  })
}

export async function usuarioAtual(): Promise<UsuarioSessao | null> {
  const resp = await fetch("/api/me").catch(() => null)
  if (!resp?.ok) return null
  return (await resp.json()) as UsuarioSessao
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST" }).catch(() => undefined)
}

type StatusJob =
  | { status: "na_fila" | "processando" }
  | { status: "concluido"; resposta: Resposta }
  | { status: "erro"; detail: string }

const POLL_MS = 3000

export async function processarPdf(arquivo: File): Promise<Resposta> {
  const form = new FormData()
  form.append("pdf", arquivo)
  const resp = await fetch("/api/processar", { method: "POST", body: form })
  const inicio = (await lerJson(resp)) as { job_id?: string; detail?: string }
  if (!resp.ok || !inicio.job_id) {
    throw new Error(inicio.detail ?? "falha no processamento")
  }

  // o processamento roda em fila no servidor; acompanha até concluir
  for (;;) {
    await new Promise((r) => setTimeout(r, POLL_MS))
    const respStatus = await fetch(`/api/status/${encodeURIComponent(inicio.job_id)}`)
    const status = (await lerJson(respStatus)) as StatusJob & { detail?: string }
    if (!respStatus.ok) throw new Error(status.detail ?? "falha ao consultar o job")
    if (status.status === "concluido") return status.resposta
    if (status.status === "erro") throw new Error(status.detail)
  }
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return requisicaoJson<Usuario[]>("/api/users")
}

export async function criarUsuario(payload: {
  username: string
  password: string
  role: "admin" | "revisor"
}): Promise<Usuario> {
  return requisicaoJson<Usuario>("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function atualizarUsuario(
  id: string,
  payload: Partial<Pick<Usuario, "username" | "role" | "active">> & { password?: string }
): Promise<Usuario> {
  return requisicaoJson<Usuario>(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function excluirUsuario(id: string): Promise<void> {
  await requisicaoJson<void>(`/api/users/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export async function listarExtracoes(limit = 100): Promise<ExtracaoHistorico[]> {
  return requisicaoJson<ExtracaoHistorico[]>(`/api/extractions?limit=${limit}`)
}

export async function obterReview(jobId: string): Promise<Review | null> {
  return requisicaoJson<Review | null>(
    `/api/extractions/${encodeURIComponent(jobId)}/review`
  )
}

export async function salvarReview(jobId: string, payload: ReviewInput): Promise<Review> {
  return requisicaoJson<Review>(`/api/extractions/${encodeURIComponent(jobId)}/review`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, corrections: payload.corrections ?? [] }),
  })
}
