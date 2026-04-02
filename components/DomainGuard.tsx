"use client";

import { useEffect, useState } from "react";

const CORRECT_HOST = "voltoffice.elektrogenius.de";

/**
 * Client-seitiger Sicherheitsnetz-Redirect für falsche Domains.
 * Die Middleware fängt *.vercel.app bereits serverseitig ab (301).
 * Diese Komponente greift als Fallback, falls ein Browser-Cache
 * oder ein direkter API-Aufruf die Middleware umgeht.
 */
export default function DomainGuard() {
  const [wrongDomain, setWrongDomain] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (host !== CORRECT_HOST && host !== "localhost" && host !== "127.0.0.1") {
      setWrongDomain(true);
      // Automatisch weiterleiten, Pfad + Query erhalten
      const correct = `https://${CORRECT_HOST}${window.location.pathname}${window.location.search}`;
      window.location.replace(correct);
    }
  }, []);

  if (!wrongDomain) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#0d1b2e", display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", gap: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#e6edf3", textAlign: "center", padding: 24,
      }}
    >
      <div style={{ fontSize: 32 }}>🔄</div>
      <p style={{ fontSize: 16, fontWeight: 700 }}>Weiterleitung…</p>
      <p style={{ fontSize: 13, color: "#8b9ab5", maxWidth: 320 }}>
        Du wirst auf{" "}
        <strong style={{ color: "#00c6ff" }}>voltoffice.elektrogenius.de</strong>{" "}
        weitergeleitet. Bitte aktualisiere dein Lesezeichen.
      </p>
      <a
        href={`https://${CORRECT_HOST}`}
        style={{ color: "#00c6ff", fontSize: 13, marginTop: 8 }}
      >
        Jetzt manuell öffnen →
      </a>
    </div>
  );
}
