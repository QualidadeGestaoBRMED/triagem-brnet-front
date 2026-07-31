// A avaliação (passo 2) e o resultado da importação (passo 4) compartilham o
// campo `notes` do review. A linha da importação fica marcada para que os dois
// formulários editem apenas a parte que é sua.
const MARCA = "[Importação]"

export function notaDaImportacao(notas: string | null): string {
  const linha = (notas ?? "").split("\n").find((l) => l.startsWith(MARCA))
  return linha ? linha.slice(MARCA.length).trim() : ""
}

export function notaDaAvaliacao(notas: string | null): string {
  return (notas ?? "")
    .split("\n")
    .filter((l) => !l.startsWith(MARCA))
    .join("\n")
    .trim()
}

export function juntarNotas(avaliacao: string, importacao: string): string | null {
  const linha = importacao.trim() ? `${MARCA} ${importacao.trim()}` : ""
  return [avaliacao.trim(), linha].filter(Boolean).join("\n\n") || null
}
