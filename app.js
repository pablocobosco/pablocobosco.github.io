const LOCATION = { latitude: 37.3891, longitude: -5.9845 };
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.latitude}&longitude=${LOCATION.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=Europe%2FMadrid&forecast_days=7`;

const fallback = {
  current: { temperature_2m: 28, apparent_temperature: 29, relative_humidity_2m: 42, precipitation: 0, weather_code: 0, wind_speed_10m: 12, wind_direction_10m: 270, is_day: 1 },
  hourly: { time: Array.from({ length: 24 }, (_, i) => new Date(Date.now() + i * 3600000).toISOString()), temperature_2m: [28, 27, 27, 26, 26, 27, 29, 31, 33, 35, 36, 37, 37, 36, 35, 34, 32, 31, 29, 28, 27, 26, 26, 25], precipitation_probability: Array(24).fill(1), weather_code: Array(24).fill(0) },
  daily: { time: Array.from({ length: 7 }, (_, i) => new Date(Date.now() + i * 86400000).toISOString().slice(0, 10)), temperature_2m_max: [37, 35, 34, 36, 38, 39, 37], temperature_2m_min: [20, 19, 18, 19, 21, 22, 20], weather_code: [0, 1, 2, 0, 1, 0, 2], precipitation_probability_max: [1, 5, 8, 2, 1, 0, 4], sunrise: ["2026-09-22T08:06", "2026-09-23T08:07"], sunset: ["2026-09-22T20:19", "2026-09-23T20:17"], uv_index_max: [6, 6, 6, 7, 7, 7, 6] }
};

const $ = (id) => document.getElementById(id);
const weatherDescriptions = { 0: ["Clear sky", "☀"], 1: ["Mainly clear", "☀"], 2: ["Partly cloudy", "◒"], 3: ["Overcast", "☁"], 45: ["Foggy", "≋"], 48: ["Rime fog", "≋"], 51: ["Light drizzle", "⌁"], 53: ["Drizzle", "⌁"], 55: ["Heavy drizzle", "⌁"], 61: ["Light rain", "☂"], 63: ["Rain", "☂"], 65: ["Heavy rain", "☂"], 71: ["Light snow", "❄"], 80: ["Rain showers", "☂"], 95: ["Thunderstorm", "ϟ"] };
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function description(code) { return weatherDescriptions[code] || ["Mixed conditions", "◒"]; }
function formatTime(value) { return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid" }).format(new Date(value)); }
function formatDate(value, options) { return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", ...options }).format(new Date(`${value}T12:00:00`)); }
function windDirection(degrees) { return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8]; }

function render(data, isFallback = false) {
  const current = data.current;
  const [condition, symbol] = description(current.weather_code);
  $("hero-date").textContent = formatDate(new Date().toISOString().slice(0, 10), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("current-symbol").textContent = symbol; $("current-temperature").textContent = Math.round(current.temperature_2m);
  $("current-condition").textContent = condition; $("feels-like").textContent = `${Math.round(current.apparent_temperature)}°`;
  $("humidity").textContent = `${current.relative_humidity_2m}%`; $("wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  $("wind-direction").textContent = `${windDirection(current.wind_direction_10m)} · ${current.wind_speed_10m < 20 ? "Light breeze" : "Breezy"}`;
  $("precipitation").textContent = `${Math.round(current.precipitation || 0)}%`;
  $("uv-index").innerHTML = `${Math.round(data.daily.uv_index_max[0])} <em>${data.daily.uv_index_max[0] > 5 ? "High" : "Moderate"}</em>`;
  $("sunrise").textContent = formatTime(data.daily.sunrise[0]); $("sunset").textContent = formatTime(data.daily.sunset[0]);
  $("data-status").textContent = isFallback ? "Showing sample data · Try refreshing to reconnect" : "Forecast updates automatically";
  $("updated-label").textContent = isFallback ? "Offline sample" : `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;

  $("hourly-forecast").innerHTML = data.hourly.time.slice(0, 12).map((time, i) => {
    const [text, icon] = description(data.hourly.weather_code[i]);
    return `<article class="hour-card"><p>${i === 0 ? "Now" : formatTime(time)}</p><span class="hour-icon" aria-label="${text}">${icon}</span><strong>${Math.round(data.hourly.temperature_2m[i])}°</strong><span class="rain-chance">${data.hourly.precipitation_probability[i]}% rain</span></article>`;
  }).join("");
  $("daily-forecast").innerHTML = data.daily.time.map((time, i) => {
    const date = new Date(`${time}T12:00:00`); const [text, icon] = description(data.daily.weather_code[i]);
    return `<article class="day-row ${i === 0 ? "today" : ""}"><div><span class="day-name">${i === 0 ? "Today" : shortDays[date.getDay()]}</span><span class="day-date"> · ${formatDate(time, { day: "numeric", month: "short" })}</span></div><span class="day-icon" aria-label="${text}">${icon}</span><span class="day-condition">${text}</span><span class="day-rain">${data.daily.precipitation_probability_max[i]}% rain</span><span class="day-temp"><strong>${Math.round(data.daily.temperature_2m_max[i])}°</strong><span>${Math.round(data.daily.temperature_2m_min[i])}°</span></span></article>`;
  }).join("");
}

async function loadWeather() {
  document.body.classList.add("is-loading"); $("refresh-button").setAttribute("aria-busy", "true");
  try {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
    render(await response.json());
  } catch (error) {
    console.warn(error); render(fallback, true); showToast("Could not reach the live forecast — showing sample data.");
  } finally {
    document.body.classList.remove("is-loading"); $("refresh-button").removeAttribute("aria-busy");
  }
}
function showToast(message) { const toast = $("toast"); toast.textContent = message; toast.classList.add("visible"); setTimeout(() => toast.classList.remove("visible"), 4500); }
$("refresh-button").addEventListener("click", loadWeather);
$("hourly-scroll-button").addEventListener("click", () => $("hourly-forecast").scrollBy({ left: 300, behavior: "smooth" }));
render(fallback, true);
loadWeather();
