"use client";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
        style={{ background: "#112240", border: "1px solid #1e3a5f" }}
      >
        <span style={{ color: "#1e3a5f" }}>{icon}</span>
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
        {title}
      </p>
      {description && (
        <p className="text-sm mb-4" style={{ color: "#8b9ab5" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
