/* ─────────────────────────────────────────────────
   Skycast — Weather App
   Uses OpenWeatherMap API (free tier).

   ⚠️  Replace the API_KEY below with your own key:
       https://openweathermap.org/api  (free sign-up)
   ───────────────────────────────────────────────── */

const API_KEY  = 'YOUR_API_KEY_HERE';   // ← Replace this
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/* ── DOM refs ─────────────────────────────────── */
const cityInput      = document.getElementById('cityInput');
const searchBtn      = document.getElementById('searchBtn');
const searchHint     = document.getElementById('searchHint');
const weatherCard    = document.getElementById('weatherCard');

const stateLoading   = document.getElementById('stateLoading');
const stateError     = document.getElementById('stateError');
const stateData      = document.getElementById('stateData');
const errorMsg       = document.getElementById('errorMsg');

const cityName       = document.getElementById('cityName');
const countryName    = document.getElementById('countryName');
const localTime      = document.getElementById('localTime');
const weatherIcon    = document.getElementById('weatherIcon');
const tempValue      = document.getElementById('tempValue');
const conditionLabel = document.getElementById('conditionLabel');
const feelsLike      = document.getElementById('feelsLike');
const humidity       = document.getElementById('humidity');
const windSpeed      = document.getElementById('windSpeed');
const visibility     = document.getElementById('visibility');
const pressure       = document.getElementById('pressure');
const sunrise        = document.getElementById('sunrise');
const sunset         = document.getElementById('sunset');

/* ── State helpers ────────────────────────────── */
function setState(state) {
  weatherCard.classList.remove('is-loading', 'is-error', 'is-data');
  if (state) weatherCard.classList.add(`is-${state}`);
}

/* ── Format helpers ───────────────────────────── */
function formatTime(unixUTC, offsetSec) {
  const ms = (unixUTC + offsetSec) * 1000;
  const d  = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function capitalise(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/* ── Fetch & render ───────────────────────────── */
async function fetchWeather(city) {
  if (!city.trim()) return;

  setState('loading');
  searchHint.textContent = '';

  try {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
      // Demo mode — surface a friendly warning instead of a hard error
      throw new Error(
        'No API key set. Add your free OpenWeatherMap key to script.js.'
      );
    }

    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    const res  = await fetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 404) throw new Error('City not found. Check the spelling and try again.');
      if (res.status === 401) throw new Error('Invalid API key. Update the API_KEY in script.js.');
      throw new Error(err.message || 'Something went wrong. Please try again.');
    }

    const data = await res.json();
    renderWeather(data);
    setState('data');

  } catch (err) {
    errorMsg.textContent = err.message;
    setState('error');
    searchHint.textContent = 'Try "Tokyo", "London", or "New York"';
  }
}

function renderWeather(d) {
  const tz = d.timezone; // seconds offset from UTC

  /* Location */
  cityName.textContent    = d.name;
  countryName.textContent = d.sys.country;
  localTime.textContent   = `Local time\n${formatTime(Math.floor(Date.now() / 1000), tz)}`;

  /* Icon */
  const iconCode = d.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIcon.alt = d.weather[0].description;

  /* Temps */
  tempValue.textContent    = Math.round(d.main.temp);
  conditionLabel.textContent = capitalise(d.weather[0].description);
  feelsLike.textContent    = `Feels like ${Math.round(d.main.feels_like)}°C`;

  /* Stats */
  humidity.textContent  = `${d.main.humidity}%`;
  windSpeed.textContent = `${Math.round(d.wind.speed)} m/s`;
  visibility.textContent = d.visibility >= 1000
    ? `${(d.visibility / 1000).toFixed(1)} km`
    : `${d.visibility} m`;
  pressure.textContent  = `${d.main.pressure} hPa`;

  /* Sun */
  sunrise.textContent = formatTime(d.sys.sunrise, tz);
  sunset.textContent  = formatTime(d.sys.sunset,  tz);
}

/* ── Events ───────────────────────────────────── */
searchBtn.addEventListener('click', () => {
  fetchWeather(cityInput.value);
});

cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') fetchWeather(cityInput.value);
});

/* Auto-focus search on load */
window.addEventListener('DOMContentLoaded', () => {
  cityInput.focus();
});
