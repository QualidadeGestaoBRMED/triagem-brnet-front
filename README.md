# Triagem BR NET — Front-end

Interface React/Vite para ingestão e conferência de PCMSOs, histórico de
extrações, feedback estruturado e administração de usuários.

O backend e o banco não fazem parte deste repositório. O navegador acessa
diretamente a API definida por `VITE_API_URL`; PDFs, planilhas e chamadas de
API não passam por proxy da Vercel.

## Desenvolvimento

```bash
cp .env.example .env
npm install
npm run dev
```

Por padrão, a API local deve estar em `http://localhost:8890`. O backend
precisa permitir a origem `http://localhost:5173`.

## Validação

```bash
npm run build
```

## Deploy na Vercel

1. Importe `QualidadeGestaoBRMED/triagem-brnet-front`.
2. Framework: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Configure `VITE_API_URL` somente se a URL do Render diferir do fallback
   `https://triagem-brnet-back.onrender.com`.

Nenhuma credencial secreta é armazenada no front. A sessão usa cookie
`HttpOnly`, `Secure`, `SameSite=None` e `Partitioned`, aceito pelo
backend apenas para a origem oficial da Vercel.

## Documentação

- `docs/visualizador-pdf.md`: preview e destaque de evidências no documento.
- `docs/qeg-design.json`: referência do sistema visual.
