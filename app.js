const state = {
  score: 68,
  drivers: [
    "Exportações firmes sustentam viés positivo.",
    "China segue como principal comprador monitorado.",
    "Dólar valorizado melhora competitividade da carne exportada.",
    "Custo do milho reduz margem do confinamento.",
    "Clima deve ser acompanhado para oferta de pasto e logística."
  ],
  kpis: [
    { label: "Arroba MS", value: "R$ 315,50", sub: "base editável / CEPEA ou Scot" },
    { label: "Dólar comercial", value: "carregando", sub: "Banco Central" },
    { label: "Milho MS", value: "R$ 54,00", sub: "CONAB / CEPEA" },
    { label: "Farelo soja", value: "R$ 1.920", sub: "R$/t - referência" },
    { label: "Exportações", value: "238 mil t", sub: "mês corrente - Comex Stat" },
    { label: "China", value: "54%", sub: "participação estimada" },
    { label: "Escalas", value: "6 dias", sub: "frigoríficos MS" },
    { label: "Clima", value: "Favorável", sub: "INMET / NOAA" }
  ],
  series: {
    arroba: { labels:["Jan","Fev","Mar","Abr","Mai","Jun","Jul"], values:[292,298,304,308,311,318,315] },
    exportacao: { labels:["Jan","Fev","Mar","Abr","Mai","Jun","Jul"], values:[182,198,211,220,232,241,238] },
    feed: { labels:["Jan","Fev","Mar","Abr","Mai","Jun","Jul"], values:[49,51,52,53,55,56,54] },
    weather: { labels:["Jan","Fev","Mar","Abr","Mai","Jun","Jul"], values:[180,145,122,76,48,22,18] }
  }
};

function brl(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)}
function setText(id,text){document.getElementById(id).textContent=text}
function render(){
  setText('score-value', state.score); document.getElementById('score-bar').style.width=state.score+'%';
  setText('market-label', state.score>=70?'Mercado altista':state.score>=45?'Mercado neutro':'Mercado baixista');
  setText('score-text', 'Nota calculada por exportações, China, câmbio, escalas, custo alimentar, consumo interno e clima.');
  setText('updated-at', 'Atualizado: '+new Date().toLocaleString('pt-BR'));
  document.getElementById('drivers').innerHTML = state.drivers.map(x=>`<li>${x}</li>`).join('');
  document.getElementById('kpis').innerHTML = state.kpis.map(k=>`<article class="kpi"><div class="label">${k.label}</div><div class="value">${k.value}</div><div class="sub">${k.sub}</div></article>`).join('');
  lineChart('arrobaChart', state.series.arroba, 'R$'); lineChart('exportChart', state.series.exportacao, '');
  lineChart('feedChart', state.series.feed, 'R$'); lineChart('weatherChart', state.series.weather, 'mm');
}
async function loadDollar(){
  try{
    const d=new Date(); d.setDate(d.getDate()-1);
    const f=`${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
    const url=`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${f}'&$top=1&$format=json`;
    const res=await fetch(url); const json=await res.json();
    const cot=json.value?.[0]?.cotacaoVenda;
    if(cot){ state.kpis.find(k=>k.label==='Dólar comercial').value=brl(cot); state.kpis.find(k=>k.label==='Dólar comercial').sub='PTAX venda - Banco Central'; render(); }
  }catch(e){ state.kpis.find(k=>k.label==='Dólar comercial').value='manual'; render(); }
}
function lineChart(id, s, suffix){
  const c=document.getElementById(id), ctx=c.getContext('2d'), w=c.width=c.offsetWidth*devicePixelRatio, h=c.height=220*devicePixelRatio, p=32*devicePixelRatio;
  ctx.clearRect(0,0,w,h); ctx.lineWidth=1*devicePixelRatio; ctx.strokeStyle='#1f3b33'; ctx.fillStyle='#95aaa0'; ctx.font=`${11*devicePixelRatio}px Arial`;
  for(let i=0;i<4;i++){const y=p+i*(h-2*p)/3; ctx.beginPath(); ctx.moveTo(p,y); ctx.lineTo(w-p,y); ctx.stroke();}
  const min=Math.min(...s.values), max=Math.max(...s.values), span=max-min||1;
  const pts=s.values.map((v,i)=>[p+i*(w-2*p)/(s.values.length-1), h-p-((v-min)/span)*(h-2*p)]);
  ctx.beginPath(); pts.forEach((pt,i)=>i?ctx.lineTo(...pt):ctx.moveTo(...pt)); ctx.strokeStyle='#55d987'; ctx.lineWidth=3*devicePixelRatio; ctx.stroke();
  pts.forEach(([x,y],i)=>{ctx.beginPath();ctx.arc(x,y,4*devicePixelRatio,0,Math.PI*2);ctx.fillStyle='#7dd3fc';ctx.fill();ctx.fillStyle='#95aaa0';ctx.fillText(s.labels[i],x-10*devicePixelRatio,h-8*devicePixelRatio)});
  ctx.fillStyle='#eef8f3'; ctx.fillText(`${suffix} ${max}`,p,18*devicePixelRatio); ctx.fillText(`${suffix} ${min}`,p,h-p+4*devicePixelRatio);
}
render(); loadDollar();
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}
