import type { ReactNode } from "react"
import {
  FileSearchIcon,
  FileStackIcon,
  HistoryIcon,
  LogOutIcon,
  UsersIcon,
} from "lucide-react"
import type { UsuarioSessao } from "../api"
import { cn } from "../lib/utils"
import marca from "../assets/marca-principal.png"

export type PaginaApp = "ingestao" | "historico" | "usuarios"

type Props = {
  titulo: string
  children: ReactNode
  pagina: PaginaApp
  usuario: UsuarioSessao
  onNavegar: (pagina: PaginaApp) => void
  onSair: () => void
}

export function AppShell({
  titulo,
  children,
  pagina,
  usuario,
  onNavegar,
  onSair,
}: Props) {
  return (
    <div className="flex min-h-svh bg-sidebar">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="ml-1 mt-5 mb-5 flex h-16 items-center px-5">
          <img src={marca} alt="BR MED" className="h-11 w-auto" />
        </div>
        <div className="px-5 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wider opacity-60">
          Menu principal
        </div>
        <nav className="flex flex-col gap-1 px-3">
          <SidebarItem ativo={pagina === "ingestao"} icone={<FileSearchIcon />} onClick={() => onNavegar("ingestao")}>
            Ingestão de PCMSO
          </SidebarItem>
          <SidebarItem desativado icone={<FileStackIcon />} onClick={() => {}}>
            Ingestão de PGR
          </SidebarItem>
          <SidebarItem ativo={pagina === "historico"} icone={<HistoryIcon />} onClick={() => onNavegar("historico")}>
            Histórico
          </SidebarItem>
          {usuario.papel === "admin" && (
            <SidebarItem ativo={pagina === "usuarios"} icone={<UsersIcon />} onClick={() => onNavegar("usuarios")}>
              Usuários
            </SidebarItem>
          )}
        </nav>
        <div className="mt-auto border-t border-white/10 px-4 py-4">
          <div className="px-2">
            <p className="truncate text-sm font-medium">{usuario.usuario}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide opacity-50">
              {usuario.papel === "admin" ? "Administrador" : "Revisor"}
            </p>
          </div>
          <button onClick={onSair} className="mt-3 flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm opacity-70 hover:bg-white/10 hover:opacity-100">
            <LogOutIcon className="size-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 bg-sidebar px-4 text-sidebar-foreground md:px-6 lg:px-8">
          <h1 className="text-lg font-semibold">{titulo}</h1>
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => onNavegar("ingestao")} className="rounded px-2 py-1 text-xs">Ingestão</button>
            <button onClick={() => onNavegar("historico")} className="rounded px-2 py-1 text-xs">Histórico</button>
            {usuario.papel === "admin" && <button onClick={() => onNavegar("usuarios")} className="rounded px-2 py-1 text-xs">Usuários</button>}
            <button onClick={onSair} aria-label="Sair"><LogOutIcon className="size-4" /></button>
          </div>
        </header>
        <div className="flex flex-1 flex-col bg-background transition-all duration-300 md:rounded-ss-3xl">
          <div className="min-h-0 flex-1 p-4 md:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

function SidebarItem({
  children,
  icone,
  ativo,
  desativado,
  onClick,
}: {
  children: ReactNode
  icone: ReactNode
  ativo?: boolean
  desativado?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativado}
      title={desativado ? "Em breve" : undefined}
      className={cn(
        "flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium",
        desativado
          ? "cursor-not-allowed opacity-35"
          : ativo
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "opacity-75 hover:bg-white/10 hover:opacity-100",
        "[&_svg]:size-4"
      )}
    >
      {icone}
      {children}
      {desativado && (
        <span className="ml-auto text-[10px] uppercase tracking-wide">em breve</span>
      )}
    </button>
  )
}
