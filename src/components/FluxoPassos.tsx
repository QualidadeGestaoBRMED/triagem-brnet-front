import type { ReactNode } from "react"
import { CheckIcon, LockKeyholeIcon } from "lucide-react"
import { cn } from "../lib/utils"

export type EstadoPasso = "concluido" | "ativo" | "pendente" | "bloqueado"

export type Passo = {
  numero: number
  titulo: string
  estado: EstadoPasso
}

export function TrilhaPassos({
  passos,
  ativo,
  onIr,
}: {
  passos: Passo[]
  ativo: number
  onIr: (numero: number) => void
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto px-4 py-3">
      {passos.map((passo, i) => {
        const bloqueado = passo.estado === "bloqueado"
        const emFoco = passo.numero === ativo
        return (
          <li key={passo.numero} className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              disabled={bloqueado}
              onClick={() => onIr(passo.numero)}
              aria-current={emFoco ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                bloqueado
                  ? "cursor-not-allowed text-slate-400"
                  : "cursor-pointer hover:bg-slate-100",
                emFoco && "bg-slate-100"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums",
                  passo.estado === "concluido" && "border-secondary bg-secondary text-white",
                  passo.estado === "ativo" && "border-secondary text-secondary",
                  passo.estado === "pendente" && "border-slate-300 text-slate-500",
                  bloqueado && "border-slate-200 text-slate-300"
                )}
              >
                {passo.estado === "concluido" ? (
                  <CheckIcon className="size-3.5" />
                ) : bloqueado ? (
                  <LockKeyholeIcon className="size-3" />
                ) : (
                  passo.numero
                )}
              </span>
              <span
                className={cn(
                  "truncate",
                  emFoco ? "font-semibold text-slate-900" : "text-slate-600",
                  bloqueado && "text-slate-400"
                )}
              >
                {passo.titulo}
              </span>
            </button>
            {i < passos.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "h-px min-w-3 flex-1",
                  passo.estado === "concluido" ? "bg-secondary/50" : "bg-slate-200"
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function PassoCard({
  numero,
  titulo,
  estado,
  resumo,
  aberto,
  onAlternar,
  acao,
  children,
}: {
  numero: number
  titulo: string
  estado: EstadoPasso
  resumo: ReactNode
  aberto: boolean
  onAlternar: () => void
  acao?: ReactNode
  children: ReactNode
}) {
  const bloqueado = estado === "bloqueado"
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border bg-white transition-colors",
        aberto && "border-secondary/40 shadow-[0_1px_3px_rgba(15,23,42,.06)]",
        bloqueado && "bg-slate-50/60"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <button
          type="button"
          disabled={bloqueado}
          onClick={onAlternar}
          aria-expanded={aberto}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-left",
            bloqueado ? "cursor-not-allowed" : "cursor-pointer"
          )}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
              estado === "concluido" && "border-secondary bg-secondary text-white",
              estado === "ativo" && "border-secondary text-secondary",
              estado === "pendente" && "border-slate-300 text-slate-500",
              bloqueado && "border-slate-200 text-slate-400"
            )}
          >
            {estado === "concluido" ? (
              <CheckIcon className="size-4" />
            ) : bloqueado ? (
              <LockKeyholeIcon className="size-3.5" />
            ) : (
              numero
            )}
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                "block text-sm font-semibold",
                bloqueado ? "text-slate-400" : "text-slate-900"
              )}
            >
              {titulo}
            </span>
            <span
              className={cn(
                "mt-0.5 block truncate text-xs",
                bloqueado ? "text-slate-400" : "text-slate-500"
              )}
            >
              {resumo}
            </span>
          </span>
        </button>
        {acao}
      </div>
      {aberto && <div className="border-t px-4 py-5 sm:px-5">{children}</div>}
    </section>
  )
}
