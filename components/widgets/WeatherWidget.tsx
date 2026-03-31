"use client";

import { useEffect, useState } from "react";
import { Wind, Thermometer, CloudOff, Loader } from "lucide-react";

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

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Default: Berlin (52.52, 13.41) — könnte später aus Firmendaten kommen
    fetch("https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true&wind_speed_unit=kmh")
      .then((r) => r.json())
      .then((data) => {
        const cw = data.current_weather;
        setWeather({ temp: Math.round(cw.temperature), windspeed: Math.round(cw.windspeed), weathercode: cw.weathercode });
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const info = weather ? getWeatherLabel(weather.weathercode) : null;

  return (
    <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#f5a62318", border: "1px solid #f5a62333" }}>
            <Thermometer size={16} style={{ color: "#f5a623" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Wetter</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>Berlin — aktuell</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#8b9ab5" }}>
          <Loader size={14} className="animate-spin" />
          Wird geladen...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#4a5568" }}>
          <CloudOff size={14} />
          Wetterdaten nicht verfügbar
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
              <Wind size={12} />
              {weather.windspeed} km/h
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#4a5568" }}>Wind</p>
          </div>
        </div>
      )}
    </div>
  );
}
