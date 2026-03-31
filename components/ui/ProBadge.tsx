"use client";

import { Lock } from "lucide-react";

interface ProBadgeProps {
  className?: string;
}

export default function ProBadge({ className = "" }: ProBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${className}`}
      style={{
        background: "linear-gradient(135deg, #f5a62322, #f5a62344)",
        border: "1px solid #f5a62366",
        color: "#f5a623",
      }}
    >
      <Lock size={10} />
      PRO
    </span>
  );
}
