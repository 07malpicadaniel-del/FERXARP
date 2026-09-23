"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface StockScannerProps {
  donationId: string;
  currentStatus?: string | null;
  onStatusUpdated: () => void;
}

export function StockScanner({ donationId, currentStatus, onStatusUpdated }: StockScannerProps) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleScanAction = async (action: "entrada" | "salida" | "entrega") => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.scanItem({ donation_id: donationId, action });
      setMsg(res.message);
      onStatusUpdated();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400">Estado logístico:</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-200">
          {currentStatus || "pendiente"}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          onClick={() => handleScanAction("entrada")}
          disabled={loading || currentStatus === "en_acopio"}
          className="text-xs py-1 px-2.5"
        >
          Entrada
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleScanAction("salida")}
          disabled={loading || currentStatus === "en_transito"}
          className="text-xs py-1 px-2.5"
        >
          Salida / Tránsito
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleScanAction("entrega")}
          disabled={loading || currentStatus === "entregado"}
          className="text-xs py-1 px-2.5 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
        >
          Entrega Final
        </Button>
      </div>

      {msg && <p className="w-full text-[11px] text-neutral-400 mt-1 italic">{msg}</p>}
    </div>
  );
}
