"use client";

interface Props {
  label: string;
  count: number;
  limit: number;  // -1 = unlimited
}

export default function PlanLimitBar({ label, count, limit }: Props) {
  if (limit === -1) return null; // unlimited — don't show bar

  const pct = Math.min(100, Math.round((count / limit) * 100));
  const nearLimit = pct >= 80;
  const atLimit = count >= limit;

  const barColor = atLimit ? "#ef4444" : nearLimit ? "#f5a623" : "#00c6ff";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "#8b9ab5" }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: atLimit ? "#ef4444" : nearLimit ? "#f5a623" : "#8b9ab5" }}>
          {count} / {limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3a5f" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
