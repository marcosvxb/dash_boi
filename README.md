# DASHBOI

Painel executivo estático para inteligência do mercado pecuário. Publicação direta na Vercel, sem etapa de build.

## Arquivos

- `index.html`: estrutura do painel
- `styles.css`: interface responsiva e temas claro/escuro
- `app.js`: indicadores, gráficos e integração PTAX
- `manifest.json`: instalação como aplicativo no celular

## Publicação

Conecte este repositório à Vercel usando o preset **Other** e sem comando de build. A raiz do projeto deve apontar para a raiz do repositório.

O dólar tenta atualização pela API pública PTAX do Banco Central; os demais indicadores são referenciais nesta primeira versão.
