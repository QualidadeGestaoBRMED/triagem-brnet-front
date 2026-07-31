import { useEffect, useState, type FormEvent } from "react"
import { Loader2Icon, PlusIcon, ShieldCheckIcon, UserXIcon } from "lucide-react"
import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
  type Usuario,
  type UsuarioSessao,
} from "../api"
import { Button } from "./ui/button"

export function UsersPage({ sessao }: { sessao: UsuarioSessao }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [nome, setNome] = useState("")
  const [senha, setSenha] = useState("")
  const [papel, setPapel] = useState<"admin" | "revisor">("revisor")

  async function carregar() {
    setCarregando(true)
    try {
      setUsuarios(await listarUsuarios())
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { void carregar() }, [])

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      await criarUsuario({ username: nome.trim(), password: senha, role: papel })
      setNome("")
      setSenha("")
      await carregar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err))
    } finally {
      setEnviando(false)
    }
  }

  async function alterar(id: string, payload: Parameters<typeof atualizarUsuario>[1]) {
    try {
      await atualizarUsuario(id, payload)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    }
  }

  async function remover(user: Usuario) {
    if (!window.confirm(`Desativar o usuário ${user.username}?`)) return
    try {
      await excluirUsuario(user.id)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    }
  }

  async function redefinirSenha(user: Usuario) {
    const novaSenha = window.prompt(`Nova senha para ${user.username} (mínimo 8 caracteres):`)
    if (novaSenha === null) return
    if (novaSenha.length < 8) {
      setErro("A senha deve ter ao menos 8 caracteres.")
      return
    }
    await alterar(user.id, { password: novaSenha })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Usuários</h2>
        <p className="mt-1 text-sm text-slate-500">Acessos persistidos no PostgreSQL/Neon.</p>
      </div>

      <form onSubmit={adicionar} className="mb-5 grid gap-3 rounded-lg border bg-white p-5 md:grid-cols-[1fr_1fr_160px_auto]">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do usuário" minLength={3} maxLength={80} required className="h-10 rounded-md border px-3 text-sm outline-none focus:border-secondary" />
        <input value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha inicial (mín. 8)" type="password" minLength={8} required className="h-10 rounded-md border px-3 text-sm outline-none focus:border-secondary" />
        <select value={papel} onChange={(e) => setPapel(e.target.value as "admin" | "revisor")} className="h-10 rounded-md border bg-white px-3 text-sm">
          <option value="revisor">Revisor</option>
          <option value="admin">Administrador</option>
        </select>
        <Button type="submit" disabled={enviando} className="h-10">
          {enviando ? <Loader2Icon className="animate-spin" /> : <PlusIcon />} Criar usuário
        </Button>
      </form>

      {erro && <p className="mb-4 text-sm text-red-700">{erro}</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        {carregando ? (
          <div className="grid min-h-40 place-items-center text-sm text-slate-500"><Loader2Icon className="size-4 animate-spin" /></div>
        ) : (
          <div className="divide-y">
            {usuarios.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-48 flex-1">
                  <div className="flex items-center gap-2 font-medium text-slate-900">
                    {user.username}
                    {user.id === sessao.id && <span className="text-[10px] uppercase tracking-wide text-secondary">você</span>}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {user.last_login_at ? `Último acesso ${new Date(user.last_login_at).toLocaleString("pt-BR")}` : "Nunca acessou"}
                  </div>
                </div>
                <select
                  value={user.role}
                  disabled={!user.active}
                  onChange={(e) => alterar(user.id, { role: e.target.value as "admin" | "revisor" })}
                  className="h-9 rounded-md border bg-white px-3 text-sm disabled:opacity-50"
                >
                  <option value="revisor">Revisor</option>
                  <option value="admin">Administrador</option>
                </select>
                <span className={`inline-flex min-w-20 items-center gap-1.5 text-xs font-medium ${user.active ? "text-emerald-700" : "text-slate-400"}`}>
                  {user.active ? <ShieldCheckIcon className="size-4" /> : <UserXIcon className="size-4" />}
                  {user.active ? "Ativo" : "Inativo"}
                </span>
                {user.id !== sessao.id && (
                  user.active ? (
                    <Button variant="outline" size="sm" onClick={() => remover(user)}>Desativar</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => alterar(user.id, { active: true })}>Reativar</Button>
                  )
                )}
                <Button variant="ghost" size="sm" onClick={() => redefinirSenha(user)}>Redefinir senha</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
