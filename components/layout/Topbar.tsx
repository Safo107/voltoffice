"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ChevronDown, User, Settings, LogOut, Info, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

const notifications = [
  { id: 1, text: "Angebot #2024-003 wurde versendet", time: "vor 2 Std.", unread: true },
  { id: 2, text: "Neues Projekt angelegt", time: "vor 4 Std.", unread: true },
  { id: 3, text: "Kunde Weber Elektrotechnik hinzugefügt", time: "gestern", unread: false },
];

export default function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Mein Betrieb";
  const displayEmail = user?.email || "";

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 py-4 shrink-0"
      style={{ background: "#112240", borderBottom: "1px solid #1e3a5f", height: "64px" }}
    >
      {/* Title */}
      <div>
        <h1
          className="text-lg font-bold leading-tight"
          style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs" style={{ color: "#8b9ab5" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => { setBellOpen(!bellOpen); setUserOpen(false); }}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all"
            style={{
              background: bellOpen ? "#00c6ff18" : "#0d1b2e",
              border: `1px solid ${bellOpen ? "#00c6ff44" : "#1e3a5f"}`,
              color: bellOpen ? "#e6edf3" : "#8b9ab5",
            }}
            onMouseEnter={(e) => {
              if (!bellOpen) {
                e.currentTarget.style.borderColor = "#00c6ff44";
                e.currentTarget.style.color = "#e6edf3";
              }
            }}
            onMouseLeave={(e) => {
              if (!bellOpen) {
                e.currentTarget.style.borderColor = "#1e3a5f";
                e.currentTarget.style.color = "#8b9ab5";
              }
            }}
          >
            <Bell size={16} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "#00c6ff" }}
            />
          </button>

          {bellOpen && (
            <div
              className="absolute right-0 top-11 rounded-xl py-2 z-50 w-72"
              style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}
            >
              <div
                className="flex items-center justify-between px-4 py-2 mb-1"
                style={{ borderBottom: "1px solid #1e3a5f" }}
              >
                <span className="text-sm font-semibold" style={{ color: "#e6edf3" }}>Benachrichtigungen</span>
                <button onClick={() => setBellOpen(false)} style={{ color: "#8b9ab5" }}>
                  <X size={14} />
                </button>
              </div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 transition-all cursor-pointer"
                  style={{ borderBottom: "1px solid #1e3a5f22" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f44"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{
                      background: n.unread ? "#00c6ff" : "transparent",
                      border: n.unread ? "none" : "1px solid #1e3a5f",
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-xs mb-0.5" style={{ color: "#e6edf3" }}>{n.text}</p>
                    <p className="text-xs" style={{ color: "#4a5568" }}>{n.time}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 pt-2">
                <button
                  className="w-full text-center text-xs py-1.5 rounded-lg transition-all"
                  style={{ color: "#00c6ff" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#00c6ff18"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  Alle als gelesen markieren
                </button>
              </div>
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
            onMouseEnter={(e) => {
              if (!userOpen) e.currentTarget.style.borderColor = "#00c6ff44";
            }}
            onMouseLeave={(e) => {
              if (!userOpen) e.currentTarget.style.borderColor = "#1e3a5f";
            }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full"
              style={{ background: "#00c6ff22", border: "1px solid #00c6ff44" }}
            >
              <User size={14} style={{ color: "#00c6ff" }} />
            </div>
            <span className="hidden sm:inline text-sm font-medium" style={{ color: "#e6edf3" }}>{displayName}</span>
            <ChevronDown
              size={14}
              style={{
                color: "#8b9ab5",
                transform: userOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {userOpen && (
            <div
              className="absolute right-0 top-11 rounded-xl py-1 z-50 w-48"
              style={{ background: "#1a2f50", border: "1px solid #1e3a5f", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}
            >
              <div className="px-4 py-2.5 mb-1" style={{ borderBottom: "1px solid #1e3a5f" }}>
                <p className="text-xs font-semibold truncate" style={{ color: "#e6edf3" }}>{displayName}</p>
                <p className="text-xs truncate" style={{ color: "#8b9ab5" }}>{displayEmail}</p>
              </div>
              <button
                onClick={() => { router.push("/einstellungen"); setUserOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all"
                style={{ color: "#e6edf3" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Settings size={13} style={{ color: "#8b9ab5" }} />
                Einstellungen
              </button>
              <button
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all"
                style={{ color: "#e6edf3" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1e3a5f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Info size={13} style={{ color: "#8b9ab5" }} />
                Version 1.0.0
              </button>
              <div style={{ borderTop: "1px solid #1e3a5f", marginTop: "4px" }}>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-all"
                  style={{ color: "#ef4444" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444418"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
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
