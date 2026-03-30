const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const loader = document.getElementById("loader");
const weatherContent = document.getElementById("weatherContent");
const errorBox = document.getElementById("errorBox");
const forecastCards = document.getElementById("forecastCards");
const hourlyCards = document.getElementById("hourlyCards");
const recentSearchesEl = document.getElementById("recentSearches");

const themeToggle = document.getElementById("themeToggle");
const unitToggle = document.getElementById("unitToggle");

const locationNameEl = document.getElementById("locationName");
const todayDateEl = document.getElementById("todayDate");
const weatherIconEl = document.getElementById("weatherIcon");
const currentTempEl = document.getElementById("currentTemp");
const weatherDescEl = document.getElementById("weatherDesc");
const windSpeedEl = document.getElementById("windSpeed");
const humidityEl = document.getElementById("humidity");
const maxMinTempEl = document.getElementById("maxMinTemp");
const feelsLikeEl = document.getElementById("feelsLike");
const sunriseTimeEl = document.getElementById("sunriseTime");
const sunsetTimeEl = document.getElementById("sunsetTime");

const rainLayer = document.getElementById("rainLayer");
const lightningFlash = document.getElementById("lightningFlash");
const starsLayer = document.getElementById("starsLayer");

let currentUnit = "c";
let currentWeatherRaw = null;
let currentLocation = null;

const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "☀️", theme: "weather-clear" },
  1: { label: "Mainly clear", icon: "🌤️", theme: "weather-clear" },
  2: { label: "Partly cloudy", icon: "⛅", theme: "weather-clouds" },
  3: { label: "Overcast", icon: "☁️", theme: "weather-clouds" },
  45: { label: "Fog", icon: "🌫️", theme: "weather-clouds" },
  48: { label: "Fog", icon: "🌫️", theme: "weather-clouds" },
  51: { label: "Light drizzle", icon: "🌦️", theme: "weather-drizzle" },
  53: { label: "Moderate drizzle", icon: "🌦️", theme: "weather-drizzle" },
  55: { label: "Dense drizzle", icon: "🌧️", theme: "weather-rain" },
  61: { label: "Slight rain", icon: "🌦️", theme: "weather-rain" },
  63: { label: "Moderate rain", icon: "🌧️", theme: "weather-rain" },
  65: { label: "Heavy rain", icon: "🌧️", theme: "weather-rain" },
  71: { label: "Slight snow", icon: "🌨️", theme: "weather-snow" },
  73: { label: "Moderate snow", icon: "🌨️", theme: "weather-snow" },
  75: { label: "Heavy snow", icon: "❄️", theme: "weather-snow" },
  80: { label: "Rain showers", icon: "🌦️", theme: "weather-rain" },
  81: { label: "Moderate showers", icon: "🌧️", theme: "weather-rain" },
  82: { label: "Violent showers", icon: "⛈️", theme: "weather-thunder" },
  95: { label: "Thunderstorm", icon: "⛈️", theme: "weather-thunder" },
  96: { label: "Thunderstorm with hail", icon: "⛈️", theme: "weather-thunder" },
  99: { label: "Thunderstorm with heavy hail", icon: "⛈️", theme: "weather-thunder" },
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { label: "Unknown", icon: "🌍", theme: "weather-clear" };
}

function showLoader() {
  loader.classList.remove("hidden");
  weatherContent.classList.add("hidden");
  errorBox.classList.add("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  weatherContent.classList.add("hidden");
}

function cToF(c) {
  return (c * 9) / 5 + 32;
}

function formatTemp(tempC) {
  const value = currentUnit === "c" ? tempC : cToF(tempC);
  return `${Math.round(value)}°${currentUnit.toUpperCase()}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatShortDay(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { weekday: "short" });
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch location data.");

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Try another city.");
  }

  const place = data.results[0];
  return {
    name: place.name,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

async function getWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
    `&hourly=temperature_2m,weather_code` +
    `&timezone=auto&forecast_days=5`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch weather data.");
  return await response.json();
}

function saveRecentSearch(city) {
  const existing = JSON.parse(localStorage.getItem("recentCities")) || [];
  const updated = [city, ...existing.filter((item) => item.toLowerCase() !== city.toLowerCase())].slice(0, 6);
  localStorage.setItem("recentCities", JSON.stringify(updated));
  renderRecentSearches();
}

function renderRecentSearches() {
  const cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  recentSearchesEl.innerHTML = "";

  cities.forEach((city) => {
    const btn = document.createElement("button");
    btn.className = "history-chip";
    btn.type = "button";
    btn.textContent = city;
    btn.addEventListener("click", () => fetchAndRenderWeather(city));
    recentSearchesEl.appendChild(btn);
  });
}

function clearWeatherEffects() {
  rainLayer.innerHTML = "";
  starsLayer.innerHTML = "";
}

function createRain(count = 80) {
  rainLayer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.className = "raindrop";
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${0.7 + Math.random() * 0.7}s`;
    drop.style.animationDelay = `${Math.random() * 1.2}s`;
    drop.style.opacity = `${0.35 + Math.random() * 0.5}`;
    rainLayer.appendChild(drop);
  }
}

function createStars(count = 35) {
  starsLayer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 45}%`;
    star.style.animationDelay = `${Math.random() * 2}s`;
    starsLayer.appendChild(star);
  }
}

function triggerLightning() {
  lightningFlash.classList.remove("flash-active");
  void lightningFlash.offsetWidth;
  lightningFlash.classList.add("flash-active");
}

function setWeatherTheme(weatherCode, isDay = 1) {
  const weather = getWeatherInfo(weatherCode);
  document.body.classList.remove(
    "weather-clear",
    "weather-clouds",
    "weather-drizzle",
    "weather-rain",
    "weather-thunder",
    "weather-snow",
    "weather-night"
  );

  clearWeatherEffects();

  const themeClass = isDay ? weather.theme : "weather-night";
  document.body.classList.add(themeClass);

  if (!isDay) createStars();

  if (weather.theme === "weather-rain" || weather.theme === "weather-drizzle") {
    createRain(90);
  }

  if (weather.theme === "weather-thunder") {
    createRain(110);
    triggerLightning();
    setInterval(() => {
      if (document.body.classList.contains("weather-thunder")) {
        triggerLightning();
      }
    }, 5500);
  }
}

function renderCurrentWeather(location, weatherData) {
  const current = weatherData.current;
  const daily = weatherData.daily;
  const weather = getWeatherInfo(current.weather_code);

  locationNameEl.textContent = `${location.name}, ${location.country}`;
  todayDateEl.textContent = formatDate(new Date().toISOString());
  weatherIconEl.textContent = weather.icon;
  currentTempEl.textContent = formatTemp(current.temperature_2m);
  weatherDescEl.textContent = weather.label;
  windSpeedEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  humidityEl.textContent = `${current.relative_humidity_2m}%`;
  maxMinTempEl.textContent = `${formatTemp(daily.temperature_2m_max[0])} / ${formatTemp(daily.temperature_2m_min[0])}`;
  feelsLikeEl.textContent = formatTemp(current.apparent_temperature);
  sunriseTimeEl.textContent = formatTime(daily.sunrise[0]);
  sunsetTimeEl.textContent = formatTime(daily.sunset[0]);

  setWeatherTheme(current.weather_code, current.is_day);
}

function renderForecast(weatherData) {
  const daily = weatherData.daily;
  forecastCards.innerHTML = "";

  daily.time.forEach((date, index) => {
    const weather = getWeatherInfo(daily.weather_code[index]);

    const card = document.createElement("article");
    card.className = "forecast-card";
    card.innerHTML = `
      <p class="forecast-day">${formatShortDay(date)}</p>
      <div class="forecast-icon">${weather.icon}</div>
      <p class="forecast-temp">${formatTemp(daily.temperature_2m_max[index])} / ${formatTemp(daily.temperature_2m_min[index])}</p>
      <p class="forecast-desc">${weather.label}</p>
    `;
    forecastCards.appendChild(card);
  });
}

function renderHourly(weatherData) {
  const hourly = weatherData.hourly;
  hourlyCards.innerHTML = "";

  const currentHour = new Date().getHours();
  const today = new Date().toISOString().slice(0, 10);

  let count = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    const time = new Date(hourly.time[i]);
    const hour = time.getHours();
    const dateOnly = hourly.time[i].slice(0, 10);

    if (dateOnly === today && hour >= currentHour && count < 8) {
      const weather = getWeatherInfo(hourly.weather_code[i]);
      const card = document.createElement("div");
      card.className = "hour-card";
      card.innerHTML = `
        <p class="hour-time">${formatTime(hourly.time[i])}</p>
        <div class="hour-icon">${weather.icon}</div>
        <p class="hour-temp">${formatTemp(hourly.temperature_2m[i])}</p>
      `;
      hourlyCards.appendChild(card);
      count++;
    }
  }
}

function rerenderFromCurrentData() {
  if (!currentWeatherRaw || !currentLocation) return;
  renderCurrentWeather(currentLocation, currentWeatherRaw);
  renderForecast(currentWeatherRaw);
  renderHourly(currentWeatherRaw);
}

async function fetchAndRenderWeather(city) {
  try {
    showLoader();

    const location = await getCoordinates(city);
    const weatherData = await getWeather(location.latitude, location.longitude);

    currentLocation = location;
    currentWeatherRaw = weatherData;

    renderCurrentWeather(location, weatherData);
    renderForecast(weatherData);
    renderHourly(weatherData);
    saveRecentSearch(location.name);

    hideLoader();
    weatherContent.classList.remove("hidden");
  } catch (error) {
    hideLoader();
    showError(error.message || "Something went wrong.");
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  fetchAndRenderWeather(city);
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("theme-light");
  document.body.classList.toggle("theme-dark");
});

unitToggle.addEventListener("click", () => {
  currentUnit = currentUnit === "c" ? "f" : "c";
  rerenderFromCurrentData();
});

renderRecentSearches();
fetchAndRenderWeather("Phoenix");