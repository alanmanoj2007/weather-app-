/* ─────────────────────────────────────────────────
   Skycast — Weather App
   APIs used (NO key required, completely free):
     • Open-Meteo Geocoding  → city name → lat/lon
     • Open-Meteo Weather    → live weather data
   ───────────────────────────────────────────────── */

/* ── WMO weather code → label + emoji icon ─────── */
const WMO = {
  0:  { label: 'Clear Sky',           icon: '☀️'  },
  1:  { label: 'Mainly Clear',        icon: '🌤️'  },
  2:  { label: 'Partly Cloudy',       icon: '⛅'  },
  3:  { label: 'Overcast',            icon: '☁️'  },
  45: { label: 'Foggy',               icon: '🌫️'  },
  48: { label: 'Icy Fog',             icon: '🌫️'  },
  51: { label: 'Light Drizzle',       icon: '🌦️'  },
  53: { label: 'Drizzle',             icon: '🌦️'  },
  55: { label: 'Heavy Drizzle',       icon: '🌧️'  },
  61: { label: 'Light Rain',          icon: '🌧️'  },
  63: { label: 'Rain',                icon: '🌧️'  },
  65: { label: 'Heavy Rain',          icon: '🌧️'  },
  71: { label: 'Light Snow',          icon: '🌨️'  },
  73: { label: 'Snow',                icon: '❄️'  },
  75: { label: 'Heavy Snow',          icon: '❄️'  },
  77: { label: 'Snow Grains',         icon: '🌨️'  },
  80: { label: 'Light Showers',       icon: '🌦️'  },
  81: { label: 'Showers',             icon: '🌧️'  },
  82: { label: 'Heavy Showers',       icon: '⛈️'  },
  85: { label: 'Snow Showers',        icon: '🌨️'  },
  86: { label: 'Heavy Snow Showers',  icon: '❄️'  },
  95: { label: 'Thunderstorm',        icon: '⛈️'  },
  96: { label: 'Thunderstorm w/ Hail',icon: '⛈️'  },
  99: { label: 'Heavy Thunderstorm',  icon: '⛈️'  },
};

/* ── DOM refs ─────────────────────────────────── */
const cityInput      = document.getElementById('cityInput');
const searchBtn      = document.getElementById('searchBtn');
const searchHint     = document.getElementById('searchHint');
const weatherCard    = document.getElementById('weatherCard');
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

/* ── State ────────────────────────────────────── */
function setState(state) {
  weatherCard.classList.remove('is-loading', 'is-error', 'is-data');
  if (state) weatherCard.classList.add(`is-${state}`);
}

/* ── Helpers ──────────────────────────────────── */
function fmt12(timeStr) {
  // "HH:MM" → "HH:MM AM/PM"
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function localTimeNow(tzName) {
  try {
    return new Date().toLocaleTimeString('en-GB', {
      timeZone: tzName,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

/* ── Main fetch flow ──────────────────────────── */
async function fetchWeather(query) {
  if (!query.trim()) return;
  setState('loading');
  searchHint.textContent = '';

  try {
    /* Step 1 — Geocode city name → lat/lon */
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );
    if (!geoRes.ok) throw new Error('Geocoding service unavailable. Try again later.');

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found. Check the spelling and try again.');
    }

    const place = geoData.results[0];
    const { latitude, longitude, name, country, country_code, timezone } = place;

    /* Step 2 — Fetch weather from Open-Meteo */
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
      `weather_code,surface_pressure,wind_speed_10m,visibility` +
      `&daily=sunrise,sunset` +
      `&timezone=${encodeURIComponent(timezone)}` +
      `&forecast_days=1`
    );
    if (!weatherRes.ok) throw new Error('Weather service unavailable. Try again later.');

    const wData = await weatherRes.json();
    renderWeather(wData, { name, country, country_code, timezone });
    setState('data');

  } catch (err) {
    errorMsg.textContent = err.message;
    setState('error');
    searchHint.textContent = 'Try "Tokyo", "London", or "New York"';
  }
}

/* ── Render ───────────────────────────────────── */
function renderWeather(d, place) {
  const cur  = d.current;
  const day  = d.daily;
  const code = cur.weather_code;
  const wmo  = WMO[code] || { label: 'Unknown', icon: '🌡️' };

  /* Location */
  cityName.textContent    = place.name;
  countryName.textContent = `${place.country} (${place.country_code})`;
  localTime.textContent   = `Local time  ${localTimeNow(place.timezone)}`;

  /* Icon — render emoji in a canvas-free way via a styled span */
  weatherIcon.src = '';                        // clear any old img src
  weatherIcon.alt = wmo.label;
  weatherIcon.style.display = 'none';          // hide <img>

  // Use or create a sibling <span> for the emoji icon
  let emojiSpan = document.getElementById('weatherEmoji');
  if (!emojiSpan) {
    emojiSpan = document.createElement('span');
    emojiSpan.id = 'weatherEmoji';
    emojiSpan.style.cssText =
      'font-size:4.5rem;line-height:1;display:block;text-align:center;';
    weatherIcon.parentNode.insertBefore(emojiSpan, weatherIcon);
  }
  emojiSpan.textContent = wmo.icon;

  /* Temps */
  tempValue.textContent      = Math.round(cur.temperature_2m);
  conditionLabel.textContent = wmo.label;
  feelsLike.textContent      = `Feels like ${Math.round(cur.apparent_temperature)}°C`;

  /* Stats */
  humidity.textContent  = `${cur.relative_humidity_2m}%`;
  windSpeed.textContent = `${Math.round(cur.wind_speed_10m)} km/h`;

  const vis = cur.visibility;
  visibility.textContent = vis >= 1000
    ? `${(vis / 1000).toFixed(1)} km`
    : `${Math.round(vis)} m`;

  pressure.textContent = `${Math.round(cur.surface_pressure)} hPa`;

  /* Sun times — API returns "YYYY-MM-DDTHH:MM" local strings */
  const srRaw = day.sunrise[0]; // e.g. "2024-06-14T06:03"
  const ssRaw = day.sunset[0];
  sunrise.textContent = fmt12(srRaw.slice(11, 16));
  sunset.textContent  = fmt12(ssRaw.slice(11, 16));
}

/* ── Events ───────────────────────────────────── */
searchBtn.addEventListener('click', () => fetchWeather(cityInput.value));
cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') fetchWeather(cityInput.value);
});

window.addEventListener('DOMContentLoaded', () => {
  cityInput.focus();
  // Auto-load a default city for a nice first impression
  fetchWeather('Kerala');
});
