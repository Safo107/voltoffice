"use client";

import { Lock, Zap } from "lucide-react";

interface LockedFeatureOverlayProps {
  feature: string;
}

export default function LockedFeatureOverlay({ feature }: LockedFeatureOverlayProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center rounded-xl z-10"
      style={{
        background: "rgba(13, 27, 46, 0.92)",
        backdropFilter: "blur(4px)",
        border: "1px solid #1e3a5f",
      }}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full mb-3"
        style={{ background: "#f5a62322", border: "1px solid #f5a62366" }}
      >
        <Lock size={22} style={{ color: "#f5a623" }} />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: "#e6edf3" }}>
        {feature}
      </p>
      <p className="text-xs mb-4" style={{ color: "#8b9ab5" }}>
        Nur im Pro-Plan verfügbar
      </p>
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #f5a623, #c4841c)",
          color: "#0d1b2e",
        }}
      >
        <Zap size={14} />
        Jetzt upgraden
      </button>
    </div>
  );
}
