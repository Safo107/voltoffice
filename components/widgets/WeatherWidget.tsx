"use client";

import { useEffect, useState, useRef } from "react";
import { Wind, Thermometer, CloudOff, Loader, Pencil, Check, X } from "lucide-react";

interface WeatherData {
  temp: number;
  windspeed: number;
  weathercode: number;
}

function getWeatherLabel(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: "Sonnig", emoji: "☀️" };
  if (code <= 2) return { label: "Leicht bewölkt", emoji: "🌤️" };
  if (code === 3) return { label: "Bewölkt", emoji: "☁️" };
  if (code <= 49) return { label: "Nebelig", emoji: "🌫️" };
  if (code <= 59) return { label: "Nieselregen", emoji: "🌦️" };
  if (code <= 69) return { label: "Regen", emoji: "🌧️" };
  if (code <= 79) return { label: "Schnee", emoji: "❄️" };
  if (code <= 84) return { label: "Regenschauer", emoji: "🌧️" };
  if (code <= 99) return { label: "Gewitter", emoji: "⛈️" };
  return { label: "Unbekannt", emoji: "🌡️" };
}

const DEFAULT_CITY = "Berlin";
const LS_KEY = "voltoffice_weather_city";

function loadCity(): string {
  if (typeof window === "undefined") return DEFAULT_CITY;
  return localStorage.getItem(LS_KEY) || DEFAULT_CITY;
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`
    );
    const data = await res.json();
    if (data.results?.length) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    }
  } catch { /* */ }
  return null;
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&wind_speed_unit=kmh`
  );
  const data = await res.json();
  const cw = data.current_weather;
  return { temp: Math.round(cw.temperature), windspeed: Math.round(cw.windspeed), weathercode: cw.weathercode };
}

export default function WeatherWidget() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftCity, setDraftCity] = useState(DEFAULT_CITY);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async (targetCity: string) => {
    setLoading(true);
    setError(null);
    setWeather(null);
    try {
      const coords = await geocodeCity(targetCity);
      if (!coords) { setError(`Stadt "${targetCity}" nicht gefunden`); setLoading(false); return; }
      const w = await fetchWeather(coords.lat, coords.lon);
      setWeather(w);
    } catch {
      setError("Wetterdaten nicht verfügbar");
    } finally {
      setLoading(false);
    }
  };

  // Beim Mount: Stadt aus localStorage laden und Wetter abrufen
  useEffect(() => {
    const c = loadCity();
    setCity(c);
    setDraftCity(c);
    load(c);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = () => { setDraftCity(city); setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); };

  const confirmEdit = () => {
    const trimmed = draftCity.trim();
    if (!trimmed) { setEditing(false); return; }
    setCity(trimmed);
    localStorage.setItem(LS_KEY, trimmed);
    setEditing(false);
    load(trimmed);
  };

  const cancelEdit = () => { setDraftCity(city); setEditing(false); };

  const info = weather ? getWeatherLabel(weather.weathercode) : null;

  return (
    <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f5a62318", border: "1px solid #f5a62333" }}>
            <Thermometer size={16} style={{ color: "#f5a623" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Wetter</p>
            {editing ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  ref={inputRef}
                  value={draftCity}
                  onChange={(e) => setDraftCity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
                  className="px-2 py-0.5 rounded text-xs outline-none w-28"
                  style={{ background: "#0d1b2e", border: "1px solid #00c6ff66", color: "#e6edf3" }}
                  placeholder="Stadtname"
                />
                <button onClick={confirmEdit} className="p-0.5 rounded" style={{ color: "#22c55e" }}><Check size={13} /></button>
                <button onClick={cancelEdit} className="p-0.5 rounded" style={{ color: "#8b9ab5" }}><X size={13} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <p className="text-xs truncate" style={{ color: "#8b9ab5" }}>{city} — aktuell</p>
                <button onClick={startEdit} className="p-0.5 rounded transition-all hover:opacity-70 shrink-0" style={{ color: "#8b9ab5" }} title="Stadt ändern">
                  <Pencil size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#8b9ab5" }}>
          <Loader size={14} className="animate-spin" /> Wird geladen...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#ef4444" }}>
          <CloudOff size={14} /> {error}
        </div>
      )}

      {weather && info && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{info.emoji}</span>
            <div>
              <p className="text-2xl font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                {weather.temp}°C
              </p>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>{info.label}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end text-xs" style={{ color: "#8b9ab5" }}>
              <Wind size={12} /> {weather.windspeed} km/h
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#4a5568" }}>Wind</p>
          </div>
        </div>
      )}
    </div>
  );
}
