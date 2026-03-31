"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
    // GA aktivieren
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="max-w-2xl mx-auto rounded-xl p-5 shadow-2xl"
        style={{
          background: "#112240",
          border: "1px solid #1e3a5f",
          pointerEvents: "auto",
        }}
      >
        <p
          className="text-sm font-semibold mb-1"
          style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
        >
          Cookie-Einstellungen
        </p>
        <p className="text-xs mb-4" style={{ color: "#8b9ab5" }}>
          Wir verwenden Cookies für Google Analytics (Nutzungsstatistiken) und Firebase
          (Authentifizierung). Technisch notwendige Cookies sind immer aktiv.{" "}
          <Link
            href="/datenschutz"
            className="underline"
            style={{ color: "#00c6ff" }}
          >
            Datenschutz
          </Link>
        </p>
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #00c6ff, #0099cc)",
              color: "#fff",
            }}
          >
            Alle akzeptieren
          </button>
          <button
            onClick={decline}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: "#0d1b2e",
              border: "1px solid #1e3a5f",
              color: "#8b9ab5",
            }}
          >
            Ablehnen
          </button>
        </div>
      </div>
    </div>
  );
}
