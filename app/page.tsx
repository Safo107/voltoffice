"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, Eye, EyeOff, Globe, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
        setError("E-Mail oder Passwort falsch.");
      } else if (msg.includes("user-not-found")) {
        setError("Kein Konto mit dieser E-Mail-Adresse gefunden.");
      } else if (msg.includes("too-many-requests")) {
        setError("Zu viele Versuche. Bitte warten Sie kurz.");
      } else {
        setError("Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
      router.replace("/dashboard");
    } catch {
      setError("Google-Anmeldung fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1b2e" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00c6ff", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0d1b2e" }}>
      {/* Links — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{
          background: "linear-gradient(135deg, #112240 0%, #0d1b2e 100%)",
          borderRight: "1px solid #1e3a5f",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)" }}
          >
            <Zap size={20} style={{ color: "#0d1b2e" }} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              VoltOffice
            </p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>
              by ElektroGenius
            </p>
          </div>
        </div>

        <div>
          <h1
            className="text-4xl font-bold mb-4 leading-tight"
            style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
          >
            Ihr Betrieb.
            <br />
            <span style={{ color: "#00c6ff" }}>Professionell</span>
            <br />
            verwaltet.
          </h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: "#8b9ab5" }}>
            Kundenverwaltung, Angebote, Projekte und Zeiterfassung
            — alles in einer Software für Ihren Elektrobetrieb.
          </p>

          <div className="space-y-3">
            {[
              "Kunden & Projekte verwalten",
              "Angebote & Rechnungen erstellen",
              "Zeiterfassung & Auswertungen",
              "VDE-Rechner & DATEV-Export",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "#00c6ff22", border: "1px solid #00c6ff44" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00c6ff" }} />
                </div>
                <span className="text-sm" style={{ color: "#8b9ab5" }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "#4a5568" }}>
          © 2026 ElektroGenius. Alle Rechte vorbehalten.
        </p>
      </div>

      {/* Rechts — Formular */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)" }}
            >
              <Zap size={20} style={{ color: "#0d1b2e" }} />
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                VoltOffice
              </p>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>by ElektroGenius</p>
            </div>
          </div>

          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
          >
            Anmelden
          </h2>
          <p className="text-sm mb-8" style={{ color: "#8b9ab5" }}>
            Willkommen zurück — bitte melden Sie sich an.
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold mb-6 transition-all disabled:opacity-50"
            style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#e6edf3" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6ff44"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
          >
            <Globe size={18} style={{ color: "#00c6ff" }} />
            Mit Google anmelden
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: "#1e3a5f" }} />
            <span className="text-xs" style={{ color: "#8b9ab5" }}>oder per E-Mail</span>
            <div className="flex-1 h-px" style={{ background: "#1e3a5f" }} />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {error && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "#ef444418", border: "1px solid #ef444433", color: "#ef4444" }}
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8b9ab5" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@musterbetrieb.de"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>
                Passwort
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8b9ab5" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#8b9ab5" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e6edf3"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#8b9ab5"; }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs transition-colors"
                style={{ color: "#00c6ff" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Passwort vergessen?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
            >
              {submitting ? "Wird angemeldet..." : "Anmelden"}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: "#8b9ab5" }}>
            Noch kein Konto?{" "}
            <button
              className="font-semibold transition-colors"
              style={{ color: "#00c6ff" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              Jetzt registrieren
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
