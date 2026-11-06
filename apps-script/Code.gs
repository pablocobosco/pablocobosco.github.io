const TUSSAM_API = "https://reddelineas.tussam.es/API/infotus-ui/buses/";
const TUSSAM_ROUTES_API =
  "https://services1.arcgis.com/hcmP7kr0Cx3AcTJk/arcgis/rest/services/TUSSAM_Lineas/FeatureServer/0/query";
const CACHE_SECONDS = 60;

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("TUSSAM en vivo")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function getBuses(line) {
  const code = normalizeLine(line);
  return getCachedJson_("buses_" + code, function () {
    const response = UrlFetchApp.fetch(
      TUSSAM_API + encodeURIComponent(code) + "?_=" + Date.now(),
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "es-ES,es;q=0.9",
          Origin: "https://reddelineas.tussam.es",
          Referer: "https://reddelineas.tussam.es/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"
        },
        muteHttpExceptions: true
      }
    );
    if (response.getResponseCode() !== 200) {
      throw new Error(describeHttpError_("TUSSAM", response));
    }

    const data = JSON.parse(response.getContentText());
    if (!data || !Array.isArray(data.result)) {
      throw new Error("TUSSAM devolvió una respuesta de autobuses no válida");
    }
    return { result: data.result };
  });
}

function getRoute(line) {
  const code = normalizeLine(line);
  return getCachedJson_("route_" + code, function () {
    const query = [
      "where=" + encodeURIComponent("LabelLinea='" + code + "'"),
      "outFields=*",
      "returnGeometry=true",
      "f=geojson"
    ].join("&");
    const response = UrlFetchApp.fetch(
      TUSSAM_ROUTES_API + "?" + query,
      { headers: { Accept: "application/geo+json, application/json" }, muteHttpExceptions: true }
    );
    if (response.getResponseCode() !== 200) {
      throw new Error("El servicio de recorridos respondió HTTP " + response.getResponseCode());
    }

    const data = JSON.parse(response.getContentText());
    if (!data || !Array.isArray(data.features)) {
      throw new Error("El servicio de TUSSAM devolvió un recorrido no válido");
    }
    return data;
  });
}

function normalizeLine(line) {
  const code = String(line || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{1,4}$/.test(code)) {
    throw new Error("Código de línea no válido");
  }
  return /^\d$/.test(code) ? "0" + code : code;
}

function describeHttpError_(service, response) {
  const status = response.getResponseCode();
  const detail = response.getContentText()
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
  return service + " respondió HTTP " + status +
    (detail ? ": " + detail : "") +
    (status === 403 ? ". Google Apps Script realiza estas peticiones desde IPs compartidas de Google, que TUSSAM podría estar bloqueando." : "");
}

function getCachedJson_(key, load) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);

  const value = load();
  const serialized = JSON.stringify(value);
  if (serialized.length < 95000) {
    cache.put(key, serialized, CACHE_SECONDS);
  }
  return value;
}
