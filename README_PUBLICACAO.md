# DashBoi — Versão com estoque e previsões (06/11/2026)

Publicação: extraia TODOS os arquivos deste ZIP na raiz do repositório marcosvxb/dash_boi, mantendo api/cepea.js dentro de api/. Faça commit na branch main do repositório vinculado ao seu projeto da Vercel.

## Fontes e interpretação
- Histórico de movimentos: FABRICA21-04-24; data de corte 03/11/2026. Reconciliação de pesagens e vendas provisória.
- Estoque teórico: Estoque anterior de 30/06/2023 + compras da aba Desembolsos - consumo acumulado de Insumos nutricionais. A aba Estoque não foi utilizada.
- CEPEA/ESALQ SP: snapshot de 05/11/2026, R$391,35/@, fonte https://www.cepea.org.br/br/indicador/boi-gordo.aspx. A API tenta consultar o CEPEA ao vivo. Em caso de falha mostra o snapshot COM AVISO, preservando data antiga e não alterando automaticamente o preço de hedge.
- O índice 72 e o sinal de venda são ilustrativos e não refletem a reconciliação das contas.
- Saldos negativos de ingredientes apontam para lançamentos ausentes/ajustes pendentes e não devem ser confundidos com estoque físico negativo.
- Projeções individuais usam GMD de referência, são cenários, e ainda não equivalem a disponibilidade real para abate.
- Segurança: o repositório é público. Arquivos da versão web contêm dados agregados. NÃO publique o CSV individual; mantenha acesso restrito.

## Arquivos de conferência individuais
Fornecidos separadamente nesta conversa em CSV e Excel. O painel web NÃO publica esses identificadores.
