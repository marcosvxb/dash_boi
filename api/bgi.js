const https = require("https");

const SOURCE_URL = "https://www.noticiasagricolas.com.br/cotacoes/boi-gordo/boi-gordo-b3-prego-regular";
const MONTHS = {
  Janeiro: "F", Fevereiro: "G", Março: "H", Abril: "J", Maio: "K", Junho: "M",
  Julho: "N", Agosto: "Q", Setembro: "U", Outubro: "V", Novembro: "X", Dezembro: "Z"
};

function getPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; DashBoi/1.0; market data reference)", accept: "text/html" } }, res => {
      if (res.statusCode !== 200) { res.resume(); reject(new Error("Fonte HTTP " + res.statusCode)); return; }
      let text = "";
      res.setEncoding("utf8");
      res.on("data", chunk => {
        text += chunk;
        if (text.length > 2500000) req.destroy(new Error("Página muito grande"));
      });
      res.on("end", () => resolve(text));
    });
    req.setTimeout(11000, () => req.destroy(new Error("Tempo excedido")));
    req.on("error", reject);
  });
}
function numeric(s) { return Number(s.replace(/\./g, "").replace(",", ".")); }

function parseSection(fragment) {
  const match = fragment.match(/Fechamento:\s*(\d{2}\/\d{2}\/\d{4})/);
  if (!match) return null;
  const tbody = fragment.match(/<tbody[^>]*class=["'][^"']*body-box[^"']*["'][^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbody) return null;
  const rows = [];
  const rowRe = /<tr[^>]*>\s*<td[^>]*>\s*([^<]*?)\s*<\/td>\s*<td[^>]*>\s*([\d.]+,\d{2})\s*<\/td>\s*<td[^>]*>\s*([+-]?[\d.,]+)\s*<\/td>[\s\S]*?<\/tr>/gi;
  let r;
  while ((r = rowRe.exec(tbody[1])) !== null) {
    const label = r[1].trim();
    const contract = label.match(/^([A-Za-zÀ-ÿ]+)\/(20\d{2})$/);
    if (!contract) continue;
    const monthName = contract[1].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^./, ch => ch.toUpperCase());
    const code = MONTHS[monthName];
    if (!code) continue;
    const value = numeric(r[2]);
    const variation = numeric(r[3]);
    if (!Number.isFinite(value) || value < 100 || value > 1500 || !Number.isFinite(variation)) continue;
    rows.push({ code: "BGI" + code + contract[2].slice(2), name: label, value, variationPercent: variation });
  }
  return { date: match[1], rows };
}

function parseData(html) {
  const parts = html.split(/<div class="cotacao">/i);
  const sections = parts.map(parseSection).filter(x => x && x.rows.length);
  if (!sections.length) throw new Error("Tabela B3 não encontrada");
  const current = sections[0], [d, m, y] = current.date.split("/").map(Number);
  const ageDays = (Date.now() - Date.UTC(y, m - 1, d)) / 86400000;
  if (ageDays < -1 || ageDays > 7) throw new Error("Fechamento B3 desatualizado: " + current.date);
  const previous = sections.find(s => s.date !== current.date);
  const contracts = current.rows.map(row => ({
    ...row,
    previous: previous?.rows.find(p => p.code === row.code)?.value ?? null
  }));
  if (!contracts.length) throw new Error("Nenhum contrato BGI válido");
  return { source: "B3 via Notícias Agrícolas", sourceUrl: SOURCE_URL, date: current.date,
    type: "fechamento", isRealtime: false, stale: false,
    fetchedAt: new Date().toISOString(), contracts };
}
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
  try {
    const page = await getPage(SOURCE_URL);
    res.status(200).json(parseData(page));
  } catch (error) {
    res.status(503).json({ source: "B3 via Notícias Agrícolas", sourceUrl: SOURCE_URL,
      stale: true, isRealtime: false, contracts: [], error: error.message,
      message: "Cotação B3 indisponível; utilize preços manuais conferidos na fonte." });
  }
};
