const state = {
  index: 72,
  kpis: [
    { label: "Arroba MS", value: "R$ 318,50", change: "+1,8%", tone: "positive", icon: "↗", spark: [35,40,38,47,45,57,61,70] },
    { label: "Dólar PTAX", value: "R$ 5,42", change: "+0,4%", tone: "positive", icon: "$", spark: [51,49,52,50,55,56,54,58], dynamic: true },
    { label: "Milho / saca", value: "R$ 67,80", change: "+2,1%", tone: "negative", icon: "◇", spark: [45,46,51,54,58,57,63,67] },
    { label: "Escala média", value: "7,2 dias", change: "-0,8 dia", tone: "positive", icon: "◷", spark: [74,72,68,67,63,59,57,52] }
  ],
  drivers: [
    { label: "Exportações", score: 88, points: "+18", color: "#32d583" },
    { label: "Demanda da China", score: 76, points: "+14", color: "#56d99a" },
    { label: "Escalas frigoríficas", score: 67, points: "+11", color: "#82c96a" },
    { label: "Câmbio", score: 55, points: "+8", color: "#a5cf65" },
    { label: "Custo alimentar", score: 43, points: "-9", color: "#f6b84b" }
  ]
};

const $ = selector => document.querySelector(selector);
const formatDate = date => new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(date);

function sparkline(values, tone) {
  const w = 60, h = 22, min = Math.min(...values), max = Math.max(...values);
  const points = values.map((v, i) => `${(i/(values.length-1))*w},${h-3-((v-min)/(max-min||1))*(h-6)}`).join(" ");
  const color = tone === "negative" ? "#f97066" : "#32d583";
  return `<svg class="sparkline" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline fill="none" stroke="${color}" stroke-width="2" points="${points}"/></svg>`;
}

function renderKpis() {
  $("#kpi-grid").innerHTML = state.kpis.map((item, i) => `
    <article class="kpi" data-kpi="${i}">
      <div class="kpi-top"><span>${item.label}</span><span class="kpi-icon">${item.icon}</span></div>
      <div class="kpi-value">${item.value}</div>
      <div class="kpi-bottom"><span class="${item.tone}">${item.change} <span>vs. anterior</span></span>${sparkline(item.spark,item.tone)}</div>
    </article>`).join("");
}

function renderDrivers() {
  $("#drivers").innerHTML = state.drivers.map(item => `
    <div><div class="driver-head"><span>${item.label}</span><strong class="${item.points.startsWith('-')?'negative':'positive'}">${item.points} pts</strong></div>
    <div class="driver-bar"><span style="width:${item.score}%;background:${item.color}"></span></div></div>`).join("");
}

function renderBars() {
  $("#export-bars").innerHTML = [38,52,44,63,58,72,67,86,79,95,88,100].map(v => `<span style="height:${v}%"></span>`).join("");
}

function drawChart(days = 30) {
  const canvas = $("#price-chart");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d"); ctx.scale(dpr,dpr);
  const w = rect.width, h = rect.height, pad = 12;
  const count = days === 30 ? 16 : days === 90 ? 24 : 36;
  const values = Array.from({length:count},(_,i)=>292 + i*.95 + Math.sin(i*.85)*6 + Math.cos(i*.25)*3);
  const min = Math.min(...values)-4, max = Math.max(...values)+4;
  const pts = values.map((v,i)=>({x:pad+(i/(count-1))*(w-pad*2),y:h-pad-((v-min)/(max-min))*(h-pad*2)}));
  const gradient=ctx.createLinearGradient(0,0,0,h); gradient.addColorStop(0,"rgba(50,213,131,.25)"); gradient.addColorStop(1,"rgba(50,213,131,0)");
  ctx.beginPath();ctx.moveTo(pts[0].x,h);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts.at(-1).x,h);ctx.closePath();ctx.fillStyle=gradient;ctx.fill();
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle="#32d583";ctx.lineWidth=2.4;ctx.stroke();
  const last=pts.at(-1);ctx.beginPath();ctx.arc(last.x,last.y,4,0,Math.PI*2);ctx.fillStyle="#32d583";ctx.fill();
}

async function loadDollar() {
  const now = new Date(); const start = new Date(now); start.setDate(now.getDate()-7);
  const f = d => `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${f(start)}'&@dataFinalCotacao='${f(now)}'&$top=100&$orderby=dataHoraCotacao%20desc&$format=json`;
  try {
    const response = await fetch(url); if (!response.ok) throw new Error("PTAX indisponível");
    const data = await response.json(); const quote = data.value?.[0]?.cotacaoVenda;
    if (quote) {
      state.kpis[1].value = quote.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
      localStorage.setItem("dashboi-ptax", JSON.stringify({ quote, at: Date.now() }));
      renderKpis(); $("#sync-label").textContent="PTAX e clima atualizados";
    }
  } catch {
    const cached = JSON.parse(localStorage.getItem("dashboi-ptax") || "null");
    if (cached?.quote) { state.kpis[1].value = cached.quote.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); renderKpis(); }
    $("#sync-label").textContent="Últimos dados disponíveis";
  }
}

const weatherCodes = code => ({0:"Céu limpo",1:"Predomínio de sol",2:"Parcialmente nublado",3:"Nublado",45:"Neblina",48:"Neblina",51:"Garoa leve",53:"Garoa",55:"Garoa forte",61:"Chuva leve",63:"Chuva",65:"Chuva forte",80:"Pancadas de chuva",81:"Pancadas de chuva",82:"Pancadas fortes",95:"Trovoadas"}[code] || "Condição variável");

async function loadWeather() {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=-20.4428&longitude=-54.6464&current=temperature_2m,relative_humidity_2m,weather_code&daily=precipitation_sum&timezone=America%2FCampo_Grande&forecast_days=7";
  try {
    const response = await fetch(url); if (!response.ok) throw new Error("Clima indisponível");
    const data = await response.json();
    const weather = { temp: Math.round(data.current.temperature_2m), humidity: Math.round(data.current.relative_humidity_2m), code: data.current.weather_code, rain: Math.round(data.daily.precipitation_sum.reduce((sum,value)=>sum+(value||0),0)), at: Date.now() };
    localStorage.setItem("dashboi-weather", JSON.stringify(weather)); renderWeather(weather);
  } catch { const cached = JSON.parse(localStorage.getItem("dashboi-weather") || "null"); if (cached) renderWeather(cached); else $("#weather-label").textContent="Clima indisponível"; }
}

function renderWeather(weather) {
  $("#weather-temp").textContent = `${weather.temp}°`;
  $("#weather-humidity").textContent = `${weather.humidity}%`;
  $("#weather-rain").textContent = `${weather.rain} mm`;
  $("#weather-label").textContent = weatherCodes(weather.code);
}

const bgiNumber = id => Number(document.querySelector(id).value) || 0;
const money = value => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

let bgiFeedbackTimer;

function calculateBgi(showFeedback = false) {
  const spot = bgiNumber("#spot-input"), future = bgiNumber("#future-input"), previous = bgiNumber("#previous-input");
  const heads = bgiNumber("#heads-input"), arrobas = bgiNumber("#arrobas-input"), cost = bgiNumber("#cost-input");
  const putStrike = bgiNumber("#put-strike"), putPremium = bgiNumber("#put-premium");
  const callStrike = bgiNumber("#call-strike"), callPremium = bgiNumber("#call-premium");
  const totalArrobas = heads * arrobas;
  const contracts = Math.max(0, Math.round(totalArrobas / 330));
  const change = previous ? ((future / previous) - 1) * 100 : 0;
  const basis = spot - future;
  const hedgeMargin = future - cost;
  const putFloor = putStrike - putPremium;
  const collarCost = putPremium - callPremium;
  const collarFloor = putStrike - collarCost;
  const collarCap = callStrike - collarCost;
  const strength = Math.max(5, Math.min(95, 50 + change * 12 + (future > spot ? 8 : -8)));
  document.querySelector("#bgi-current-label").textContent = `${money(future)}/@`;
  const changeEl = document.querySelector("#bgi-change");
  changeEl.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2).replace(".", ",")}%`;
  changeEl.className = change > .25 ? "positive" : change < -.25 ? "negative" : "neutral";
  document.querySelector("#bgi-meter").style.left = `${strength}%`;
  const trend = change > .75 ? "Tendência altista" : change < -.75 ? "Tendência baixista" : "Tendência lateral";
  document.querySelector("#bgi-trend").textContent = trend;
  document.querySelector("#bgi-trend-text").textContent = `Variação de ${change.toFixed(2).replace(".", ",")}% contra o ajuste anterior; base informada em ${money(basis)}/@.`;
  document.querySelector("#hedge-title").textContent = `Vender ${contracts} contrato${contracts === 1 ? "" : "s"} BGI`;
  document.querySelector("#hedge-copy").textContent = `Cobertura aproximada de ${(contracts * 330).toLocaleString("pt-BR")} das ${totalArrobas.toLocaleString("pt-BR")} arrobas previstas. Sujeita a risco de base e ajustes diários.`;
  document.querySelector("#hedge-margin").textContent = `${money(hedgeMargin)}/@`;
  document.querySelector("#put-floor").textContent = `${money(putFloor)}/@`;
  document.querySelector("#collar-range").textContent = `${money(collarFloor)}–${money(collarCap)}`;
  const saved = { spot, future, previous, heads, arrobas, cost, putStrike, putPremium, callStrike, callPremium };
  localStorage.setItem("dashboi-bgi", JSON.stringify(saved));
  const feedback = document.querySelector("#bgi-feedback");
  if (feedback) {
    feedback.textContent = showFeedback ? "Cenários recalculados agora." : "Atualização automática aplicada.";
    feedback.classList.add("visible");
    clearTimeout(bgiFeedbackTimer);
    bgiFeedbackTimer = setTimeout(() => feedback.classList.remove("visible"), 1600);
  }
}

function restoreBgi() {
  const saved = JSON.parse(localStorage.getItem("dashboi-bgi") || "null");
  if (!saved) return;
  const ids = {spot:"#spot-input",future:"#future-input",previous:"#previous-input",heads:"#heads-input",arrobas:"#arrobas-input",cost:"#cost-input",putStrike:"#put-strike",putPremium:"#put-premium",callStrike:"#call-strike",callPremium:"#call-premium"};
  Object.entries(ids).forEach(([key,id]) => { if (saved[key] != null) document.querySelector(id).value = saved[key]; });
}

function init() {
  $("#today").textContent = formatDate(new Date()).replace(/^./,c=>c.toUpperCase()) + " · Visão executiva do mercado";
  $("#gauge").style.setProperty("--score",state.index); $("#gauge strong").textContent=state.index;
  renderKpis(); renderDrivers(); renderBars(); drawChart(); restoreBgi(); calculateBgi(); Promise.allSettled([loadDollar(), loadWeather()]);
  $("#updated-at").textContent=`Atualizado às ${new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}`;
}

document.querySelectorAll(".range-tabs button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".range-tabs button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");drawChart(Number(btn.dataset.range));}));
$("#theme-btn").addEventListener("click",()=>{document.body.classList.toggle("light");localStorage.setItem("dashboi-theme",document.body.classList.contains("light")?"light":"dark");drawChart(Number(document.querySelector(".range-tabs .active").dataset.range));});
$("#menu-btn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(link=>link.addEventListener("click",()=>{$("#sidebar").classList.remove("open");document.querySelectorAll(".nav-link").forEach(a=>a.classList.remove("active"));link.classList.add("active");}));
$("#analysis-btn").addEventListener("click",()=>$("#analysis-dialog").showModal());
$("#dialog-close").addEventListener("click",()=>$("#analysis-dialog").close());
const bgiInputs = "#spot-input, #future-input, #previous-input, #heads-input, #arrobas-input, #cost-input, #put-strike, #put-premium, #call-strike, #call-premium";
document.querySelectorAll(bgiInputs).forEach(input => {
  input.addEventListener("input", () => calculateBgi());
  input.addEventListener("change", () => calculateBgi());
});
$("#bgi-calc").addEventListener("click", () => calculateBgi(true));
window.addEventListener("resize",()=>drawChart(Number(document.querySelector(".range-tabs .active").dataset.range)));
if(localStorage.getItem("dashboi-theme")==="light")document.body.classList.add("light");
let installPrompt;
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; $("#install-btn").hidden = false; });
$("#install-btn").addEventListener("click", async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $("#install-btn").hidden = true; });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
init();
