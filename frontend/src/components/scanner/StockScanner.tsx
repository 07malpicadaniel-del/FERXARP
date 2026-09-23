"use client";

import { useState } from "react";
import { api, ScanResult } from "@/lib/api";

interface StockScannerProps {
  donationId: string;
  currentStatus?: string | null;
  onStatusChanged?: () => void;
}

export function StockScanner({ donationId, currentStatus, onStatusChanged }: StockScannerProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleScanAction = async (action: "entrada" | "salida" | "entrega") => {
    setLoading(true);
    setFeedback(null);

    try {
      const res: ScanResult = await api.scanItem({
        donation_id: donationId,
        action,
      });
      setFeedback(res.message);
      if (onStatusChanged) onStatusChanged();
    } catch (err: any) {
      setFeedback(err.message || "Error al registrar transición física.");
    } finally {
      setLoading(false);
    }
  };

  const statusKey = currentStatus || "en_acopio";

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-garden-dark/95 border border-garden-border space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-mono uppercase tracking-wider text-garden-sage">
          Trazabilidad Física
        </span>
        <span className="text-[10px] font-mono text-garden-leaf bg-garden-surface px-2 py-0.5 rounded border border-garden-border">
          ID: {donationId.slice(0, 8)}...
        </span>
      </div>

      {/* Barra de Ciclo Vital */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
        <div
          className={`py-1 rounded border ${
            statusKey === "en_acopio"
              ? "bg-garden-emerald/20 border-garden-emerald text-garden-sprout font-bold"
              : "border-garden-border/40 text-neutral-500"
          }`}
        >
          1. Semilla
        </div>
        <div
          className={`py-1 rounded border ${
            statusKey === "en_transito"
              ? "bg-garden-amber/20 border-garden-amber text-amber-300 font-bold"
              : "border-garden-border/40 text-neutral-500"
          }`}
        >
          2. Tallo
        </div>
        <div
          className={`py-1 rounded border ${
            statusKey === "entregado"
              ? "bg-garden-leaf/20 border-garden-leaf text-garden-leaf font-bold"
              : "border-garden-border/40 text-neutral-500"
          }`}
        >
          3. Cosecha
        </div>
      </div>

      {/* Botones de Acción del Escáner */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleScanAction("entrada")}
          className="flex-1 text-[11px] py-1.5 px-2 rounded-lg bg-garden-surface hover:bg-garden-card border border-garden-border text-neutral-200 hover:text-white transition disabled:opacity-40"
        >
          Germinar (Acopio)
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleScanAction("salida")}
          className="flex-1 text-[11px] py-1.5 px-2 rounded-lg bg-garden-surface hover:bg-garden-card border border-garden-border text-neutral-200 hover:text-white transition disabled:opacity-40"
        >
          En Ruta (Tránsito)
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleScanAction("entrega")}
          className="flex-1 text-[11px] py-1.5 px-2 rounded-lg bg-garden-surface hover:bg-garden-card border border-garden-border text-neutral-200 hover:text-white transition disabled:opacity-40"
        >
          Cosechar (Entrega)
        </button>
      </div>

      {feedback && (
        <p className="text-[11px] font-mono text-garden-sprout bg-garden-surface/60 px-2.5 py-1.5 rounded border border-garden-border/60">
          {feedback}
        </p>
      )}
    </div>
  );
}
