const LOCATION = { latitude: 37.3891, longitude: -5.9845 };
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.latitude}&longitude=${LOCATION.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=Europe%2FMadrid&forecast_days=7`;

const fallback = {
  current: { temperature_2m: 28, apparent_temperature: 29, relative_humidity_2m: 42, precipitation: 0, weather_code: 0, wind_speed_10m: 12, wind_direction_10m: 270, is_day: 1 },
  hourly: { time: Array.from({ length: 24 }, (_, i) => new Date(Date.now() + i * 3600000).toISOString()), temperature_2m: [28, 27, 27, 26, 26, 27, 29, 31, 33, 35, 36, 37, 37, 36, 35, 34, 32, 31, 29, 28, 27, 26, 26, 25], precipitation_probability: Array(24).fill(1), weather_code: Array(24).fill(0) },
  daily: { time: Array.from({ length: 7 }, (_, i) => new Date(Date.now() + i * 86400000).toISOString().slice(0, 10)), temperature_2m_max: [37, 35, 34, 36, 38, 39, 37], temperature_2m_min: [20, 19, 18, 19, 21, 22, 20], weather_code: [0, 1, 2, 0, 1, 0, 2], precipitation_probability_max: [1, 5, 8, 2, 1, 0, 4], sunrise: ["2026-09-22T08:06", "2026-09-23T08:07"], sunset: ["2026-09-22T20:19", "2026-09-23T20:17"], uv_index_max: [6, 6, 6, 7, 7, 7, 6] }
};

const $ = (id) => document.getElementById(id);
const weatherDescriptions = { 0: ["Cielo despejado", "☀"], 1: ["Principalmente despejado", "☀"], 2: ["Parcialmente nublado", "◒"], 3: ["Cubierto", "☁"], 45: ["Niebla", "≋"], 48: ["Niebla helada", "≋"], 51: ["Llovizna ligera", "⌁"], 53: ["Llovizna", "⌁"], 55: ["Llovizna intensa", "⌁"], 61: ["Lluvia ligera", "☂"], 63: ["Lluvia", "☂"], 65: ["Lluvia intensa", "☂"], 71: ["Nieve ligera", "❄"], 80: ["Chubascos", "☂"], 95: ["Tormenta", "ϟ"] };
const shortDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const classSchedule = {
  1: [["15:30–17:20", "CED", "H0.13 · G1.32 · G1.35"], ["17:40–19:30", "FP", "H0.13"], ["19:40–21:30", "CED", "G1.32 · G1.35"]],
  2: [["15:30–17:20", "IMD", "H0.13"], ["17:40–19:30", "ALN", "H0.13 · B1.31 · B1.33"]],
  3: [["15:30–17:20", "AE", "H0.13"], ["17:40–19:30", "CED", "H0.13"]],
  4: [["15:30–17:20", "IMD", "H0.13 · B1.33 · B1.34 · B1.35"], ["17:40–19:30", "FP", "H0.13 · I2.31 · I2.33 · I2.35"]],
  5: [["15:30–17:20", "ALN", "H0.13"], ["17:40–19:30", "AE", "H0.13"]]
};
// Actualiza este bloque cada semana con el nuevo PDF recibido.
const weeklyMenu = {
  1: { day: "Lunes 21", lunch: ["Arroz con carne", "Sopa de tomate", "Salchichas frescas", "Bonito al pimentón", "Puré de patatas, pimientos asados y fruta fresca"], dinner: ["Macarrones carbonara", "Espinacas salteadas con york", "Churrasco de cerdo a la plancha", "Abadejo a la plancha", "Brócoli salteado con champiñones al ajillo"] },
  2: { day: "Martes 22", lunch: ["Lentejas con chorizo", "Ensalada de hojas", "Ragout de ternera con verduras", "Gallo al horno", "Salteado de ajetes y gambas, patatas panaderas y fruta"], dinner: ["Sopa de fideos", "Tomate aliñado con atún", "Jamoncitos de pollo con nata y champiñones", "Merluza a la plancha", "Arroz salteado con zanahorias al ajillo"] },
  3: { day: "Miércoles 23", lunch: ["Fideuá de marisco", "Salmorejo con huevo y jamón picado", "Chuletas a la plancha", "Dorado al horno", "Berenjenas con miel y habitas baby con york"], dinner: ["Artisan pizza", "Fruta fresca y lácteo"] },
  4: { day: "Jueves 24", lunch: ["Hojaldre de serranito", "Arroz campero", "Escalope de pollo empanado", "Fogonero al horno", "Patatas dollar, pimientos tricolor y fruta"], dinner: ["Gratén de patatas con york", "Crema de zanahorias", "Tortilla francesa", "Calamares a la plancha", "Espirales salteadas, calabaza asada y fruta"] },
  5: { day: "Viernes 25", lunch: ["Patatas a la riojana", "Ensalada de tomate y maíz", "Contramuslo de pollo teriyaki", "Boquerones al limón", "Guisantes salteados y coliflor gratinada"], dinner: ["Sopa de picadillo", "Wok de tallarines con verdura y soja", "Empanadillas de carne", "Palometa al horno", "Arroz pilaf, alcachofas salteadas y fruta"] },
  6: { day: "Sábado 26", lunch: ["Potaje de garbanzos", "Ensaladilla rusa", "Pavo a la plancha", "Palometa a la riojana", "Lacitos salteados y judías verdes"], dinner: ["Crema de calabaza", "Arroz 3 delicias", "San jacobos", "Gallineta a la roteña", "Pan de gambas, verduras al grill y fruta"] },
  0: { day: "Domingo 27", lunch: ["Tabboulé con maíz", "Ensalada campera", "Cinta de lomo al horno", "Jurel a la plancha", "Espárragos trigueros, aros de cebolla y fruta"], dinner: ["Espaguetis napolitana", "Sopa de verduras", "Hamburguesa completa", "Merluza a la plancha", "Patatas deluxe, maíz salteado y fruta"] }
};

function description(code) { return weatherDescriptions[code] || ["Tiempo variable", "◒"]; }
function formatTime(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(11, 16);
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid" }).format(new Date(value));
}
function formatDate(value, options) {
  const date = value instanceof Date ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", ...options }).format(date);
}
function windDirection(degrees) { return ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(degrees / 45) % 8]; }
function greeting() {
  const hour = Number(new Intl.DateTimeFormat("es-ES", { hour: "numeric", hour12: false, timeZone: "Europe/Madrid" }).format(new Date()));
  return hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
}
function todayKey() {
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Europe/Madrid" }).format(new Date());
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 }[day] || 0;
}
function renderClasses() {
  const today = todayKey();
  const classes = classSchedule[today] || [];
  $("schedule-day").textContent = classes.length ? "Hoy" : "Sin clases";
  $("class-list").innerHTML = classes.length ? classes.map(([time, name, room]) => `<div class="class-item"><span class="class-dot" aria-hidden="true"></span><span class="class-time">${time}</span><span class="class-info"><span class="class-name">${name}</span><span class="class-room">${room}</span></span></div>`).join("") : '<p class="empty-state">No tienes clases programadas para hoy.</p>';
}
function renderMenu() {
  const menu = weeklyMenu[new Date().getDay()] || weeklyMenu[1];
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Europe/Madrid" }).format(new Date()));
  const isLunch = hour < 21;
  const dishes = isLunch ? menu.lunch : menu.dinner;
  $("meal-title").textContent = isLunch ? "Comida" : "Cena";
  $("meal-time").textContent = isLunch ? "13:00–14:35" : "21:00–22:30";
  $("meal-day").textContent = `${menu.day} · Menú de hoy`;
  $("meal-dishes").innerHTML = dishes.map((dish) => `<span class="meal-dish">${dish}</span>`).join("");
  $("weekly-menu-grid").innerHTML = Object.values(weeklyMenu).map((item) => `<article class="menu-day"><div class="menu-day-name">${item.day}</div><p class="menu-type">Comida</p>${item.lunch.map((dish) => `<div class="menu-item">${dish}</div>`).join("")}<p class="menu-type">Cena</p>${item.dinner.map((dish) => `<div class="menu-item">${dish}</div>`).join("")}</article>`).join("");
}

function renderForecasts(data) {
  const hourly = data.hourly || fallback.hourly;
  const daily = data.daily || fallback.daily;
  const allHourlyTimes = Array.isArray(hourly.time) ? hourly.time : fallback.hourly.time;
  const allHourlyTemperatures = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m : fallback.hourly.temperature_2m;
  const allHourlyRain = Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability : fallback.hourly.precipitation_probability;
  const allHourlyCodes = Array.isArray(hourly.weather_code) ? hourly.weather_code : fallback.hourly.weather_code;
  const currentHour = data.current?.time ? data.current.time.slice(0, 13) : new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", hour: "2-digit", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replace(" ", "T");
  const startIndex = Math.max(0, allHourlyTimes.findIndex((time) => time.slice(0, 13) >= currentHour));
  const hourlyTimes = allHourlyTimes.slice(startIndex);
  const hourlyTemperatures = allHourlyTemperatures.slice(startIndex);
  const hourlyRain = allHourlyRain.slice(startIndex);
  const hourlyCodes = allHourlyCodes.slice(startIndex);
  const dailyTimes = Array.isArray(daily.time) ? daily.time : fallback.daily.time;
  const dailyMax = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : fallback.daily.temperature_2m_max;
  const dailyMin = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : fallback.daily.temperature_2m_min;
  const dailyRain = Array.isArray(daily.precipitation_probability_max) ? daily.precipitation_probability_max : fallback.daily.precipitation_probability_max;
  const dailyCodes = Array.isArray(daily.weather_code) ? daily.weather_code : fallback.daily.weather_code;
  $("hourly-forecast").innerHTML = hourlyTimes.slice(0, 12).map((time, i) => {
    const [text, icon] = description(hourlyCodes[i]);
    return `<article class="hour-card"><p>${i === 0 ? "Ahora" : formatTime(time)}</p><span class="hour-icon" aria-label="${text}">${icon}</span><strong>${Math.round(hourlyTemperatures[i])}°</strong><span class="rain-chance">${hourlyRain[i]}% lluvia</span></article>`;
  }).join("");
  $("daily-forecast").innerHTML = dailyTimes.slice(0, 7).map((time, i) => {
    const date = new Date(`${time}T12:00:00`); const [text, icon] = description(dailyCodes[i]);
    return `<article class="day-row ${i === 0 ? "today" : ""}"><div><span class="day-name">${i === 0 ? "Hoy" : shortDays[date.getDay()]}</span><span class="day-date"> · ${formatDate(time, { day: "numeric", month: "short" })}</span></div><span class="day-icon" aria-label="${text}">${icon}</span><span class="day-condition">${text}</span><span class="day-rain">${dailyRain[i]}% lluvia</span><span class="day-temp"><strong>${Math.round(dailyMax[i])}°</strong><span>${Math.round(dailyMin[i])}°</span></span></article>`;
  }).join("");
}

function render(data, isFallback = false) {
  const current = data.current;
  const [condition, symbol] = description(current.weather_code);
  $("greeting").textContent = greeting();
  $("hero-date").textContent = formatDate(new Date().toISOString().slice(0, 10), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("current-symbol").textContent = symbol; $("current-temperature").textContent = Math.round(current.temperature_2m);
  $("current-condition").textContent = condition; $("feels-like").textContent = `${Math.round(current.apparent_temperature)}°`;
  $("humidity").textContent = `${current.relative_humidity_2m}%`; $("wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  $("wind-direction").textContent = `${windDirection(current.wind_direction_10m)} · ${current.wind_speed_10m < 20 ? "Brisa suave" : "Viento moderado"}`;
  $("precipitation").textContent = `${Math.round(current.precipitation || 0)}%`;
  $("uv-index").innerHTML = `${Math.round(data.daily.uv_index_max[0])} <em>${data.daily.uv_index_max[0] > 5 ? "Alto" : "Moderado"}</em>`;
  $("data-status").textContent = isFallback ? "Datos de ejemplo · Actualiza para reconectar" : "La previsión se actualiza automáticamente";
  $("updated-label").textContent = isFallback ? "Datos sin conexión" : `Actualizado a las ${new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
  renderForecasts(data);
}

async function loadWeather() {
  document.body.classList.add("is-loading"); $("refresh-button").setAttribute("aria-busy", "true");
  try {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
    render(await response.json());
  } catch (error) {
    console.warn(error);
    try { render(fallback, true); } catch (fallbackError) { console.warn(fallbackError); renderForecasts(fallback); }
    showToast("No se ha podido cargar la previsión — se muestran datos de ejemplo.");
  } finally {
    document.body.classList.remove("is-loading"); $("refresh-button").removeAttribute("aria-busy");
  }
}
function showToast(message) { const toast = $("toast"); toast.textContent = message; toast.classList.add("visible"); setTimeout(() => toast.classList.remove("visible"), 4500); }
$("refresh-button").addEventListener("click", loadWeather);
$("hourly-scroll-button").addEventListener("click", () => $("hourly-forecast").scrollBy({ left: 300, behavior: "smooth" }));
 $("menu-toggle").addEventListener("click", () => {
  const menu = $("weekly-menu");
  const expanded = $("menu-toggle").getAttribute("aria-expanded") === "true";
  menu.hidden = expanded;
  $("menu-toggle").setAttribute("aria-expanded", String(!expanded));
  $("menu-toggle").innerHTML = expanded ? "Ver toda la semana <span>↓</span>" : "Ocultar menú semanal <span>↑</span>";
});
renderClasses();
renderMenu();
render(fallback, true);
loadWeather();
