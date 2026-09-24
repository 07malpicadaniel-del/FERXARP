"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ShipmentItem, UserClaims } from "@/lib/api";
import { Navbar } from "@/components/dashboard/Navbar";
import { StockScanner } from "@/components/scanner/StockScanner";

export default function ShipmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserClaims | null>(null);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const claims = await api.getMe();
      setUser(claims);
      const data = await api.getShipments();
      setShipments(data);
    } catch {
      localStorage.removeItem("fexarp_token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleApprove = async (donationId: string) => {
    setApprovingId(donationId);
    try {
      await api.approveShipment(donationId);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Error al autorizar el envío.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fexarp_token");
    router.push("/login");
  };

  const pendingRequests = shipments.filter(
    (s) => s.donation_status === "reservado" || s.request_status === "pendiente"
  );
  const inTransitShipments = shipments.filter(
    (s) => s.donation_status === "en_transito"
  );
  const completedOrRejected = shipments.filter(
    (s) => s.donation_status === "entregado" || s.donation_status === "rechazado"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-garden-obsidian flex items-center justify-center text-xs font-mono text-garden-sage">
        Cargando solicitudes y envíos...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-garden-obsidian text-neutral-100 p-8">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Control de Solicitudes y Envíos
          </h2>
          <p className="text-xs text-garden-sage mt-0.5">
            Supervisión del ciclo de entrega de donaciones entre empresas y organizaciones sociales
          </p>
        </div>

        {/* Embudo de 3 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA 1: Solicitadas */}
          <div className="border border-garden-border bg-garden-surface/70 backdrop-blur-md rounded-2xl p-5 shadow-garden-glow flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                1. Solicitadas ({pendingRequests.length})
              </h3>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-600/40">
                Pendiente de Salida
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-garden-sage border border-dashed border-garden-border/40 rounded-xl my-auto">
                No hay solicitudes pendientes en este momento.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
                {pendingRequests.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-garden-dark border border-garden-border">
                    <p className="text-xs font-semibold text-white">{s.title}</p>
                    <p className="text-[11px] text-garden-sage mt-1">
                      Cantidad: <span className="text-white font-bold">{s.quantity}</span> unidades
                    </p>
                    <p className="text-[11px] text-garden-sage">
                      Solicitado por: <span className="text-garden-leaf">{s.ngo_name}</span>
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono">Donante: {s.donor_email}</p>

                    {user?.role === "empresa" && (
                      <button
                        type="button"
                        disabled={approvingId === s.donation_id}
                        onClick={() => handleApprove(s.donation_id)}
                        className="w-full mt-3 text-xs py-2 px-3 rounded-xl bg-gradient-to-r from-garden-emerald to-garden-leaf text-garden-obsidian font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        {approvingId === s.donation_id ? "Autorizando..." : "Aprobar y Despachar Envío"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA 2: En Camino */}
          <div className="border border-garden-border bg-garden-surface/70 backdrop-blur-md rounded-2xl p-5 shadow-garden-glow flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-garden-leaf animate-pulse" />
                2. En Camino ({inTransitShipments.length})
              </h3>
              <span className="text-[10px] font-mono text-garden-sprout bg-garden-emerald/10 px-2 py-0.5 rounded border border-garden-emerald/30">
                En Ruta
              </span>
            </div>

            {inTransitShipments.length === 0 ? (
              <div className="p-8 text-center text-xs text-garden-sage border border-dashed border-garden-border/40 rounded-xl my-auto">
                No hay envíos en tránsito actualmente.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
                {inTransitShipments.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-garden-dark border border-emerald-500/30">
                    <p className="text-xs font-semibold text-white">{s.title}</p>
                    <p className="text-[11px] text-garden-sage mt-1">
                      Cantidad: <span className="text-white font-bold">{s.quantity}</span> unidades
                    </p>
                    <p className="text-[11px] text-garden-sage">
                      Destino: <span className="text-garden-leaf">{s.ngo_name}</span>
                    </p>

                    {(user?.role === "ong" || user?.role === "admin") && (
                      <>
                        <div className="mt-3 pt-2.5 border-t border-garden-border/40 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveScanId(activeScanId === s.donation_id ? null : s.donation_id)
                            }
                            className="text-xs font-mono text-garden-sprout hover:text-white px-2.5 py-1.5 rounded-lg bg-garden-surface border border-garden-border transition cursor-pointer"
                          >
                            {activeScanId === s.donation_id
                              ? "Ocultar Acciones"
                              : "Confirmar Llegada / Rechazo"}
                          </button>
                        </div>

                        {activeScanId === s.donation_id && (
                          <StockScanner
                            donationId={s.donation_id}
                            currentStatus={s.donation_status}
                            onStatusChanged={loadData}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA 3: Finalizadas */}
          <div className="border border-garden-border bg-garden-surface/70 backdrop-blur-md rounded-2xl p-5 shadow-garden-glow flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                3. Finalizadas ({completedOrRejected.length})
              </h3>
              <span className="text-[10px] font-mono text-neutral-300 bg-garden-dark px-2 py-0.5 rounded border border-garden-border">
                Historial
              </span>
            </div>

            {completedOrRejected.length === 0 ? (
              <div className="p-8 text-center text-xs text-garden-sage border border-dashed border-garden-border/40 rounded-xl my-auto">
                No hay registros de donaciones finalizadas aún.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
                {completedOrRejected.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-garden-dark/70 border border-garden-border">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold text-white">{s.title}</p>
                      {s.donation_status === "entregado" ? (
                        <span className="text-[10px] font-mono text-garden-leaf bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded">
                          Entregado
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-rose-300 bg-rose-950/40 border border-rose-600/40 px-2 py-0.5 rounded">
                          Rechazado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-garden-sage mt-1">
                      Volumen: {s.quantity} unidades | Receptor: {s.ngo_name}
                    </p>
                    {s.rejection_reason && (
                      <p className="text-[11px] font-mono text-rose-300 bg-rose-950/20 p-2 rounded mt-2 border border-rose-900/40">
                        Motivo de rechazo: {s.rejection_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
