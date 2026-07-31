# Instruções para agentes

Este repositório contém somente o front React/Vite da Triagem BR NET.

- O browser acessa exclusivamente rotas relativas `/api/*`.
- Nunca coloque `DATABASE_URL`, chaves do Neon ou segredos do backend aqui.
- Em produção, `vercel.json` encaminha `/api/*` ao backend e preserva a sessão
  por cookie sob a origem da Vercel.
- Rode `npm run build` antes de entregar mudanças.
- Alterações de contrato da API precisam ser coordenadas com o repositório
  `QualidadeGestaoBRMED/triagem-brnet-back`.
