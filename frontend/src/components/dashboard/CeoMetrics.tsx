"use client";

import { useEffect, useState } from "react";
import { api, ImpactMetrics } from "@/lib/api";

export function CeoMetrics() {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getImpactMetrics()
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar KPIs directivos:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !metrics) {
    return (
      <div className="h-64 flex items-center justify-center border border-garden-border rounded-2xl bg-garden-surface/60 font-mono text-xs text-garden-sage">
        Consolidando balance social y huella mitigada...
      </div>
    );
  }

  const successRate = metrics.total_donations > 0
    ? ((metrics.delivered_donations / metrics.total_donations) * 100).toFixed(1)
    : "100";

  return (
    <div className="space-y-6">
      {/* Tarjetas Principales de Impacto Directivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-garden-border bg-garden-surface/80 backdrop-blur-md rounded-2xl p-5 shadow-garden-glow">
          <p className="text-[11px] font-mono text-garden-sage uppercase tracking-wider">Volumen Distribuido</p>
          <p className="text-2xl font-bold text-white mt-1">
            {metrics.total_volume_kg.toLocaleString()}{" "}
            <span className="text-xs font-mono font-normal text-garden-sprout">kg</span>
          </p>
          <p className="text-[11px] text-garden-sage mt-2">Alimentos e insumos canalizados</p>
        </div>

        <div className="border border-garden-border bg-garden-surface/80 backdrop-blur-md rounded-2xl p-5 shadow-garden-glow">
          <p className="text-[11px] font-mono text-garden-sage uppercase tracking-wider">Huella de CO₂ Evitada</p>
          <p className="text-2xl font-bold text-garden-leaf mt-1">
            {metrics.estimated_co2_saved_kg.toLocaleString()}{" "}
            <span className="text-xs font-mono font-normal text-garden-sprout">kg CO₂e</span>
          </p>
          <p className="text-[11px] text-garden-sage mt-2">Mitigación por merma no generada</p>
        </div>

        <div className="border border-garden-border bg-garden-surface/80 backdrop-blur-md rounded-2xl p-5 shadow-garden-glow">
          <p className="text-[11px] font-mono text-garden-sage uppercase tracking-wider">Beneficiarios Directos</p>
          <p className="text-2xl font-bold text-white mt-1">
            ~{metrics.estimated_beneficiaries.toLocaleString()}
          </p>
          <p className="text-[11px] text-garden-sage mt-2">Familias alcanzadas mediante ONGs</p>
        </div>

        <div className="border border-garden-border bg-garden-surface/80 backdrop-blur-md rounded-2xl p-5 shadow-garden-glow">
          <p className="text-[11px] font-mono text-garden-sage uppercase tracking-wider">Efectividad Operativa</p>
          <p className="text-2xl font-bold text-garden-sprout mt-1">{successRate}%</p>
          <p className="text-[11px] text-garden-sage mt-2">{metrics.verified_ngos} ONGs validadas en red</p>
        </div>
      </div>

      {/* Balance de Trazabilidad e Inventario */}
      <div className="border border-garden-border bg-garden-surface/70 backdrop-blur-md rounded-2xl p-6 shadow-garden-glow">
        <h3 className="text-sm font-semibold text-white mb-1">Estado Vital del Inventario en Ecosistema</h3>
        <p className="text-xs text-garden-sage mb-5">
          Auditoría de lotes en tiempo real para reportes de sostenibilidad corporativa
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-garden-dark border border-garden-border">
            <p className="text-xl font-bold text-white">{metrics.total_donations}</p>
            <p className="text-[11px] font-mono text-garden-sage mt-1">Total Sembradas</p>
          </div>
          <div className="p-4 rounded-xl bg-garden-dark border border-emerald-500/30">
            <p className="text-xl font-bold text-garden-sprout">{metrics.delivered_donations}</p>
            <p className="text-[11px] font-mono text-garden-leaf mt-1">Cosechadas (Entregadas)</p>
          </div>
          <div className="p-4 rounded-xl bg-garden-dark border border-amber-500/30">
            <p className="text-xl font-bold text-amber-300">{metrics.in_transit_donations}</p>
            <p className="text-[11px] font-mono text-amber-400 mt-1">Tallos en Ruta</p>
          </div>
          <div className="p-4 rounded-xl bg-garden-dark border border-rose-500/30">
            <p className="text-xl font-bold text-rose-300">{metrics.rejected_donations}</p>
            <p className="text-[11px] font-mono text-rose-400 mt-1">Mermas / Rechazos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
