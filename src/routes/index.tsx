import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Cloud,
  CloudRain,
  Compass,
  Droplets,
  Eye,
  Gauge,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Place = { name: string; country: string; latitude: number; longitude: number; timezone: string };
type Weather = {
  current: { time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; weather_code: number; wind_speed_10m: number; wind_direction_10m: number; surface_pressure: number; visibility: number; is_day: number };
  hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weather_code: number[] };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; sunrise: string[]; sunset: string[] };
};

const CODES: Record<number, string> = { 0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Heavy showers", 95: "Thunderstorm" };

function WeatherIcon({ code, className = "size-6" }: { code: number; className?: string }) {
  if ([0, 1].includes(code)) return <Sun className={`${className} text-sun`} />;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(code)) return <CloudRain className={`${className} text-primary`} />;
  return <Cloud className={`${className} text-sky-deep`} />;
}

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "SkyCast — Live Weather Anywhere" },
    { name: "description", content: "Search any city for live weather, hourly conditions, and a seven-day forecast." },
    { property: "og:title", content: "SkyCast — Live Weather Anywhere" },
    { property: "og:description", content: "Real-time global weather with clear hourly and seven-day forecasts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: WeatherDashboard,
});

function WeatherDashboard() {
  const [query, setQuery] = useState("New Delhi");
  const [place, setPlace] = useState<Place | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");

  async function loadCity(city: string) {
    const clean = city.trim();
    if (!clean) return;
    setLoading(true); setError("");
    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=1&language=en&format=json`);
      if (!geoResponse.ok) throw new Error("We couldn't reach the location service.");
      const geo = await geoResponse.json() as { results?: Place[] };
      const found = geo.results?.[0];
      if (!found) throw new Error(`We couldn't find “${clean}”. Try a nearby city.`);
      const params = new URLSearchParams({ latitude: String(found.latitude), longitude: String(found.longitude), current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,visibility", hourly: "temperature_2m,precipitation_probability,weather_code", daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset", timezone: "auto", forecast_days: "7" });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) throw new Error("Weather data is temporarily unavailable.");
      setPlace(found); setWeather(await response.json() as Weather); setUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (cause) {
      setWeather(null); setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadCity("New Delhi"); }, []);
  const submit = (event: FormEvent) => { event.preventDefault(); void loadCity(query); };

  const hourStart = weather ? Math.max(0, weather.hourly.time.findIndex((time) => time >= weather.current.time)) : 0;
  const hours = weather ? weather.hourly.time.slice(hourStart, hourStart + 8).map((time, index) => ({ time, temp: weather.hourly.temperature_2m[hourStart + index], rain: weather.hourly.precipitation_probability[hourStart + index], code: weather.hourly.weather_code[hourStart + index] })) : [];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground"><Cloud className="size-6" /></div><div><p className="font-display text-2xl leading-none text-sky-deep">SkyCast</p><p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">Live weather intelligence</p></div></div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex"><span className="size-2 rounded-full bg-success" />Live global data</div>
        </div>
      </header>

      <section className="border-b border-border bg-secondary/55">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
          <div className="mb-6 max-w-2xl"><p className="mb-2 text-xs font-bold uppercase text-primary">Accurate. Immediate. Anywhere.</p><h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">See your sky clearly.</h1><p className="mt-3 text-sm text-muted-foreground sm:text-base">Real-time conditions and a focused forecast for any city on Earth.</p></div>
          <form onSubmit={submit} className="flex max-w-3xl gap-2" role="search">
            <div className="relative flex-1"><MapPin className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search city" value={query} disabled={loading} onChange={(event) => setQuery(event.target.value)} placeholder="Search city, e.g. Tokyo" className="h-12 w-full rounded-md border border-input bg-card pl-12 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:opacity-60" /></div>
            <Button type="submit" disabled={loading} className="h-12"><Search className="size-4" /><span className="hidden sm:inline">{loading ? "Fetching…" : "Search"}</span></Button>
            <Button type="button" variant="outline" size="icon" className="h-12 w-12" title="Use current location" onClick={() => { navigator.geolocation?.getCurrentPosition(async ({ coords }) => { setLoading(true); setError(""); try { const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,visibility&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`); if (!r.ok) throw new Error(); setPlace({ name: "Your location", country: "", latitude: coords.latitude, longitude: coords.longitude, timezone: "auto" }); setWeather(await r.json() as Weather); setUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); } catch { setError("We couldn't load weather for your location."); } finally { setLoading(false); } }, () => setError("Location access was not available.")); }}><LocateFixed className="size-5" /></Button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
        {error && <div role="alert" className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">{error}</div>}
        {loading && !weather && <div className="grid min-h-[420px] place-items-center"><div className="text-center"><Cloud className="mx-auto size-12 animate-pulse text-primary" /><p className="mt-4 text-sm font-semibold text-muted-foreground">Reading the atmosphere…</p></div></div>}
        {weather && place && <div className={`weather-rise transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2"><MapPin className="size-4 text-primary" /><h2 className="text-xl font-bold">{place.name}{place.country ? `, ${place.country}` : ""}</h2></div><p className="mt-1 text-xs text-muted-foreground">Updated {updated} · {CODES[weather.current.weather_code] ?? "Current conditions"}</p></div><p className="text-xs font-medium text-muted-foreground">{place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°</p></div>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <section className="relative overflow-hidden rounded-lg bg-sky-deep p-6 text-primary-foreground shadow-lg sm:p-8">
              <div className="absolute -right-12 -top-12 size-52 rounded-full border-[36px] border-primary-foreground/10" />
              <div className="relative flex min-h-64 flex-col justify-between"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-primary-foreground/75">Right now</p><div className="mt-3 flex items-start"><span className="font-display text-8xl leading-none sm:text-9xl">{Math.round(weather.current.temperature_2m)}</span><span className="mt-2 text-3xl">°</span></div></div><WeatherIcon code={weather.current.weather_code} className="size-20 text-primary-foreground" /></div><div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-primary-foreground/20 pt-5 text-sm"><span>Feels like <strong>{Math.round(weather.current.apparent_temperature)}°</strong></span><span>High <strong>{Math.round(weather.daily.temperature_2m_max[0] ?? weather.current.temperature_2m)}°</strong></span><span>Low <strong>{Math.round(weather.daily.temperature_2m_min[0] ?? weather.current.temperature_2m)}°</strong></span></div></div>
            </section>

            <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border shadow-sm">
              <Metric icon={<Droplets />} label="Humidity" value={`${weather.current.relative_humidity_2m}%`} note="Relative humidity" />
              <Metric icon={<Wind />} label="Wind" value={`${Math.round(weather.current.wind_speed_10m)} km/h`} note={`${weather.current.wind_direction_10m}° direction`} />
              <Metric icon={<Gauge />} label="Pressure" value={`${Math.round(weather.current.surface_pressure)} hPa`} note="At surface" />
              <Metric icon={<Eye />} label="Visibility" value={`${Math.round(weather.current.visibility / 1000)} km`} note="Current range" />
            </section>
          </div>

          <section className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl">The next few hours</h2><span className="text-xs font-semibold text-muted-foreground">Local time</span></div><div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-8">{hours.map((hour, index) => <div key={hour.time} className="bg-card px-2 py-4 text-center"><p className="text-xs font-semibold text-muted-foreground">{index === 0 ? "Now" : new Date(hour.time).toLocaleTimeString([], { hour: "numeric" })}</p><WeatherIcon code={hour.code ?? 0} className="mx-auto my-3 size-6" /><p className="text-lg font-bold">{Math.round(hour.temp ?? 0)}°</p><p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-primary"><Droplets className="size-3" />{hour.rain ?? 0}%</p></div>)}</div></section>

          <section className="mt-7"><h2 className="mb-3 font-display text-2xl">7-day outlook</h2><div className="overflow-hidden rounded-lg border border-border bg-card">{weather.daily.time.map((day, index) => { const code = weather.daily.weather_code[index] ?? 0; return <div key={day} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border px-4 py-4 last:border-0 sm:grid-cols-[1.2fr_1fr_auto_auto]"><div><p className="font-semibold">{index === 0 ? "Today" : new Date(`${day}T12:00`).toLocaleDateString([], { weekday: "long" })}</p><p className="text-xs text-muted-foreground sm:hidden">{CODES[code] ?? "Current conditions"}</p></div><div className="hidden items-center gap-3 sm:flex"><WeatherIcon code={code} /><span className="text-sm text-muted-foreground">{CODES[code] ?? "Current conditions"}</span></div><span className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowDown className="size-3 text-primary" />{Math.round(weather.daily.temperature_2m_min[index] ?? 0)}°</span><span className="flex items-center gap-1 font-bold"><ArrowUp className="size-3 text-destructive" />{Math.round(weather.daily.temperature_2m_max[index] ?? 0)}°</span></div>; })}</div></section>

          <section className="mt-7 grid gap-4 sm:grid-cols-3"><MiniFact icon={<Sunrise />} label="Sunrise" value={weather.daily.sunrise[0] ? new Date(weather.daily.sunrise[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} /><MiniFact icon={<Sunset />} label="Sunset" value={weather.daily.sunset[0] ? new Date(weather.daily.sunset[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} /><MiniFact icon={<Compass />} label="Wind bearing" value={`${weather.current.wind_direction_10m}°`} /></section>
        </div>}
      </div>
      <footer className="mt-8 border-t border-border px-5 py-6 text-center text-xs text-muted-foreground">Live atmospheric data from Open-Meteo · SkyCast</footer>
    </main>
  );
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <div className="bg-card p-5"><div className="mb-5 flex size-9 items-center justify-center rounded-md bg-secondary text-primary [&>svg]:size-5">{icon}</div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></div>; }
function MiniFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"><div className="text-primary [&>svg]:size-6">{icon}</div><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="font-bold">{value}</p></div></div>; }
