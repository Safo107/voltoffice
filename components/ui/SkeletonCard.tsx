"use client";

export function SkeletonLine({ w = "100%", h = 12 }: { w?: string | number; h?: number }) {
  return (
    <div
      className="rounded animate-pulse"
      style={{ width: w, height: h, background: "linear-gradient(90deg,#1e3a5f 25%,#243f6e 50%,#1e3a5f 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }}
    />
  );
}

export default function SkeletonCard() {
  return (
    <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: "#1e3a5f" }} />
        <div className="w-16 h-5 rounded-full animate-pulse" style={{ background: "#1e3a5f" }} />
      </div>
      <div className="space-y-2.5">
        <SkeletonLine w="70%" h={14} />
        <SkeletonLine w="100%" h={10} />
        <SkeletonLine w="55%" h={10} />
      </div>
      <div className="flex justify-between mt-5 pt-3" style={{ borderTop: "1px solid #1e3a5f" }}>
        <SkeletonLine w="40%" h={10} />
        <SkeletonLine w="30%" h={10} />
      </div>
    </div>
  );
}
