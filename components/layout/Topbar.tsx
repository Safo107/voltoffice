"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, ChevronDown, User, Settings, LogOut, Info, X, AlertCircle, AlertTriangle, Info as InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/authFetch";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  read: boolean;
  severity: "critical" | "warning" | "info";
  createdAt: string;
}

function severityColor(s: "critical" | "warning" | "info") {
  if (s === "critical") return "#ef4444";
  if (s === "warning") return "#f5a623";
  return "#00c6ff";
}

function SeverityDot({ severity, read }: { severity: "critical" | "warning" | "info"; read: boolean }) {
  if (read) return <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "transparent", border: "1px solid #1e3a5f" }} />;
  return <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: severityColor(severity) }} />;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch("/api/notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silent fail — bell just stays empty
    }
  }, []);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    try {
      await authFetch(`/api/notifications/${id}`, { method: "PUT" });
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await authFetch("/api/notifications", { method: "PUT" });
    } catch { /* silent */ }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Mein Betrieb";
  const displayEmail = user?.email || "";

  const relatedPath = (n: Notification) => {
    if (n.relatedType === "rechnung") return "/rechnungen";
    if (n.relatedType === "angebot") return "/angebote";
    if (n.relatedType === "projekt") return "/projekte";
    return null;
  };

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 py-4 shrink-0"
      style={{ background: "#112240", borderBottom: "1px solid #1e3a5f", height: "64px" }}
    >
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold leading-tight" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
          {title}
        </h1>
        {subtitle && <p className="text-xs" style={{ color: "#8b9ab5" }}>{subtitle}</p>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => { setBellOpen(!bellOpen); setUserOpen(false); }}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all"
            style={{
              background: bellOpen ? "#00c6ff18" : "#0d1b2e",
              border: `1px solid ${bellOpen ? "#00c6ff44" : "#1e3a5f"}`,
              color: bellOpen ? "#e6edf3" : "#8b9ab5",
            }}
            onMouseEnter={(e) => { if (!bellOpen) { e.currentTarget.style.borderColor = "#00c6ff44"; e.currentTarget.style.color = "#e6edf3"; } }}
            onMouseLeave={(e) => { if (!bellOpen) { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.color = "#8b9ab5"; } }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: unreadCount > 0 && notifications.some((n) => !n.read && n.severity === "critical") ? "#ef4444" : "#00c6ff",
                  color: "#0d1b2e",
                  minWidth: 16,
                  height: 16,
                  fontSize: 10,
                  paddingInline: 3,
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              className="absolute right-0 top-11 rounded-xl py-2 z-50"
              style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 12px 32px rgba(0,0,0,0.5)", width: "min(320px, calc(100vw - 24px))" }}
            >
              <div className="flex items-center justify-between px-4 py-2 mb-1" style={{ borderBottom: "1px solid #1e3a5f" }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "#e6edf3" }}>Benachrichtigungen</span>
                  {unreadCount > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#00c6ff22", color: "#00c6ff" }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button onClick={() => setBellOpen(false)} style={{ color: "#8b9ab5" }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm" style={{ color: "#8b9ab5" }}>Keine Benachrichtigungen</p>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => {
                    const path = relatedPath(n);
                    return (
                      <div
                        key={n._id}
                        className="flex items-start gap-3 px-4 py-3 transition-all cursor-pointer"
                        style={{
                          borderBottom: "1px solid #1e3a5f22",
                          background: n.read ? "transparent" : `${severityColor(n.severity)}08`,
                          opacity: n.read ? 0.65 : 1,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f44"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? "transparent" : `${severityColor(n.severity)}08`; }}
                        onClick={() => {
                          markRead(n._id);
                          if (path) { router.push(path); setBellOpen(false); }
                        }}
                      >
                        <SeverityDot severity={n.severity} read={n.read} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold mb-0.5 truncate" style={{ color: n.read ? "#8b9ab5" : severityColor(n.severity) }}>
                            {n.title}
                          </p>
                          <p className="text-xs leading-snug" style={{ color: "#8b9ab5" }}>{n.message}</p>
                          <p className="text-xs mt-1" style={{ color: "#4a5568" }}>
                            {new Date(n.createdAt).toLocaleDateString("de-DE")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {unreadCount > 0 && (
                <div className="px-4 pt-2" style={{ borderTop: "1px solid #1e3a5f22" }}>
                  <button
                    onClick={markAllRead}
                    className="w-full text-center text-xs py-1.5 rounded-lg transition-all"
                    style={{ color: "#00c6ff" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff18"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    Alle als gelesen markieren
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setUserOpen(!userOpen); setBellOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: userOpen ? "#00c6ff0a" : "#0d1b2e",
              border: `1px solid ${userOpen ? "#00c6ff44" : "#1e3a5f"}`,
              color: "#e6edf3",
            }}
            onMouseEnter={(e) => { if (!userOpen) e.currentTarget.style.borderColor = "#00c6ff44"; }}
            onMouseLeave={(e) => { if (!userOpen) e.currentTarget.style.borderColor = "#1e3a5f"; }}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: "#00c6ff22", border: "1px solid #00c6ff44" }}>
              <User size={14} style={{ color: "#00c6ff" }} />
            </div>
            <span className="hidden sm:inline text-sm font-medium" style={{ color: "#e6edf3" }}>{displayName}</span>
            <ChevronDown size={14} style={{ color: "#8b9ab5", transform: userOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-11 rounded-xl py-1 z-50 w-48"
              style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>
              <div className="px-4 py-2.5 mb-1" style={{ borderBottom: "1px solid #1e3a5f" }}>
                <p className="text-xs font-semibold truncate" style={{ color: "#e6edf3" }}>{displayName}</p>
                <p className="text-xs truncate" style={{ color: "#8b9ab5" }}>{displayEmail}</p>
              </div>
              <button onClick={() => { router.push("/einstellungen"); setUserOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all" style={{ color: "#e6edf3" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <Settings size={13} style={{ color: "#8b9ab5" }} />
                Einstellungen
              </button>
              <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all" style={{ color: "#e6edf3" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <Info size={13} style={{ color: "#8b9ab5" }} />
                Version 1.0.0
              </button>
              <div style={{ borderTop: "1px solid #1e3a5f", marginTop: "4px" }}>
                <button onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all" style={{ color: "#ef4444" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444418"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <LogOut size={13} />
                  Abmelden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
