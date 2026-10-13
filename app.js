document.addEventListener("DOMContentLoaded", () => {
    initPantherClock();
    setInterval(initPantherClock, 1000);
    
    fetchNasaData().catch(err => console.error("NASA module halted safely:", err));
    fetchEarthData().catch(err => console.error("NASA Earth imagery module halted safely:", err));
    fetchWeatherData().catch(err => console.error("Weather module halted safely:", err));
    
    updateSkiMetrics();
    setInterval(updateSkiMetrics, 10000);
});

function initPantherClock() {
    const clockEl = document.getElementById('panther-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString();
    }
}

async function fetchNasaData() {
    const container = document.getElementById('nasa-widget');
    if (!container) return;
    
    if (typeof CONFIG === 'undefined' || !CONFIG.NASA_API_KEY || CONFIG.NASA_API_KEY.includes("YOUR_NASA")) {
        container.innerHTML = "<div style='color:#b33030; font-size:11px;'>Configuration missing. Operating in standalone demo mode.</div>";
        return;
    }

    try {
        const url = new URL("https://science.nasa.gov/wp-json/wp/v2/apod-basic/");
        url.searchParams.set("api_key", CONFIG.NASA_API_KEY);
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const payload = await res.json();
        const items = Array.isArray(payload) ? payload : [payload];
        const today = new Date().toISOString().slice(0, 10);
        const data = items.find(item => item.date === today) ?? items[0];

        if (!data) {
            throw new Error("NASA returned no APOD items.");
        }

        container.replaceChildren();
        const title = document.createElement('a');
        title.href = data.permalink || data.url;
        title.target = "_blank";
        title.rel = "noopener noreferrer";
        title.textContent = data.title;
        title.style.cssText = "display:block; font-weight:bold; margin-bottom:4px; font-size:12px;";
        container.append(title);

        if (data.media_type === "image" && data.hdurl) {
            const imageUrl = new URL(data.hdurl);
            imageUrl.searchParams.set("w", "1200");
            imageUrl.searchParams.delete("h");
            imageUrl.searchParams.delete("fit");
            imageUrl.searchParams.delete("crop");

            const image = document.createElement('img');
            image.className = "nasa-img";
            image.src = imageUrl.href;
            image.alt = data.alt || data.title;
            image.loading = "eager";
            image.style.cssText = "max-width:100%; border-radius:4px; margin-top:5px; box-shadow:0 2px 8px rgba(0,0,0,0.2);";
            container.append(image);
        } else if (data.media_type === "video") {
            const note = document.createElement('div');
            note.textContent = "Today's APOD is a video. Open the title to view it.";
            container.append(note);
        }
    } catch (error) {
        console.error("NASA APOD request failed:", error);
        const message = error.message === "HTTP 429"
            ? "NASA APOD rate limit reached. Add a personal API key in config.js."
            : `Couldn't load NASA APOD (${error.message}).`;
        container.textContent = message;
        container.style.color = "#b33030";
    }
}

async function fetchEarthData() {
    const container = document.getElementById('earth-widget');
    if (!container) return;

    try {
        const response = await fetch("https://epic.gsfc.nasa.gov/api/natural");
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const images = await response.json();
        const latest = images[0];
        if (!latest) {
            throw new Error("NASA returned no Earth images.");
        }

        const [date] = latest.date.split(" ");
        const [year, month, day] = date.split("-");
        const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/jpg/${latest.image}.jpg`;
        const imageLink = document.createElement("a");
        imageLink.href = imageUrl;
        imageLink.target = "_blank";
        imageLink.rel = "noopener noreferrer";

        const image = document.createElement("img");
        image.className = "earth-widget-image";
        image.src = imageUrl;
        image.alt = `Earth from space, captured ${latest.date} UTC`;
        image.loading = "eager";
        imageLink.append(image);

        const timestamp = document.createElement("div");
        timestamp.textContent = `Captured ${latest.date} UTC`;

        container.replaceChildren(imageLink, timestamp);
    } catch (error) {
        console.error("NASA Earth imagery request failed:", error);
        container.textContent = `Couldn't load NASA Earth imagery (${error.message}).`;
        container.style.color = "#b33030";
    }
}

async function fetchWeatherData() {
    const container = document.getElementById('weather-widget');
    if (!container) return;

    try {
        const lat = "29.7604";
        const lon = "-95.3698";
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", lat);
        url.searchParams.set("longitude", lon);
        url.searchParams.set("current", "temperature_2m,relative_humidity_2m");
        url.searchParams.set("temperature_unit", "fahrenheit");
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather service offline.");
        const data = await res.json();
        
        if (data && data.current) {
            container.innerHTML = `
                <div class="metric-row"><span>Temperature:</span><span class="metric-val">${data.current.temperature_2m}°F</span></div>
                <div class="metric-row"><span>Humidity:</span><span class="metric-val">${data.current.relative_humidity_2m}%</span></div>
                <div class="metric-row"><span>Location Grid:</span><span class="metric-val">Houston, TX</span></div>
            `;
        }
    } catch(e) {
        container.innerHTML = "<div style='color:#b33030;'>Erro.</div>";
    }
}

function updateSkiMetrics() {
    const snow = document.getElementById('ski-snow');
    const fresh = document.getElementById('ski-fresh');
    
    if (!snow || !fresh) return;

    let baseSnow = Math.floor(Math.random() * 5) + 60;
    let freshSnow = Math.floor(Math.random() * 4);
    snow.innerText = baseSnow + '"';
    fresh.innerText = freshSnow + '"';
}
