"use client";

import { useRef, useState, useEffect } from "react";
import { Trash2, Check } from "lucide-react";

interface SignaturePadProps {
  onSave: (base64: string) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function SignaturePad({ onSave, onCancel, saving }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0d1b2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e6edf3";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0d1b2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div>
      <p className="text-xs mb-2" style={{ color: "#8b9ab5" }}>
        Bitte im Feld unten unterschreiben (Maus oder Touchscreen):
      </p>

      <div
        style={{
          borderRadius: 12,
          border: "1px solid #1e3a5f",
          overflow: "hidden",
          touchAction: "none",
        }}
      >
        <canvas
          ref={canvasRef}
          width={680}
          height={200}
          className="w-full block"
          style={{ cursor: "crosshair", background: "#0d1b2e" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      {/* Signaturlinie */}
      <div className="flex items-center gap-2 mt-1.5 px-3">
        <div className="flex-1 border-b" style={{ borderColor: "#1e3a5f" }} />
        <span className="text-xs" style={{ color: "#8b9ab5" }}>Unterschrift</span>
        <div className="flex-1 border-b" style={{ borderColor: "#1e3a5f" }} />
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#8b9ab5" }}
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={clear}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "#ef444418", border: "1px solid #ef444433", color: "#ef4444" }}
        >
          <Trash2 size={14} />
          Löschen
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isEmpty || saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)", color: "#0d1b2e" }}
        >
          <Check size={15} />
          {saving ? "Wird gespeichert…" : "Unterschrift speichern"}
        </button>
      </div>
    </div>
  );
}
