const API_URL = "https://api.open-meteo.com/v1/forecast?latitude=37.3891&longitude=-5.9845&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Europe%2FMadrid";
const fallbackWeather = { temperature_2m: 27, apparent_temperature: 28, relative_humidity_2m: 55, weather_code: 2, wind_speed_10m: 11 };
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
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${API_URL}&_=${Date.now()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
      const data = await response.json();
      if (!data.current) throw new Error("Weather response did not contain current conditions");
      renderWeather(data.current);
      return;
    } catch (error) {
      console.warn(error);
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 700));
    } finally {
      clearTimeout(timeout);
    }
  }
  renderWeather(fallbackWeather);
  element("weather-updated").textContent = "Datos orientativos · reintentando conexión";
  element("weather-status").textContent = "Mostrando datos orientativos";
  setTimeout(loadWeather, 60000);
}
const todayLabel = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid", weekday: "long", day: "numeric", month: "long"
}).format(new Date());
element("today-date").textContent = todayLabel.charAt(0).toLocaleUpperCase("es-ES") + todayLabel.slice(1);
element("menu-toggle").addEventListener("click", () => {
  const panel = element("weekly-menu");
  const open = element("menu-toggle").getAttribute("aria-expanded") === "true";
  panel.hidden = open;
  element("menu-toggle").setAttribute("aria-expanded", String(!open));
  element("menu-toggle").innerHTML = open ? 'Ver toda la semana <span aria-hidden="true">↓</span>' : 'Ocultar menú semanal <span aria-hidden="true">↑</span>';
});
renderMenu();
loadWeather();
