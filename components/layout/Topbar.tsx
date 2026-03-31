"use client";

import { Bell, Search, ChevronDown, User } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 shrink-0"
      style={{
        background: "#112240",
        borderBottom: "1px solid #1e3a5f",
        height: "64px",
      }}
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
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: "#0d1b2e",
            border: "1px solid #1e3a5f",
            color: "#8b9ab5",
            minWidth: "200px",
            cursor: "text",
          }}
        >
          <Search size={14} />
          <span className="text-xs">Suchen...</span>
        </div>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all"
          style={{
            background: "#0d1b2e",
            border: "1px solid #1e3a5f",
            color: "#8b9ab5",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#00c6ff44";
            e.currentTarget.style.color = "#e6edf3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#1e3a5f";
            e.currentTarget.style.color = "#8b9ab5";
          }}
        >
          <Bell size={16} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#00c6ff" }}
          />
        </button>

        {/* User menu */}
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: "#0d1b2e",
            border: "1px solid #1e3a5f",
            color: "#e6edf3",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#00c6ff44";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#1e3a5f";
          }}
        >
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full"
            style={{ background: "#00c6ff22", border: "1px solid #00c6ff44" }}
          >
            <User size={14} style={{ color: "#00c6ff" }} />
          </div>
          <span className="text-sm font-medium" style={{ color: "#e6edf3" }}>
            Mein Betrieb
          </span>
          <ChevronDown size={14} style={{ color: "#8b9ab5" }} />
        </button>
      </div>
    </header>
  );
}
