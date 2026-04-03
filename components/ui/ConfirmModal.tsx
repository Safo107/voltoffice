"use client";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-sm"
        style={{ background: "#112240", border: "1px solid #1e3a5f" }}
      >
        <p
          className="text-base font-bold mb-2 text-center"
          style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}
        >
          {title}
        </p>
        <p
          className="text-sm mb-6 text-center"
          style={{ color: "#8b9ab5", lineHeight: "1.6" }}
        >
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "#0d1b2e", color: "#8b9ab5", border: "1px solid #1e3a5f" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e6edf3")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8b9ab5")}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: danger ? "#ef444418" : "#f5a62318",
              color: danger ? "#ef4444" : "#f5a623",
              border: `1px solid ${danger ? "#ef444440" : "#f5a62340"}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = danger ? "#ef444430" : "#f5a62330";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = danger ? "#ef444418" : "#f5a62318";
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
