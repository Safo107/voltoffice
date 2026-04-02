"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, Eye, EyeOff, Globe, AlertCircle, CheckCircle, User, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "register" | "reset";

function parseFirebaseError(msg: string): string {
  if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("invalid-password"))
    return "E-Mail oder Passwort falsch.";
  if (msg.includes("user-not-found"))
    return "Kein Konto mit dieser E-Mail-Adresse gefunden.";
  if (msg.includes("email-already-in-use"))
    return "Diese E-Mail-Adresse ist bereits registriert. Bitte einloggen.";
  if (msg.includes("weak-password"))
    return "Passwort zu schwach. Mindestens 6 Zeichen erforderlich.";
  if (msg.includes("too-many-requests"))
    return "Zu viele Versuche. Bitte warten Sie kurz und versuchen Sie es erneut.";
  if (msg.includes("unauthorized-domain"))
    return "Diese Domain ist in Firebase nicht autorisiert. Bitte Domain in Firebase Console hinzufügen.";
  if (msg.includes("invalid-api-key"))
    return "Firebase-Konfiguration fehlt. Bitte Umgebungsvariablen in Vercel prüfen.";
  if (msg.includes("popup-closed-by-user"))
    return "Anmeldung abgebrochen.";
  if (msg.includes("popup-blocked"))
    return "Popup wurde blockiert. Bitte Pop-ups für diese Seite erlauben.";
  if (msg.includes("network-request-failed"))
    return "Netzwerkfehler. Bitte Internetverbindung prüfen.";
  return "Fehler aufgetreten. Bitte versuchen Sie es erneut.";
}

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, loginWithEmail, loginWithGoogle, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        router.replace("/dashboard");
      } else if (mode === "register") {
        await register(email, password);
        router.replace("/dashboard");
      } else {
        await resetPassword(email);
        setSuccess("E-Mail zum Zurücksetzen wurde gesendet. Bitte prüfen Sie Ihr Postfach.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(parseFirebaseError(msg));
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(parseFirebaseError(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1b2e" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#00c6ff", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const inputBase = "w-full py-3 rounded-xl text-sm outline-none transition-all";
  const inputStyle = { background: "#112240", border: "1px solid #1e3a5f", color: "#e6edf3" };

  return (
    <div className="min-h-screen flex" style={{ background: "#0d1b2e" }}>
      {/* Left — Branding (Desktop only) */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: "linear-gradient(135deg, #112240 0%, #0d1b2e 100%)", borderRight: "1px solid #1e3a5f" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)" }}>
            <Zap size={20} style={{ color: "#0d1b2e" }} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>VoltOffice</p>
            <p className="text-xs" style={{ color: "#8b9ab5" }}>by ElektroGenius</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
            Ihr Betrieb.<br />
            <span style={{ color: "#00c6ff" }}>Professionell</span><br />
            verwaltet.
          </h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: "#8b9ab5" }}>
            Kundenverwaltung, Angebote, Projekte und Zeiterfassung — alles in einer Software für Ihren Elektrobetrieb.
          </p>
          <div className="space-y-3">
            {["Kunden & Projekte verwalten", "Angebote & Rechnungen erstellen", "Zeiterfassung & Auswertungen", "VDE-Rechner & DATEV-Export"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#00c6ff22", border: "1px solid #00c6ff44" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00c6ff" }} />
                </div>
                <span className="text-sm" style={{ color: "#8b9ab5" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs" style={{ color: "#4a5568" }}>
          <span>© 2026 ElektroGenius</span>
          <Link href="/impressum" className="transition-colors hover:text-[#8b9ab5]">Impressum</Link>
          <Link href="/datenschutz" className="transition-colors hover:text-[#8b9ab5]">Datenschutz</Link>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:p-8">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)" }}>
              <Zap size={20} style={{ color: "#0d1b2e" }} />
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>VoltOffice</p>
              <p className="text-xs" style={{ color: "#8b9ab5" }}>by ElektroGenius</p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
            {mode === "login" ? "Anmelden" : mode === "register" ? "Konto erstellen" : "Passwort zurücksetzen"}
          </h2>
          <p className="text-sm mb-8" style={{ color: "#8b9ab5" }}>
            {mode === "login" ? "Willkommen zurück — bitte melden Sie sich an." :
              mode === "register" ? "Kostenloses Konto anlegen und sofort loslegen." :
                "Wir senden Ihnen einen Reset-Link per E-Mail."}
          </p>

          {/* Google Button — nur bei login/register */}
          {mode !== "reset" && (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold mb-6 transition-all disabled:opacity-50"
                style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6ff44"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
              >
                <Globe size={18} style={{ color: "#00c6ff" }} />
                Mit Google {mode === "login" ? "anmelden" : "registrieren"}
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px" style={{ background: "#1e3a5f" }} />
                <span className="text-xs" style={{ color: "#8b9ab5" }}>oder per E-Mail</span>
                <div className="flex-1 h-px" style={{ background: "#1e3a5f" }} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback */}
            {error && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "#ef444418", border: "1px solid #ef444433", color: "#ef4444" }}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "#22c55e18", border: "1px solid #22c55e33", color: "#22c55e" }}>
                <CheckCircle size={15} className="shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            {/* E-Mail */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>E-Mail-Adresse</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8b9ab5" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@musterbetrieb.de"
                  required
                  className={`${inputBase} pl-10 pr-4`}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                />
              </div>
            </div>

            {/* Passwort — nicht bei reset */}
            {mode !== "reset" && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Passwort</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8b9ab5" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className={`${inputBase} pl-10 pr-10`}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#8b9ab5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#e6edf3"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#8b9ab5"; }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Passwort bestätigen — nur register */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Passwort bestätigen</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8b9ab5" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`${inputBase} pl-10 pr-4`}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                  />
                </div>
              </div>
            )}

            {/* Passwort vergessen — nur login */}
            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: "#00c6ff" }}
                >
                  Passwort vergessen?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
            >
              {submitting
                ? "Bitte warten..."
                : mode === "login" ? "Anmelden"
                : mode === "register" ? "Konto erstellen"
                : "Reset-Link senden"}
            </button>
          </form>

          {/* Switch Mode Links */}
          <div className="text-center text-xs mt-6 space-y-2">
            {mode === "login" && (
              <p style={{ color: "#8b9ab5" }}>
                Noch kein Konto?{" "}
                <button onClick={() => switchMode("register")} className="font-semibold hover:opacity-70 transition-opacity" style={{ color: "#00c6ff" }}>
                  Jetzt registrieren
                </button>
              </p>
            )}
            {mode === "register" && (
              <p style={{ color: "#8b9ab5" }}>
                Bereits registriert?{" "}
                <button onClick={() => switchMode("login")} className="font-semibold hover:opacity-70 transition-opacity" style={{ color: "#00c6ff" }}>
                  Einloggen
                </button>
              </p>
            )}
            {mode === "reset" && (
              <p style={{ color: "#8b9ab5" }}>
                <button onClick={() => switchMode("login")} className="font-semibold hover:opacity-70 transition-opacity" style={{ color: "#00c6ff" }}>
                  <ArrowLeft size={13} className="inline mr-1" />Zurück zur Anmeldung
                </button>
              </p>
            )}
            <p className="flex items-center justify-center gap-3 pt-1" style={{ color: "#4a5568" }}>
              <Link href="/impressum" className="hover:text-[#8b9ab5] transition-colors">Impressum</Link>
              <span>·</span>
              <Link href="/datenschutz" className="hover:text-[#8b9ab5] transition-colors">Datenschutz</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
