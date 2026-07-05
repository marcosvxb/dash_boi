# DASHBOI - Vercel estático

Versão sem Node, sem npm install, sem Next.js e sem build. É a forma mais segura para publicar na Vercel agora.

## Como publicar
1. Apague os arquivos antigos do repositório DASHBOI.
2. Envie somente os arquivos desta pasta para a raiz do GitHub.
3. Na Vercel, faça redeploy.

Como não existe package.json, a Vercel publica como site estático e não roda npm install.

## Onde editar dados
Abra `app.js` e edite o objeto `state`.

## Automático
O dólar tenta atualizar pela API pública PTAX do Banco Central.
