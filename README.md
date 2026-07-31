# Triagem BR NET — Front-end

Interface React/Vite para ingestão e conferência de PCMSOs, histórico de
extrações, feedback estruturado e administração de usuários.

O backend e o banco não fazem parte deste repositório. O navegador usa apenas
rotas relativas `/api/*`:

- em desenvolvimento, o Vite encaminha para `VITE_API_TARGET`;
- na Vercel, `vercel.json` encaminha para o serviço do backend no Render.

## Desenvolvimento

```bash
cp .env.example .env
npm install
npm run dev
```

Por padrão, a API deve estar em `http://localhost:8890`.

## Validação

```bash
npm run build
```

## Deploy na Vercel

1. Importe `QualidadeGestaoBRMED/triagem-brnet-front`.
2. Framework: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Confira em `vercel.json` se o destino aponta para a URL real do backend.

Nenhuma credencial é necessária no front. A sessão continua usando cookie
`httpOnly`; o rewrite faz API e interface aparecerem sob a mesma origem.

## Documentação

- `docs/visualizador-pdf.md`: preview e destaque de evidências no documento.
- `docs/qeg-design.json`: referência do sistema visual.
