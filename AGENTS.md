# Instruções para agentes

Este repositório contém somente o front React/Vite da Triagem BR NET.

- O browser acessa diretamente a API indicada por `VITE_API_URL`.
- Nunca coloque `DATABASE_URL`, chaves do Neon ou segredos do backend aqui.
- Toda chamada usa cookie `HttpOnly` particionado e `credentials: include`.
- Não adicione proxy ou rewrite de `/api` na Vercel.
- Rode `npm run build` antes de entregar mudanças.
- Alterações de contrato da API precisam ser coordenadas com o repositório
  `QualidadeGestaoBRMED/triagem-brnet-back`.
