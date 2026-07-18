const https = require("https");

const CEPEA_URL = "https://www.cepea.org.br/br/indicador/boi-gordo.aspx";

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

  return {
    source: "CEPEA/ESALQ",
    sourceUrl: CEPEA_URL,
    license: "CEPEA CC BY-NC 4.0",
    fetchedAt: new Date().toISOString(),
    latest: rows[0],
    series: rows.map(row => row.value).reverse()
  };
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");
    const html = await fetchText(CEPEA_URL);
    res.status(200).json(parseCepea(html));
  } catch (error) {
    res.status(502).json({
      error: "Não foi possível atualizar o CEPEA agora",
      detail: error.message
    });
  }
};
