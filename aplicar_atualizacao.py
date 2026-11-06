from pathlib import Path
p=Path(__file__).resolve().parent
index=p/'index.html';sw=p/'sw.js'
if not index.exists() or not sw.exists():raise SystemExit('ERRO: execute na pasta do repositorio com index.html e sw.js')
s=index.read_text(encoding='utf-8')
if 'id="operacao"' not in s:
 s=s.replace('<a class="nav-link" href="#mercado">','<a class="nav-link" href="#operacao"><span>▦</span>Operação Gruta Azul</a>\n        <a class="nav-link" href="#mercado">',1)
 marker='      <section class="data-note"'
 if marker not in s:raise SystemExit('ERRO: local de insercao nao encontrado em index.html')
 s=s.replace(marker,(p/'secao_operacao.html').read_text(encoding='utf-8')+'\n'+marker,1)
if 'intelligence.css' not in s:s=s.replace('<link rel="stylesheet" href="/styles.css">','<link rel="stylesheet" href="/styles.css">\n  <link rel="stylesheet" href="/intelligence.css">',1)
if 'intelligence.js' not in s:s=s.replace('<script src="/app.js"></script>','<script src="/app.js"></script>\n  <script src="/intelligence.js"></script>',1)
index.write_text(s,encoding='utf-8')
t=sw.read_text(encoding='utf-8').replace('dashboi-v3','dashboi-v4-20261106')
if 'intelligence.js' not in t:t=t.replace('"/app.js",','"/app.js", "/intelligence.js", "/intelligence.css", "/intelligence-data.json",')
sw.write_text(t,encoding='utf-8')
print('OK: index.html e sw.js atualizados. Suba todos os arquivos do pacote, exceto secao_operacao.html e este script.')
