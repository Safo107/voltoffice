"use client";

import { useState, useEffect, useRef } from "react";
import { authFetch } from "@/lib/authFetch";
import { ChevronDown, User, Search } from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email?: string;
  city?: string;
}

interface CustomerSelectProps {
  value: string;
  onChange: (name: string, id?: string) => void;
  required?: boolean;
  placeholder?: string;
}

export default function CustomerSelect({ value, onChange, required, placeholder = "Kunde suchen oder eingeben…" }: CustomerSelectProps) {
  const [kunden, setKunden] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Kunden laden
  useEffect(() => {
    authFetch("/api/kunden")
      .then((r) => r.json())
      .then((d) => setKunden(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Wenn value von außen gesetzt wird (z.B. beim Bearbeiten)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Klick außerhalb schließt Dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = kunden.filter(
    (k) =>
      k.name.toLowerCase().includes(query.toLowerCase()) ||
      (k.email || "").toLowerCase().includes(query.toLowerCase()) ||
      (k.city || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value, undefined); // Freitext — keine customerId
    setOpen(true);
  };

  const handleSelect = (k: Customer) => {
    setQuery(k.name);
    onChange(k.name, k._id);
    setOpen(false);
  };

  const inputStyle = {
    background: "#0d1b2e",
    border: "1px solid #1e3a5f",
    color: "#e6edf3",
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <User
          size={15}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#8b9ab5",
            pointerEvents: "none",
          }}
        />
        <input
          ref={inputRef}
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={(e) => { setOpen(true); e.currentTarget.style.borderColor = "#00c6ff66"; }}
          placeholder={placeholder}
          className="w-full py-2.5 pl-9 pr-9 rounded-xl text-sm outline-none transition-all"
          style={inputStyle}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
          autoComplete="off"
        />
        <ChevronDown
          size={14}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            color: "#8b9ab5",
            pointerEvents: "none",
            transition: "transform 0.2s",
          }}
        />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#112240",
            border: "1px solid #1e3a5f",
            borderRadius: 12,
            zIndex: 50,
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {kunden.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: "#8b9ab5" }}>
              Keine Kunden vorhanden
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: "#8b9ab5" }}>
              Kein Treffer — Freitext wird gespeichert
            </div>
          ) : (
            filtered.slice(0, 8).map((k) => (
              <button
                key={k._id}
                type="button"
                onMouseDown={() => handleSelect(k)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                style={{ borderBottom: "1px solid #1e3a5f22" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,198,255,0.07)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "rgba(0,198,255,0.1)",
                    border: "1px solid rgba(0,198,255,0.2)",
                  }}
                >
                  <User size={13} style={{ color: "#00c6ff" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#e6edf3" }}>{k.name}</p>
                  {(k.email || k.city) && (
                    <p className="text-xs truncate" style={{ color: "#8b9ab5" }}>
                      {[k.city, k.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
