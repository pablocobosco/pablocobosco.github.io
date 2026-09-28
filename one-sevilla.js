const API_URL = "https://api.open-meteo.com/v1/forecast?latitude=37.3891&longitude=-5.9845&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Europe%2FMadrid";
const weatherLabels = {
  0: ["Despejado", "☀"], 1: ["Mayormente despejado", "☀"], 2: ["Parcialmente nublado", "◒"],
  3: ["Nublado", "☁"], 45: ["Niebla", "≋"], 48: ["Niebla", "≋"], 51: ["Llovizna", "⌁"],
  53: ["Llovizna", "⌁"], 55: ["Llovizna intensa", "⌁"], 61: ["Lluvia ligera", "☂"],
  63: ["Lluvia", "☂"], 65: ["Lluvia intensa", "☂"], 71: ["Nieve", "❄"],
  80: ["Chubascos", "☂"], 95: ["Tormenta", "ϟ"]
};
const element = (id) => document.getElementById(id);
const weeklyMenu = window.oneSevillaWeeklyMenu;
const weekdays = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

function madridClock() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}
function renderMenu() {
  const clock = madridClock();
  const menu = weeklyMenu[weekdays[clock.weekday]];
  const isLunch = Number(clock.hour) < 14 || (Number(clock.hour) === 14 && Number(clock.minute) < 30);
  element("menu-range").textContent = window.oneSevillaMenuRange;
  if (!menu) {
    element("meal-kind").textContent = isLunch ? "COMIDA" : "CENA";
    element("meal-hours").textContent = isLunch ? "13:00 — 14:35" : "21:00 — 22:30";
    element("meal-day").textContent = "Menú no disponible";
    element("dish-list").innerHTML = "<li>El menú de hoy todavía no está publicado.</li>";
    element("weekly-grid").innerHTML = "";
    return;
  }
  element("meal-kind").textContent = isLunch ? "COMIDA" : "CENA";
  element("meal-hours").textContent = isLunch ? "13:00 — 14:35" : "21:00 — 22:30";
  element("meal-day").textContent = menu.day;
  element("dish-list").innerHTML = (isLunch ? menu.lunch : menu.dinner).map((dish) => `<li>${dish}</li>`).join("");
  element("weekly-grid").innerHTML = Object.values(weeklyMenu).map((day) =>
    `<article class="menu-day"><div class="menu-day-name">${day.day}</div><p class="menu-type">COMIDA</p>${day.lunch.map((dish) => `<div class="menu-item">${dish}</div>`).join("")}<p class="menu-type">CENA</p>${day.dinner.map((dish) => `<div class="menu-item">${dish}</div>`).join("")}</article>`
  ).join("");
}
function renderWeather(current) {
  const [label, icon] = weatherLabels[current.weather_code] || ["Tiempo variable", "◒"];
  element("temperature").textContent = Math.round(current.temperature_2m);
  element("weather-icon").textContent = icon;
  element("condition").textContent = label;
  element("feels-like").textContent = `${Math.round(current.apparent_temperature)}°`;
  element("humidity").textContent = `${Math.round(current.relative_humidity_2m)}%`;
  element("wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  element("weather-updated").textContent = `Actualizado a las ${new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
  element("weather-status").textContent = "Tiempo actualizado · Sevilla";
}
async function loadWeather() {
  try {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
    const data = await response.json();
    if (!data.current) throw new Error("Weather response did not contain current conditions");
    renderWeather(data.current);
  } catch (error) {
    console.warn(error);
    element("condition").textContent = "No se pudo cargar el tiempo";
    element("weather-updated").textContent = "Comprueba tu conexión";
    element("weather-status").textContent = "El tiempo no está disponible temporalmente";
  }
}
element("today-date").textContent = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid", weekday: "long", day: "numeric", month: "long"
}).format(new Date());
element("menu-toggle").addEventListener("click", () => {
  const panel = element("weekly-menu");
  const open = element("menu-toggle").getAttribute("aria-expanded") === "true";
  panel.hidden = open;
  element("menu-toggle").setAttribute("aria-expanded", String(!open));
  element("menu-toggle").innerHTML = open ? 'Ver toda la semana <span aria-hidden="true">↓</span>' : 'Ocultar menú semanal <span aria-hidden="true">↑</span>';
});
renderMenu();
loadWeather();
