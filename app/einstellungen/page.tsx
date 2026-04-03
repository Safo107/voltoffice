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
  KeyRound,
  Copy,
  AlertCircle,
  Loader,
  Users,
  UserPlus,
  Crown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePro } from "@/context/ProContext";
import { authFetch } from "@/lib/authFetch";

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
  const { user } = useAuth();
  const { isPro, isTrial, trialDaysLeft, tier, loadingPro, hasStripeCustomer, lastPaymentFailed, proSince, refreshPro } = usePro();
  const [active, setActive] = useState("profil");
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  // Profil
  const [companyName, setCompanyName] = useState("Musterbetrieb GmbH");
  const [email, setEmail] = useState("max@musterbetrieb.de");
  const [phone, setPhone] = useState("030 12345678");
  const [profilSaved, setProfilSaved] = useState(false);

  // Firmendaten
  const [firma, setFirma] = useState({
    name: "",
    ustId: "",
    handelsreg: "",
    street: "",
    zip: "",
    city: "",
    website: "",
    phone: "",
    companyEmail: "",
  });
  const [firmaSaved, setFirmaSaved] = useState(false);
  const [firmaLoading, setFirmaLoading] = useState(false);
  const [firmaLogo, setFirmaLogo] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [firmaError, setFirmaError] = useState("");
  const [logoError, setLogoError] = useState("");

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

  // 2FA State
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState<"idle" | "setup" | "confirm" | "backupCodes" | "disable">("idle");
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaQr, setTwoFaQr] = useState("");
  const [twoFaToken, setTwoFaToken] = useState("");
  const [twoFaError, setTwoFaError] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableToken, setDisableToken] = useState("");

  const openPortal = async () => {
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await authFetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: `${window.location.origin}/einstellungen` }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(data.error || "Verbindung zum Zahlungsanbieter fehlgeschlagen.");
      }
    } catch {
      setPortalError("Netzwerkfehler – bitte Internetverbindung prüfen und erneut versuchen.");
    } finally {
      setPortalLoading(false);
    }
  };

  // portalError auto-dismiss
  useEffect(() => {
    if (!portalError) return;
    const t = setTimeout(() => setPortalError(""), 8000);
    return () => clearTimeout(t);
  }, [portalError]);

  // Firmendaten laden
  useEffect(() => {
    if (!user) return;
    authFetch("/api/settings/company")
      .then((r) => r.json())
      .then((d) => {
        setFirma({
          name:         d.companyName    || "",
          ustId:        d.vatId          || "",
          handelsreg:   d.taxNumber      || "",
          street:       d.companyAddress || "",
          zip:          d.companyZip     || "",
          city:         d.companyCity    || "",
          website:      d.companyWebsite || "",
          phone:        d.companyPhone   || "",
          companyEmail: d.companyEmail   || "",
        });
        setFirmaLogo(d.companyLogoBase64 || null);
      })
      .catch(() => {});
  }, [user]);

  const saveFirma = async () => {
    setFirmaLoading(true);
    try {
      await authFetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName:    firma.name,
          companyAddress: firma.street,
          companyZip:     firma.zip,
          companyCity:    firma.city,
          companyPhone:   firma.phone,
          companyEmail:   firma.companyEmail,
          companyWebsite: firma.website,
          taxNumber:      firma.handelsreg,
          vatId:          firma.ustId,
        }),
      });
      save(setFirmaSaved);
    } catch {
      setFirmaError("Speichern fehlgeschlagen.");
    } finally {
      setFirmaLoading(false);
    }
  };

  const uploadLogo = async (file: File) => {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await authFetch("/api/upload/logo", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setFirmaLogo(data.logoUrl);
        setLogoError("");
      } else {
        setLogoError(data.error || "Upload fehlgeschlagen.");
      }
    } catch {
      setLogoError("Upload fehlgeschlagen.");
    } finally {
      setLogoUploading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetch(`/api/2fa/check?uid=${user.uid}`)
        .then((r) => r.json())
        .then((d) => setTwoFaEnabled(d.enabled))
        .catch(() => {});
    }
  }, [user]);

  const start2FASetup = async () => {
    if (!user) return;
    setTwoFaLoading(true);
    setTwoFaError("");
    try {
      const res = await fetch("/api/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
      const data = await res.json();
      setTwoFaSecret(data.secret);
      setTwoFaQr(data.qrCode);
      setTwoFaStep("setup");
    } catch {
      setTwoFaError("Fehler beim Setup. Bitte erneut versuchen.");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const confirm2FA = async () => {
    if (!user) return;
    setTwoFaLoading(true);
    setTwoFaError("");
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, secret: twoFaSecret, token: twoFaToken }),
      });
      const data = await res.json();
      if (!res.ok) { setTwoFaError(data.error); return; }
      setBackupCodes(data.backupCodes);
      setTwoFaEnabled(true);
      setTwoFaStep("backupCodes");
      setTwoFaToken("");
    } catch {
      setTwoFaError("Fehler bei der Verifikation.");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!user) return;
    setTwoFaLoading(true);
    setTwoFaError("");
    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, token: disableToken }),
      });
      const data = await res.json();
      if (!res.ok) { setTwoFaError(data.error); return; }
      setTwoFaEnabled(false);
      setTwoFaStep("idle");
      setDisableToken("");
    } catch {
      setTwoFaError("Fehler beim Deaktivieren.");
    } finally {
      setTwoFaLoading(false);
    }
  };

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
      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar / Tab-Nav */}
        <div
          className="md:w-56 md:shrink-0 rounded-xl overflow-hidden"
          style={{ background: "#112240", border: "1px solid #1e3a5f", alignSelf: "flex-start" }}
        >
          {/* Mobile: horizontal scroll tabs */}
          <div className="flex md:flex-col overflow-x-auto md:overflow-visible" style={{ scrollbarWidth: "none" }}>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 text-xs md:text-sm transition-all shrink-0 md:w-full"
              style={{
                background: active === s.id ? "#00c6ff0f" : "transparent",
                borderLeft: active === s.id ? `3px solid ${s.color}` : "3px solid transparent",
                color: active === s.id ? "#e6edf3" : "#8b9ab5",
                whiteSpace: "nowrap",
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
                <ChevronRight size={13} className="ml-auto hidden md:block" style={{ color: s.color }} />
              )}
            </button>
          ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

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
            <div className="space-y-4">
              {/* Logo */}
              <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: "#e6edf3" }}>Firmenlogo</h3>
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center rounded-xl overflow-hidden shrink-0"
                    style={{ width: 80, height: 80, background: "#0d1b2e", border: "1px solid #1e3a5f" }}
                  >
                    {firmaLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={firmaLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      <Building size={28} style={{ color: "#1e3a5f" }} />
                    )}
                  </div>
                  <div>
                    <label
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:opacity-90"
                      style={{ background: firmaLogo ? "#1e3a5f" : "linear-gradient(135deg, #00c6ff, #0099cc)", color: firmaLogo ? "#8b9ab5" : "#0d1b2e", display: "inline-flex" }}
                    >
                      {logoUploading ? <Loader size={14} className="animate-spin" /> : <Building size={14} />}
                      {logoUploading ? "Wird hochgeladen…" : firmaLogo ? "Logo ändern" : "Logo hochladen"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }}
                      />
                    </label>
                    <p className="text-xs mt-1.5" style={{ color: "#4a5568" }}>PNG, JPG oder WebP · max. 200 KB</p>
                    {logoError && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{logoError}</p>}
                    {firmaLogo && (
                      <button
                        onClick={async () => {
                          await authFetch("/api/settings/company", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ companyLogoBase64: "" }),
                          });
                          setFirmaLogo(null);
                        }}
                        className="text-xs mt-1 transition-all"
                        style={{ color: "#ef4444" }}
                      >
                        Logo entfernen
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stammdaten */}
              <div className="rounded-xl p-6" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <h3 className="text-sm font-semibold mb-5" style={{ color: "#e6edf3" }}>Stammdaten</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Firmenname *</label>
                    <input value={firma.name} onChange={(e) => setFirma({ ...firma, name: e.target.value })}
                      placeholder="Muster Elektro GmbH" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={inputStyle()} onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>E-Mail</label>
                      <input type="email" value={firma.companyEmail} onChange={(e) => setFirma({ ...firma, companyEmail: e.target.value })}
                        placeholder="info@musterbetrieb.de" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={inputStyle()} onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Telefon</label>
                      <input type="tel" value={firma.phone} onChange={(e) => setFirma({ ...firma, phone: e.target.value })}
                        placeholder="030 12345678" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={inputStyle()} onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Straße & Hausnummer</label>
                    <input value={firma.street} onChange={(e) => setFirma({ ...firma, street: e.target.value })}
                      placeholder="Musterstraße 1" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={inputStyle()} onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>PLZ</label>
                      <input value={firma.zip} onChange={(e) => setFirma({ ...firma, zip: e.target.value })}
                        placeholder="10115" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={inputStyle()} onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Stadt</label>
                      <input value={firma.city} onChange={(e) => setFirma({ ...firma, city: e.target.value })}
                        placeholder="Berlin" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={inputStyle()} onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>USt-IdNr.</label>
                      <input value={firma.ustId} onChange={(e) => setFirma({ ...firma, ustId: e.target.value })}
                        placeholder="DE123456789" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={inputStyle()} onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Steuernummer</label>
                      <input value={firma.handelsreg} onChange={(e) => setFirma({ ...firma, handelsreg: e.target.value })}
                        placeholder="12/345/67890" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={inputStyle()} onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>Webseite</label>
                    <input type="url" value={firma.website} onChange={(e) => setFirma({ ...firma, website: e.target.value })}
                      placeholder="https://musterbetrieb.de" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={inputStyle()} onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }} />
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={saveFirma}
                      disabled={firmaLoading}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
                    >
                      {firmaLoading && <Loader size={14} className="animate-spin" />}
                      Firmendaten speichern
                    </button>
                    <SaveFeedback visible={firmaSaved} />
                    {firmaError && <p className="text-xs" style={{ color: "#ef4444" }}>{firmaError}</p>}
                  </div>
                </div>
              </div>

              {/* Firmenmitglieder */}
              <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={15} style={{ color: "#8b9ab5" }} />
                    <h3 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>Firmenmitglieder</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#1e3a5f", color: "#8b9ab5" }}>
                      1 Mitglied
                    </span>
                  </div>
                  {tier === "business" ? (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
                    >
                      <UserPlus size={12} />
                      Einladen
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/upgrade")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "#1e3a5f", color: "#8b9ab5", border: "1px solid #2a4a6f" }}
                    >
                      <Crown size={11} />
                      Business
                    </button>
                  )}
                </div>

                {/* Owner row */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #00c6ff22, #00c6ff11)", border: "1px solid #00c6ff33", color: "#00c6ff" }}
                  >
                    {(user?.displayName || user?.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#e6edf3" }}>
                      {user?.displayName || user?.email?.split("@")[0] || "Inhaber"}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#8b9ab5" }}>{user?.email || ""}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                    style={{ background: "rgba(245,166,35,0.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.2)" }}>
                    Inhaber
                  </span>
                </div>

                {tier !== "business" && (
                  <p className="text-xs mt-3 text-center" style={{ color: "#4a5568" }}>
                    Mit dem <button onClick={() => router.push("/upgrade")} className="underline" style={{ color: "#8b9ab5" }}>Business-Plan</button> kannst du Mitarbeiter einladen und Zugriffsrechte vergeben.
                  </p>
                )}
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>Zwei-Faktor-Authentifizierung (2FA)</h3>
                    <p className="text-xs mt-1" style={{ color: "#8b9ab5" }}>
                      TOTP — Google Authenticator, Authy, etc.
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${twoFaEnabled ? "" : ""}`}
                    style={twoFaEnabled
                      ? { background: "#22c55e18", color: "#22c55e", border: "1px solid #22c55e33" }
                      : { background: "#1e3a5f", color: "#8b9ab5", border: "1px solid #2a4a6f" }}>
                    {twoFaEnabled ? "Aktiv" : "Nicht aktiviert"}
                  </span>
                </div>

                {twoFaError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-3 text-xs"
                    style={{ background: "#ef444418", border: "1px solid #ef444433", color: "#ef4444" }}>
                    <AlertCircle size={13} />{twoFaError}
                  </div>
                )}

                {/* IDLE: Status + Action */}
                {twoFaStep === "idle" && (
                  <div className="flex gap-2 flex-wrap">
                    {!twoFaEnabled ? (
                      <button onClick={start2FASetup} disabled={twoFaLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
                        {twoFaLoading ? <Loader size={14} className="animate-spin" /> : <Shield size={14} />}
                        2FA aktivieren
                      </button>
                    ) : (
                      <button onClick={() => { setTwoFaStep("disable"); setTwoFaError(""); setDisableToken(""); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                        style={{ background: "#ef444418", color: "#ef4444", border: "1px solid #ef444433" }}>
                        <Shield size={14} />2FA deaktivieren
                      </button>
                    )}
                  </div>
                )}

                {/* SETUP: QR Code anzeigen */}
                {twoFaStep === "setup" && twoFaQr && (
                  <div className="space-y-4">
                    <p className="text-xs" style={{ color: "#8b9ab5" }}>
                      Scanne den QR-Code mit deiner Authenticator-App (Google Authenticator, Authy).
                    </p>
                    <div className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={twoFaQr} alt="QR Code" className="rounded-xl" style={{ width: 180, height: 180, background: "#fff", padding: 8 }} />
                    </div>
                    <div className="p-3 rounded-xl text-xs font-mono break-all text-center"
                      style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
                      {twoFaSecret}
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(twoFaSecret); }}
                      className="flex items-center gap-1.5 text-xs mx-auto transition-opacity hover:opacity-70"
                      style={{ color: "#4a6fa5" }}>
                      <Copy size={12} />Schlüssel kopieren
                    </button>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b9ab5" }}>
                        Code aus Authenticator-App eingeben
                      </label>
                      <input
                        type="text"
                        value={twoFaToken}
                        onChange={(e) => setTwoFaToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl text-center text-xl font-mono tracking-widest outline-none"
                        style={inputStyle()}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#00c6ff66"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setTwoFaStep("idle")}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
                        Abbrechen
                      </button>
                      <button onClick={confirm2FA} disabled={twoFaToken.length !== 6 || twoFaLoading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                        {twoFaLoading ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                        Bestätigen & aktivieren
                      </button>
                    </div>
                  </div>
                )}

                {/* BACKUP CODES */}
                {twoFaStep === "backupCodes" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
                      style={{ background: "#22c55e18", border: "1px solid #22c55e33", color: "#22c55e" }}>
                      <CheckCircle size={13} />2FA erfolgreich aktiviert!
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "#e6edf3" }}>
                        Backup-Codes — nur einmal angezeigt!
                      </p>
                      <p className="text-xs mb-3" style={{ color: "#8b9ab5" }}>
                        Speichere diese Codes sicher. Jeder Code kann einmalig verwendet werden, falls du keinen Zugriff auf deine Authenticator-App hast.
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 p-3 rounded-xl"
                        style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                        {backupCodes.map((code) => (
                          <span key={code} className="text-xs font-mono text-center py-1.5 rounded-lg px-2"
                            style={{ background: "#112240", color: "#00c6ff", border: "1px solid #1e3a5f" }}>
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(backupCodes.join("\n"))}
                      className="flex items-center gap-1.5 text-xs mx-auto transition-opacity hover:opacity-70"
                      style={{ color: "#4a6fa5" }}>
                      <Copy size={12} />Alle Codes kopieren
                    </button>
                    <button onClick={() => setTwoFaStep("idle")}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}>
                      Fertig
                    </button>
                  </div>
                )}

                {/* DISABLE */}
                {twoFaStep === "disable" && (
                  <div className="space-y-3">
                    <p className="text-xs" style={{ color: "#8b9ab5" }}>
                      Gib einen gültigen Code aus deiner Authenticator-App ein, um 2FA zu deaktivieren.
                    </p>
                    <input
                      type="text"
                      value={disableToken}
                      onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-xl text-center text-xl font-mono tracking-widest outline-none"
                      style={inputStyle()}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#ef444466"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setTwoFaStep("idle")}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}>
                        Abbrechen
                      </button>
                      <button onClick={disable2FA} disabled={disableToken.length !== 6 || twoFaLoading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90"
                        style={{ background: "#ef4444", color: "#fff" }}>
                        {twoFaLoading ? <Loader size={14} className="animate-spin" /> : <KeyRound size={14} />}
                        Deaktivieren
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Abo ── */}
          {active === "abo" && (
            <div className="space-y-4">

              {/* Zahlung fehlgeschlagen Banner */}
              {lastPaymentFailed && (
                <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "#ef444410", border: "1px solid #ef444433" }}>
                  <AlertCircle size={16} style={{ color: "#ef4444", marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>Zahlung fehlgeschlagen</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8b9ab5" }}>
                      Die letzte Zahlung konnte nicht verarbeitet werden.
                      Bitte Zahlungsmethode im Kundenportal aktualisieren.
                    </p>
                  </div>
                </div>
              )}

              {/* Aktueller Plan */}
              <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
                <h2 className="text-base font-bold mb-4" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                  Aktueller Plan
                </h2>

                {loadingPro ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader size={16} className="animate-spin" style={{ color: "#00c6ff" }} />
                    <span className="text-sm" style={{ color: "#8b9ab5" }}>Wird geladen…</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {(tier === "pro" || tier === "business") && <Zap size={16} style={{ color: "#f5a623" }} />}
                        <p className="text-2xl font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                          {tier === "business" ? "Business" : tier === "pro" ? "Pro" : tier === "trial" ? "Trial" : "Free"}
                        </p>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: (tier === "pro" || tier === "business") ? "#f5a62322" : tier === "trial" ? "#00c6ff22" : "#1e3a5f",
                            color: (tier === "pro" || tier === "business") ? "#f5a623" : tier === "trial" ? "#00c6ff" : "#8b9ab5",
                          }}
                        >
                          Aktiv
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: "#8b9ab5" }}>
                        {(tier === "pro" || tier === "business") && proSince
                          ? `${tier === "business" ? "Business" : "Pro"} seit ${new Date(proSince).toLocaleDateString("de-DE")}`
                          : tier === "trial"
                          ? `Trial — noch ${trialDaysLeft} ${trialDaysLeft === 1 ? "Tag" : "Tage"}`
                          : "Kostenlos — max. 5 Kunden, 3 Angebote, 3 Projekte"}
                      </p>
                      {(tier === "pro" || tier === "business") && (
                        <p className="text-sm font-semibold mt-1" style={{ color: "#f5a623" }}>
                          {tier === "business" ? "29,99 € / Monat" : "19,99 € / Monat"}
                        </p>
                      )}
                    </div>
                    {(tier === "pro" || tier === "business" || isTrial) && (
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {hasStripeCustomer ? (
                          <button
                            onClick={openPortal}
                            disabled={portalLoading}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
                          >
                            {portalLoading ? <Loader size={14} className="animate-spin" /> : <CreditCard size={14} />}
                            {portalLoading ? "Wird geöffnet…" : "Abo verwalten"}
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push("/upgrade")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #f5a623, #c4841c)", color: "#0d1b2e" }}
                          >
                            <Zap size={14} />
                            Jetzt abonnieren
                          </button>
                        )}
                        {!hasStripeCustomer && (
                          <p className="text-xs max-w-[180px] text-right" style={{ color: "#8b9ab5" }}>
                            Einmalig abonnieren, um das Kundenportal freizuschalten.
                          </p>
                        )}
                        {portalError && (
                          <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs max-w-xs text-right" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                            <AlertCircle size={13} className="shrink-0 mt-0.5" />
                            <span>{portalError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Portal Info (Pro-User) */}
              {!loadingPro && (tier === "pro" || tier === "business" || isTrial) && (
                <div className="rounded-xl p-4" style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#8b9ab5" }}>Im Kundenportal kannst du:</p>
                  <div className="grid grid-cols-2 gap-y-1.5">
                    {[
                      "Abo kündigen oder ändern",
                      "Zahlungsmethode aktualisieren",
                      "Rechnungen herunterladen",
                      "Rechnungsadresse anpassen",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "#e6edf3" }}>
                        <Check size={11} style={{ color: "#22c55e" }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgrade Card (Free / Trial — not shown for paying customers) */}
              {!loadingPro && tier !== "pro" && tier !== "business" && (
                <div
                  className="rounded-xl p-5"
                  style={{ background: "linear-gradient(135deg, #f5a62310, #112240)", border: "1px solid #f5a62344" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={18} style={{ color: "#f5a623" }} />
                        <span className="text-xl font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>Pro</span>
                      </div>
                      <p className="text-sm" style={{ color: "#8b9ab5" }}>Alles unlimitiert + alle Pro-Features</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: "#f5a623", fontFamily: "var(--font-syne)" }}>19,99 €</p>
                      <p className="text-xs" style={{ color: "#8b9ab5" }}>/Monat · 14 Tage gratis</p>
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
              )}
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
