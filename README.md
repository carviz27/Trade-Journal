# Trade Journal

Journal de trades pessoal: calendário de P&L, performance (dia/semana/mês + equity curve),
mistakes mais cometidos e registo de trades com checklist, descrição e imagens.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # gera dist/ (site estático)
```

Os dados ficam guardados no browser (IndexedDB). Usa **Definições → Exportar backup** para guardar uma cópia.

## Site (GitHub Pages)

Cada push para o branch principal publica a app em `https://carviz27.github.io/Trade-Journal/`
(workflow em `.github/workflows/deploy.yml`). As trades nunca vão para o GitHub: ficam no browser de quem usa a app.
