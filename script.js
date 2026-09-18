// Antwerp, Belgium
const LATITUDE = 51.2194;
const LONGITUDE = 4.4025;
const TIMEZONE = "Europe/Brussels";

const API_URL =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
  `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m` +
  `&daily=precipitation_probability_max,precipitation_sum,temperature_2m_max,temperature_2m_min,weather_code` +
  `&timezone=${encodeURIComponent(TIMEZONE)}` +
  `&forecast_days=1`;

// WMO weather interpretation codes -> emoji + label
const WEATHER_CODES = {
  0: { icon: "☀️", label: "Clear sky" },
  1: { icon: "🌤️", label: "Mostly clear" },
  2: { icon: "⛅", label: "Partly cloudy" },
  3: { icon: "☁️", label: "Overcast" },
  45: { icon: "🌫️", label: "Foggy" },
  48: { icon: "🌫️", label: "Foggy" },
  51: { icon: "🌦️", label: "Light drizzle" },
  53: { icon: "🌦️", label: "Drizzle" },
  55: { icon: "🌧️", label: "Dense drizzle" },
  56: { icon: "🌧️", label: "Freezing drizzle" },
  57: { icon: "🌧️", label: "Freezing drizzle" },
  61: { icon: "🌦️", label: "Light rain" },
  63: { icon: "🌧️", label: "Rain" },
  65: { icon: "🌧️", label: "Heavy rain" },
  66: { icon: "🌧️", label: "Freezing rain" },
  67: { icon: "🌧️", label: "Freezing rain" },
  71: { icon: "🌨️", label: "Light snow" },
  73: { icon: "🌨️", label: "Snow" },
  75: { icon: "❄️", label: "Heavy snow" },
  77: { icon: "❄️", label: "Snow grains" },
  80: { icon: "🌦️", label: "Rain showers" },
  81: { icon: "🌧️", label: "Rain showers" },
  82: { icon: "⛈️", label: "Violent showers" },
  85: { icon: "🌨️", label: "Snow showers" },
  86: { icon: "🌨️", label: "Snow showers" },
  95: { icon: "⛈️", label: "Thunderstorm" },
  96: { icon: "⛈️", label: "Thunderstorm w/ hail" },
  99: { icon: "⛈️", label: "Thunderstorm w/ hail" },
};

const els = {
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  errorMessage: document.getElementById("error-message"),
  retryBtn: document.getElementById("retry-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  content: document.getElementById("content"),
  date: document.getElementById("date"),
  heroIcon: document.getElementById("hero-icon"),
  temp: document.getElementById("temp"),
  condition: document.getElementById("condition"),
  feelsLike: document.getElementById("feels-like"),
  minmax: document.getElementById("minmax"),
  adviceText: document.getElementById("advice-text"),
  rainIcon: document.getElementById("rain-icon"),
  rainValue: document.getElementById("rain-value"),
  rainSub: document.getElementById("rain-sub"),
  cardRain: document.getElementById("card-rain"),
  windIcon: document.getElementById("wind-icon"),
  windValue: document.getElementById("wind-value"),
  windSub: document.getElementById("wind-sub"),
  cardWind: document.getElementById("card-wind"),
  humidityIcon: document.getElementById("humidity-icon"),
  humidityValue: document.getElementById("humidity-value"),
  humiditySub: document.getElementById("humidity-sub"),
  cardHumidity: document.getElementById("card-humidity"),
  updatedAt: document.getElementById("updated-at"),
  themeToggle: document.getElementById("theme-toggle"),
  navToggle: document.getElementById("nav-toggle"),
  navClose: document.getElementById("nav-close"),
  navDrawer: document.getElementById("nav-drawer"),
  navBackdrop: document.getElementById("nav-backdrop"),
};

function getStoredTheme() {
  try {
    return localStorage.getItem("theme");
  } catch (e) {
    return null;
  }
}

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  els.themeToggle.textContent = isDark ? "☀️" : "🌙";
  els.themeToggle.setAttribute("aria-pressed", String(isDark));
  els.themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

function initTheme() {
  const stored = getStoredTheme();
  applyTheme(stored === "dark" || stored === "light" ? stored : systemPrefersDark() ? "dark" : "light");
}

function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}
}

function openNav() {
  els.navBackdrop.hidden = false;
  els.navDrawer.hidden = false;
  requestAnimationFrame(() => {
    els.navBackdrop.classList.add("open");
    els.navDrawer.classList.add("open");
  });
  els.navToggle.setAttribute("aria-expanded", "true");
  els.navToggle.setAttribute("aria-label", "Close menu");
}

function closeNav() {
  els.navBackdrop.classList.remove("open");
  els.navDrawer.classList.remove("open");
  els.navToggle.setAttribute("aria-expanded", "false");
  els.navToggle.setAttribute("aria-label", "Open menu");
  window.setTimeout(() => {
    els.navBackdrop.hidden = true;
    els.navDrawer.hidden = true;
  }, 250);
}

function isNavOpen() {
  return els.navDrawer.classList.contains("open");
}

function setDateHeading() {
  const today = new Date();
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIMEZONE,
  }).format(today);
  els.date.textContent = formatted;
}

function showState(state) {
  els.loading.hidden = state !== "loading";
  els.error.hidden = state !== "error";
  els.content.hidden = state !== "content";
}

function weatherInfo(code) {
  return WEATHER_CODES[code] || { icon: "🌡️", label: "Unknown" };
}

function classifyRain(probability, sumMm) {
  if (probability >= 60 || sumMm >= 3) {
    return { status: "alert", value: "Pack it", sub: `${probability}% chance of rain` };
  }
  if (probability >= 25 || sumMm > 0) {
    return { status: "warn", value: "Maybe", sub: `${probability}% chance of rain` };
  }
  return { status: "good", value: "Not needed", sub: `${probability}% chance of rain` };
}

function classifyWind(speedKmh, gustKmh) {
  let status, value;
  if (speedKmh >= 40) {
    status = "alert";
    value = "Very windy";
  } else if (speedKmh >= 20) {
    status = "warn";
    value = "Breezy";
  } else {
    status = "good";
    value = "Calm";
  }
  return { status, value, sub: `${Math.round(speedKmh)} km/h, gusts ${Math.round(gustKmh)}` };
}

function classifyHumidity(percent) {
  let status, value;
  if (percent >= 75) {
    status = "warn";
    value = "Humid";
  } else if (percent <= 35) {
    status = "warn";
    value = "Dry";
  } else {
    status = "good";
    value = "Comfortable";
  }
  return { status, value, sub: `${Math.round(percent)}% relative humidity` };
}

function buildAdvice({ rain, wind, humidity, tempNow, tempMin }) {
  const parts = [];

  if (rain.status === "alert") {
    parts.push("Bring a raincoat or umbrella");
  } else if (rain.status === "warn") {
    parts.push("Keep an umbrella within reach, just in case");
  }

  if (tempMin <= 8) {
    parts.push("layer up, it's chilly");
  } else if (tempNow >= 22) {
    parts.push("dress light, it's warm");
  }

  if (wind.status === "alert") {
    parts.push("a windproof jacket will help");
  } else if (wind.status === "warn") {
    parts.push("expect some wind");
  }

  if (parts.length === 0) {
    return "Nothing special today — dress comfortably and enjoy!";
  }

  const sentence = parts.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function renderWeather(data) {
  const current = data.current;
  const daily = data.daily;

  const info = weatherInfo(current.weather_code);
  els.heroIcon.textContent = info.icon;
  els.condition.textContent = info.label;
  els.temp.textContent = `${Math.round(current.temperature_2m)}°`;
  els.feelsLike.textContent = `Feels like ${Math.round(current.apparent_temperature)}°`;

  const tMax = Math.round(daily.temperature_2m_max[0]);
  const tMin = Math.round(daily.temperature_2m_min[0]);
  els.minmax.textContent = `H: ${tMax}°  L: ${tMin}°`;

  const rain = classifyRain(daily.precipitation_probability_max[0], daily.precipitation_sum[0]);
  els.rainValue.textContent = rain.value;
  els.rainSub.textContent = rain.sub;
  els.rainIcon.textContent = rain.status === "good" ? "☀️" : "☔";
  els.cardRain.className = `detail-card status-${rain.status}`;

  const wind = classifyWind(current.wind_speed_10m, current.wind_gusts_10m);
  els.windValue.textContent = wind.value;
  els.windSub.textContent = wind.sub;
  els.windIcon.textContent = wind.status === "good" ? "🍃" : "💨";
  els.cardWind.className = `detail-card status-${wind.status}`;

  const humidity = classifyHumidity(current.relative_humidity_2m);
  els.humidityValue.textContent = humidity.value;
  els.humiditySub.textContent = humidity.sub;
  els.humidityIcon.textContent = humidity.value === "Dry" ? "🏜️" : humidity.value === "Humid" ? "💧" : "😊";
  els.cardHumidity.className = `detail-card status-${humidity.status}`;

  els.adviceText.textContent = buildAdvice({
    rain,
    wind,
    humidity,
    tempNow: current.temperature_2m,
    tempMin: daily.temperature_2m_min[0],
  });

  const updated = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(new Date());
  els.updatedAt.textContent = `Updated at ${updated}`;
}

async function loadWeather() {
  showState("loading");
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Weather service responded with ${response.status}`);
    }
    const data = await response.json();
    renderWeather(data);
    showState("content");
  } catch (err) {
    els.errorMessage.textContent =
      err instanceof TypeError
        ? "Couldn't reach the weather service. Check your connection and try again."
        : "Something went wrong loading the weather. Please try again.";
    showState("error");
  }
}

els.retryBtn.addEventListener("click", loadWeather);
els.refreshBtn.addEventListener("click", loadWeather);
els.themeToggle.addEventListener("click", toggleTheme);

els.navToggle.addEventListener("click", () => (isNavOpen() ? closeNav() : openNav()));
els.navClose.addEventListener("click", closeNav);
els.navBackdrop.addEventListener("click", closeNav);
els.navDrawer.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isNavOpen()) {
    closeNav();
  }
});

initTheme();
setDateHeading();
loadWeather();
