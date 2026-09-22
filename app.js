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
const calendarUrl = "https://p124-caldav.icloud.com/published/2/MjAzMzU2NjI4MzQyMDMzNSAK8sTVqXEK1jvzk1cNEZKfA-YZAffDBty1eYnb9Kg7ExY_d4umgmdwCRn17BEmME349yYakN5MTcGg2aqcToI";
const classSchedule = {
  1: [["15:30–17:20", "CED", "H0.13 · G1.32 · G1.35"], ["17:40–19:30", "FP", "H0.13"], ["19:40–21:30", "CED", "G1.32 · G1.35"]],
  2: [["15:30–17:20", "IMD", "H0.13"], ["17:40–19:30", "ALN", "H0.13 · B1.31 · B1.33"]],
  3: [["15:30–17:20", "AE", "H0.13"], ["17:40–19:30", "CED", "H0.13"]],
  4: [["15:30–17:20", "IMD", "H0.13 · B1.33 · B1.34 · B1.35"], ["17:40–19:30", "FP", "H0.13 · I2.31 · I2.33 · I2.35"]],
  5: [["15:30–17:20", "ALN", "H0.13"], ["17:40–19:30", "AE", "H0.13"]]
};

function description(code) { return weatherDescriptions[code] || ["Tiempo variable", "◒"]; }
function formatTime(value) { return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid" }).format(new Date(value)); }
function formatDate(value, options) { return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", ...options }).format(new Date(`${value}T12:00:00`)); }
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

function unfoldICS(text) {
  return text.replace(/\r?\n[ \t]/g, "");
}
function parseICSDate(value) {
  const clean = value.split(":").pop().trim();
  if (/^\d{8}$/.test(clean)) return new Date(`${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T00:00:00`);
  if (/^\d{8}T\d{6}Z$/.test(clean)) return new Date(`${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(9, 11)}:${clean.slice(11, 13)}:${clean.slice(13, 15)}Z`);
  if (/^\d{8}T\d{6}$/.test(clean)) return new Date(`${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(9, 11)}:${clean.slice(11, 13)}:${clean.slice(13, 15)}`);
  return new Date(clean);
}
function parseICS(text) {
  const events = [];
  const blocks = unfoldICS(text).split("BEGIN:VEVENT").slice(1);
  blocks.forEach((block) => {
    const get = (key) => (block.match(new RegExp(`\\n${key}(?:;[^:]*)?:(.*)`)) || [])[1]?.trim().replace(/\\n/g, " ").replace(/\\,/g, ",");
    const start = get("DTSTART");
    if (start) events.push({ title: get("SUMMARY") || "Evento", start: parseICSDate(start), end: parseICSDate(get("DTEND") || start) });
  });
  return events.filter((event) => !Number.isNaN(event.start.getTime())).sort((a, b) => a.start - b.start);
}
function isToday(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(date) === new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}
function renderEvents(events) {
  const now = new Date();
  const todayEvents = events.filter((event) => isToday(event.start));
  const next = events.find((event) => event.start >= now);
  $("event-list").innerHTML = todayEvents.length ? todayEvents.map((event) => `<div class="event-item"><span class="event-time">${formatTime(event.start)}</span><span class="event-title">${event.title}</span></div>`).join("") : '<p class="empty-state">No hay eventos para hoy.</p>';
  $("next-event").innerHTML = next ? `<span class="next-event-label">Próximo evento</span><span class="next-event-title">${next.title}</span><span class="next-event-time">${formatDate(next.start.toISOString().slice(0, 10), { weekday: "long", day: "numeric", month: "long" })} · ${formatTime(next.start)}</span>` : '<span class="next-event-title">No hay próximos eventos</span>';
  $("calendar-status").textContent = "Calendario actualizado";
}
async function loadCalendar() {
  try {
    const response = await fetch(calendarUrl, { headers: { Accept: "text/calendar" } });
    if (!response.ok) throw new Error(`Calendar request failed: ${response.status}`);
    renderEvents(parseICS(await response.text()));
  } catch (error) {
    console.warn(error);
    $("event-list").innerHTML = '<p class="empty-state">No se ha podido cargar el calendario.</p>';
    $("next-event").innerHTML = '<span class="next-event-title">Abre el calendario para ver tus eventos</span>';
    $("calendar-status").innerHTML = 'Feed no disponible · <a href="webcal://p124-caldav.icloud.com/published/2/MjAzMzU2NjI4MzQyMDMzNSAK8sTVqXEK1jvzk1cNEZKfA-YZAffDBty1eYnb9Kg7ExY_d4umgmdwCRn17BEmME349yYakN5MTcGg2aqcToI">Añadir a tu calendario</a>';
  }
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
  $("sunrise").textContent = formatTime(data.daily.sunrise[0]); $("sunset").textContent = formatTime(data.daily.sunset[0]);
  $("data-status").textContent = isFallback ? "Datos de ejemplo · Actualiza para reconectar" : "La previsión se actualiza automáticamente";
  $("updated-label").textContent = isFallback ? "Datos sin conexión" : `Actualizado a las ${new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;

  $("hourly-forecast").innerHTML = data.hourly.time.slice(0, 12).map((time, i) => {
    const [text, icon] = description(data.hourly.weather_code[i]);
    return `<article class="hour-card"><p>${i === 0 ? "Ahora" : formatTime(time)}</p><span class="hour-icon" aria-label="${text}">${icon}</span><strong>${Math.round(data.hourly.temperature_2m[i])}°</strong><span class="rain-chance">${data.hourly.precipitation_probability[i]}% lluvia</span></article>`;
  }).join("");
  $("daily-forecast").innerHTML = data.daily.time.map((time, i) => {
    const date = new Date(`${time}T12:00:00`); const [text, icon] = description(data.daily.weather_code[i]);
    return `<article class="day-row ${i === 0 ? "today" : ""}"><div><span class="day-name">${i === 0 ? "Hoy" : shortDays[date.getDay()]}</span><span class="day-date"> · ${formatDate(time, { day: "numeric", month: "short" })}</span></div><span class="day-icon" aria-label="${text}">${icon}</span><span class="day-condition">${text}</span><span class="day-rain">${data.daily.precipitation_probability_max[i]}% lluvia</span><span class="day-temp"><strong>${Math.round(data.daily.temperature_2m_max[i])}°</strong><span>${Math.round(data.daily.temperature_2m_min[i])}°</span></span></article>`;
  }).join("");
}

async function loadWeather() {
  document.body.classList.add("is-loading"); $("refresh-button").setAttribute("aria-busy", "true");
  try {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
    render(await response.json());
  } catch (error) {
    console.warn(error); render(fallback, true); showToast("No se ha podido cargar la previsión — se muestran datos de ejemplo.");
  } finally {
    document.body.classList.remove("is-loading"); $("refresh-button").removeAttribute("aria-busy");
  }
}
function showToast(message) { const toast = $("toast"); toast.textContent = message; toast.classList.add("visible"); setTimeout(() => toast.classList.remove("visible"), 4500); }
$("refresh-button").addEventListener("click", loadWeather);
$("hourly-scroll-button").addEventListener("click", () => $("hourly-forecast").scrollBy({ left: 300, behavior: "smooth" }));
renderClasses();
loadCalendar();
render(fallback, true);
loadWeather();
