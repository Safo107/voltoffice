"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  User,
  Building,
  Bell,
  Shield,
  CreditCard,
  ChevronRight,
  Zap,
  Check,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const sections = [
  { id: "profil", label: "Profil & Betrieb", icon: <User size={16} />, color: "#00c6ff" },
  { id: "firma", label: "Firmendaten", icon: <Building size={16} />, color: "#f5a623" },
  { id: "benachrichtigungen", label: "Benachrichtigungen", icon: <Bell size={16} />, color: "#22c55e" },
  { id: "sicherheit", label: "Sicherheit", icon: <Shield size={16} />, color: "#8b9ab5" },
  { id: "abo", label: "Abo & Abrechnung", icon: <CreditCard size={16} />, color: "#f5a623" },
];

function SaveFeedback({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#22c55e" }}>
      <CheckCircle size={15} />
      Gespeichert
    </div>
  );
}

function inputStyle(focused = false) {
  return {
    background: "#0d1b2e",
    border: `1px solid ${focused ? "#00c6ff66" : "#1e3a5f"}`,
    color: "#e6edf3",
  };
}

export default function EinstellungenPage() {
  const router = useRouter();
  const [active, setActive] = useState("profil");

  // Profil
  const [companyName, setCompanyName] = useState("Musterbetrieb GmbH");
  const [email, setEmail] = useState("max@musterbetrieb.de");
  const [phone, setPhone] = useState("030 12345678");
  const [profilSaved, setProfilSaved] = useState(false);

  // Firmendaten
  const [firma, setFirma] = useState({
    name: "Musterbetrieb GmbH",
    ustId: "",
    handelsreg: "",
    street: "Musterstraße 1",
    zip: "10115",
    city: "Berlin",
    website: "",
  });
  const [firmaSaved, setFirmaSaved] = useState(false);

  // Benachrichtigungen
  const [notif, setNotif] = useState({
    email: true,
    newOffers: true,
    projectUpdates: false,
    paymentReminders: true,
    weeklyReport: false,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  // Sicherheit
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const save = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  const handlePwSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (pw.newPw.length < 8) { setPwError("Neues Passwort muss mindestens 8 Zeichen haben."); return; }
    if (pw.newPw !== pw.confirm) { setPwError("Passwörter stimmen nicht überein."); return; }
    setPw({ current: "", newPw: "", confirm: "" });
    save(setPwSaved);
  };

  return (
    <DashboardLayout title="Einstellungen" subtitle="Konto & Betrieb verwalten">
      <div className="flex gap-4">
        {/* Sidebar */}
        <div
          className="w-56 shrink-0 rounded-xl overflow-hidden"
          style={{ background: "#112240", border: "1px solid #1e3a5f", alignSelf: "flex-start" }}
        >
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all"
              style={{
                background: active === s.id ? "#00c6ff0f" : "transparent",
                borderLeft: active === s.id ? `3px solid ${s.color}` : "3px solid transparent",
                color: active === s.id ? "#e6edf3" : "#8b9ab5",
              }}
              onMouseEnter={(e) => {
                if (active !== s.id) {
                  e.currentTarget.style.background = "#ffffff08";
                  e.currentTarget.style.color = "#e6edf3";
                }
              }}
              onMouseLeave={(e) => {
                if (active !== s.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#8b9ab5";
                }
              }}
            >
              <span style={{ color: active === s.id ? s.color : "inherit" }}>{s.icon}</span>
              {s.label}
              {active === s.id && (
                <ChevronRight size={13} className="ml-auto" style={{ color: s.color }} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">

          {/* ── Profil ── */}
          {active === "profil" && (
            <div className="rounded-xl p-6" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <h2 className="text-base font-bold mb-5" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                Profil & Betrieb
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Firmenname", value: companyName, setter: setCompanyName },
                  { label: "E-Mail-Adresse", value: email, setter: setEmail, type: "email" },
                  { label: "Telefon", value: phone, setter: setPhone, type: "tel" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle()}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                    />
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-1">
                  <button
                    onClick={() => save(setProfilSaved)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
                  >
                    Änderungen speichern
                  </button>
                  <SaveFeedback visible={profilSaved} />
                </div>
              </div>
            </div>
          )}

          {/* ── Firmendaten ── */}
          {active === "firma" && (
            <div className="rounded-xl p-6" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <h2 className="text-base font-bold mb-5" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                Firmendaten
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Firmenname</label>
                  <input
                    value={firma.name}
                    onChange={(e) => setFirma({ ...firma, name: e.target.value })}
                    placeholder="Musterbetrieb GmbH"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={inputStyle()}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>USt-IdNr.</label>
                    <input
                      value={firma.ustId}
                      onChange={(e) => setFirma({ ...firma, ustId: e.target.value })}
                      placeholder="DE123456789"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={inputStyle()}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Handelsregister-Nr.</label>
                    <input
                      value={firma.handelsreg}
                      onChange={(e) => setFirma({ ...firma, handelsreg: e.target.value })}
                      placeholder="HRB 12345"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={inputStyle()}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Straße & Hausnummer</label>
                  <input
                    value={firma.street}
                    onChange={(e) => setFirma({ ...firma, street: e.target.value })}
                    placeholder="Musterstraße 1"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={inputStyle()}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>PLZ</label>
                    <input
                      value={firma.zip}
                      onChange={(e) => setFirma({ ...firma, zip: e.target.value })}
                      placeholder="10115"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={inputStyle()}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Stadt</label>
                    <input
                      value={firma.city}
                      onChange={(e) => setFirma({ ...firma, city: e.target.value })}
                      placeholder="Berlin"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={inputStyle()}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Webseite</label>
                  <input
                    value={firma.website}
                    onChange={(e) => setFirma({ ...firma, website: e.target.value })}
                    placeholder="https://musterbetrieb.de"
                    type="url"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={inputStyle()}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                  />
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <button
                    onClick={() => save(setFirmaSaved)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
                  >
                    Firmendaten speichern
                  </button>
                  <SaveFeedback visible={firmaSaved} />
                </div>
              </div>
            </div>
          )}

          {/* ── Benachrichtigungen ── */}
          {active === "benachrichtigungen" && (
            <div className="rounded-xl p-6" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
              <h2 className="text-base font-bold mb-5" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                Benachrichtigungen
              </h2>
              <div className="space-y-3">
                {[
                  { key: "email" as const, label: "E-Mail Benachrichtigungen", desc: "Allgemeine E-Mails zum Konto" },
                  { key: "newOffers" as const, label: "Neue Angebote", desc: "Benachrichtigung bei neuen Angeboten" },
                  { key: "projectUpdates" as const, label: "Projektupdates", desc: "Statusänderungen bei Projekten" },
                  { key: "paymentReminders" as const, label: "Zahlungserinnerungen", desc: "Offene Rechnungen & Fälligkeiten" },
                  { key: "weeklyReport" as const, label: "Wochenbericht", desc: "Zusammenfassung jeden Montag" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8b9ab5" }}>{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotif({ ...notif, [item.key]: !notif[item.key] })}
                      className="relative w-10 h-6 rounded-full transition-all shrink-0"
                      style={{ background: notif[item.key] ? "#22c55e" : "#1e3a5f" }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 rounded-full transition-all"
                        style={{
                          background: "#fff",
                          left: notif[item.key] ? "22px" : "2px",
                        }}
                      />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={() => save(setNotifSaved)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
                  >
                    Einstellungen speichern
                  </button>
                  <SaveFeedback visible={notifSaved} />
                </div>
              </div>
            </div>
          )}

          {/* ── Sicherheit ── */}
          {active === "sicherheit" && (
            <div className="space-y-4">
              <div className="rounded-xl p-6" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <h2 className="text-base font-bold mb-5" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                  Passwort ändern
                </h2>
                <form onSubmit={handlePwSave} className="space-y-4">
                  {[
                    { label: "Aktuelles Passwort", key: "current" as const, placeholder: "••••••••" },
                    { label: "Neues Passwort", key: "newPw" as const, placeholder: "Min. 8 Zeichen" },
                    { label: "Passwort bestätigen", key: "confirm" as const, placeholder: "Wiederholen" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>{f.label}</label>
                      <input
                        type="password"
                        value={pw[f.key]}
                        onChange={(e) => setPw({ ...pw, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={inputStyle()}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                      />
                    </div>
                  ))}
                  {pwError && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>{pwError}</p>
                  )}
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #8b9ab5, #6b7a9a)", color: "#0d1b2e" }}
                    >
                      Passwort ändern
                    </button>
                    <SaveFeedback visible={pwSaved} />
                  </div>
                </form>
              </div>

              <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "#e6edf3" }}>Zwei-Faktor-Authentifizierung</h3>
                <p className="text-xs mb-4" style={{ color: "#8b9ab5" }}>
                  Sichern Sie Ihr Konto mit einer zusätzlichen Verifikation beim Anmelden.
                </p>
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>Authenticator-App</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8b9ab5" }}>z.B. Google Authenticator, Authy</p>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "#1e3a5f", color: "#8b9ab5", border: "1px solid #2a4a6f" }}
                  >
                    Nicht aktiviert
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Abo ── */}
          {active === "abo" && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <h2 className="text-base font-bold mb-4" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                  Aktueller Plan
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                      Free
                    </p>
                    <p className="text-sm" style={{ color: "#8b9ab5" }}>
                      Kostenlos — max. 5 Kunden, 3 Angebote, 3 Projekte
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "#1e3a5f", color: "#8b9ab5" }}
                  >
                    Aktuell
                  </span>
                </div>
              </div>

              <div
                className="rounded-xl p-5"
                style={{ background: "linear-gradient(135deg, #f5a62310, #112240)", border: "1px solid #f5a62344" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={18} style={{ color: "#f5a623" }} />
                      <span className="text-xl font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                        Pro
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "#8b9ab5" }}>Alles unlimitiert + alle Pro-Features</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}>49 €</p>
                    <p className="text-xs" style={{ color: "#8b9ab5" }}>/Monat</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 mb-5">
                  {[
                    "Unbegrenzte Kunden",
                    "Unbegrenzte Angebote",
                    "Rechnungen erstellen",
                    "PDF-Export",
                    "DATEV-Export (CSV)",
                    "Mitarbeiterverwaltung",
                    "Zeiterfassung & Auswertungen",
                    "VDE-Rechner",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "#e6edf3" }}>
                      <Check size={12} style={{ color: "#22c55e" }} />
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push("/upgrade")}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
                >
                  Jetzt auf Pro upgraden
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
