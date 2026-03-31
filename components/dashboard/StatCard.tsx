"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "cyan" | "orange" | "green" | "muted";
  limit?: number;
  current?: number;
  sublabel?: string;
}

const accentColors = {
  cyan: { bg: "#00c6ff18", border: "#00c6ff33", icon: "#00c6ff", bar: "#00c6ff" },
  orange: { bg: "#f5a62318", border: "#f5a62333", icon: "#f5a623", bar: "#f5a623" },
  green: { bg: "#22c55e18", border: "#22c55e33", icon: "#22c55e", bar: "#22c55e" },
  muted: { bg: "#ffffff08", border: "#1e3a5f", icon: "#8b9ab5", bar: "#8b9ab5" },
};

export default function StatCard({
  label,
  value,
  icon,
  accent = "cyan",
  limit,
  current,
  sublabel,
}: StatCardProps) {
  const colors = accentColors[accent];
  const pct = limit && current !== undefined ? Math.min((current / limit) * 100, 100) : null;

  return (
    <div
      className="rounded-xl p-5 transition-all hover:scale-[1.01]"
      style={{
        background: "#112240",
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ background: colors.bg, color: colors.icon }}
        >
          {icon}
        </div>
        {limit !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#0d1b2e", color: "#8b9ab5", border: "1px solid #1e3a5f" }}>
            {current}/{limit}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
        {value}
      </p>
      <p className="text-sm" style={{ color: "#8b9ab5" }}>
        {label}
      </p>

      {sublabel && (
        <p className="text-xs mt-1" style={{ color: colors.icon }}>
          {sublabel}
        </p>
      )}

      {pct !== null && (
        <div className="mt-3">
          <div className="w-full h-1.5 rounded-full" style={{ background: "#1e3a5f" }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%`, background: colors.bar }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
