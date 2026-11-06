const https = require("https");

const CEPEA_URL = "https://www.cepea.org.br/br/indicador/boi-gordo.aspx";
const BACKUP_URL = "https://www.noticiasagricolas.com.br/cotacoes/boi-gordo/boi-gordo-indicador-esalq-bmf";
const FALLBACK = {
  source: "CEPEA/ESALQ",
  sourceUrl: CEPEA_URL,
  license: "CEPEA CC BY-NC 4.0",
  stale: true,
  fallbackReason: "Fonte CEPEA bloqueou a consulta automática no servidor",
  fetchedAt: "2026-11-05T00:00:00.000Z",
  latest: {
    date: "05/11/2026",
    value: 391.35,
    dayChange: "+0,13%",
    monthChange: "+0,37%",
    usd: 71.26
  },
  series: [389.20, 389.90, 390.00, 390.85, 391.35]
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "user-agent": "DASHBOI market reference updater",
          "accept": "text/html,application/xhtml+xml"
        }
      },
      response => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", chunk => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`CEPEA respondeu ${response.statusCode}`));
            return;
          }
          resolve(body);
        });
      }
    );
    request.setTimeout(9000, () => {
      request.destroy(new Error("Tempo excedido ao consultar CEPEA"));
    });
    request.on("error", reject);
  });
}

function toNumber(value) {
  return Number(String(value).replace(/\./g, "").replace(",", "."));
}

function parseCepea(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

  const rows = [...text.matchAll(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2,3},\d{2})\s+([+-]?\d+,\d+%)\s+([+-]?\d+,\d+%)\s+(\d{2,3},\d{2})/g)]
    .slice(0, 5)
    .map(match => ({
      date: match[1],
      value: toNumber(match[2]),
      dayChange: match[3],
      monthChange: match[4],
      usd: toNumber(match[5])
    }));

  if (!rows.length) throw new Error("Tabela CEPEA não encontrada");
  validateDate(rows[0].date);

  return {
    source: "CEPEA/ESALQ",
    sourceUrl: CEPEA_URL,
    license: "CEPEA CC BY-NC 4.0",
    fetchedAt: new Date().toISOString(),
    latest: rows[0],
    series: rows.map(row => row.value).reverse()
  };
}


function validateDate(brDate) {
  const [d, m, y] = brDate.split("/").map(Number);
  if (!d || !m || !y) throw new Error("Data de cotação inválida");
  const ageDays = (Date.now() - Date.UTC(y, m - 1, d)) / 86400000;
  if (ageDays < -1 || ageDays > 7) throw new Error("Fonte sem cotação dos últimos 7 dias");
}

function parseBackup(html) {
  const matches = [...html.matchAll(/<tr[^>]*>\s*<td[^>]*>\s*(\d{2}\/\d{2}\/\d{4})\s*<\/td>\s*<td[^>]*>\s*(\d{2,3},\d{2})\s*<\/td>\s*<td[^>]*>\s*([+-]?\d+,\d+)\s*<\/td>/gi)];
  const rows = matches.slice(0, 5).map(m => ({
    date: m[1], value: toNumber(m[2]), dayChange: m[3] + "%", monthChange: "n/d", usd: null
  }));
  if (!rows.length) throw new Error("Indicador CEPEA indisponível na fonte secundária");
  validateDate(rows[0].date);
  return {
    source: "CEPEA/ESALQ via Notícias Agrícolas",
    sourceUrl: BACKUP_URL,
    originalSourceUrl: CEPEA_URL,
    license: "CEPEA CC BY-NC 4.0",
    stale: false,
    fetchedAt: new Date().toISOString(),
    latest: rows[0],
    series: rows.map(r => r.value).reverse()
  };
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    const html = await fetchText(CEPEA_URL);
    res.status(200).json(parseCepea(html));
  } catch (error) {
    try {
      const html = await fetchText(BACKUP_URL);
      res.status(200).json(parseBackup(html));
    } catch (secondaryError) {
      res.status(200).json({
        ...FALLBACK,
        checkedAt: new Date().toISOString(),
        detail: "CEPEA: " + error.message + "; Notícias Agrícolas: " + secondaryError.message
      });
    }
  }
};
