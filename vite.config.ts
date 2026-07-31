import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Em dev, o Vite roda em :5173 e encaminha as chamadas para a API da Triagem BR NET.
// Alvo padrão: o container do docker compose (porta 8890 do host).
// Se estiver rodando a API local em outra porta, sobrescreva com:
//   VITE_API_TARGET=http://localhost:8000 npm run dev
// (atenção: nesta máquina a porta 8000 é de OUTRO projeto, o bot-quali)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "")
  const alvo = env.VITE_API_TARGET ?? "http://localhost:8890"
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true, // expõe na rede local (equivale a --host)
      proxy: {
        "/api": alvo,
      },
    },
  }
})
