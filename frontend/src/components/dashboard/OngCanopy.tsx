"use client";

import { useEffect, useState } from "react";
import { api, FeedDonationItem, DonationItem } from "@/lib/api";
import { StockScanner } from "@/components/scanner/StockScanner";

export function OngCanopy() {
  const [feed, setFeed] = useState<FeedDonationItem[]>([]);
  const [myDonations, setMyDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [scanActiveId, setScanActiveId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [feedData, assignedData] = await Promise.all([
        api.getDonationFeed(),
        api.listDonations(),
      ]);
      setFeed(feedData);
      setMyDonations(assignedData);
    } catch (err) {
      console.error("Error al cargar datos de ONG:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequest = async (id: string) => {
    setRequestingId(id);
    try {
      await api.requestDonation(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Error al solicitar la asignación del lote.");
    } finally {
      setRequestingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center border border-garden-border rounded-2xl bg-garden-surface/60 font-mono text-xs text-garden-sage">
        Alineando vectores del árbol receptor...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Columna Izquierda: Radar de Nutrientes Disponibles en Acopio */}
      <div className="lg:col-span-7 space-y-4">
        <div className="border border-garden-border bg-garden-surface/80 backdrop-blur-md rounded-2xl p-5 shadow-garden-glow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-garden-leaf animate-pulse" />
                Dosel de Absorción (Lotes Disponibles)
              </h2>
              <p className="text-[11px] text-garden-sage">
                Excedentes en acopio central listos para ser solicitados por tu organización
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-garden-dark border border-garden-border text-garden-sprout">
              {feed.length} Disponibles
            </span>
          </div>

          {feed.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-garden-border/60 rounded-xl bg-garden-dark/30">
              <p className="text-xs text-garden-sage">No hay excedentes disponibles en acopio central en este momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feed.map((item) => (
                <div
                  key={item.id}
                  className="border border-garden-border bg-garden-dark/70 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-garden-border-glow transition"
                >
                  <div>
                    <h3 className="text-xs font-semibold text-white">{item.title}</h3>
                    {item.description && (
                      <p className="text-[11px] text-garden-sage mt-0.5">{item.description}</p>
                    )}
                    <p className="text-[10px] font-mono text-neutral-400 mt-1">
                      Donante: <span className="text-neutral-300">{item.donor_email}</span> | Volumen:{" "}
                      <span className="text-garden-leaf font-bold">{item.quantity}</span> unidades
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={requestingId === item.id}
                    onClick={() => handleRequest(item.id)}
                    className="text-xs py-2 px-3.5 rounded-xl bg-gradient-to-r from-garden-emerald to-garden-leaf text-garden-obsidian font-semibold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)] select-none"
                  >
                    {requestingId === item.id ? (
                      <span className="font-mono text-[10px]">Reservando...</span>
                    ) : (
                      <>
                        <span>Solicitar Asignación</span>
                        <span className="text-[11px]">→</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Lotes Asignados y Control Físico con Escáner */}
      <div className="lg:col-span-5 space-y-4">
        <div className="border border-garden-border bg-garden-surface/80 backdrop-blur-md rounded-2xl p-5 shadow-garden-glow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Cosechas Adjudicadas</h2>
              <p className="text-[11px] text-garden-sage">Lotes reservados para recepción y control de calidad</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-garden-dark border border-garden-border text-garden-leaf">
              {myDonations.length} Asignados
            </span>
          </div>

          {myDonations.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-garden-border/60 rounded-xl bg-garden-dark/30">
              <p className="text-xs text-garden-sage">Aún no has solicitado lotes del dosel.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myDonations.map((d) => (
                <div key={d.id} className="border border-garden-border bg-garden-dark/80 rounded-xl p-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-semibold text-white">{d.title}</h3>
                      <p className="text-[11px] font-mono text-garden-sage mt-0.5">
                        Cantidad: <span className="text-garden-sprout">{d.quantity}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-garden-surface border border-garden-border text-garden-leaf">
                      {d.status || "reservado"}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-garden-border/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setScanActiveId(scanActiveId === d.id ? null : d.id)}
                      className="text-[11px] font-mono text-garden-sage hover:text-white px-2 py-1 rounded bg-garden-surface border border-garden-border transition cursor-pointer"
                    >
                      {scanActiveId === d.id ? "Cerrar Escáner" : "Escanear / Recepción"}
                    </button>
                  </div>

                  {scanActiveId === d.id && (
                    <StockScanner
                      donationId={d.id}
                      currentStatus={d.status}
                      onStatusChanged={loadData}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
