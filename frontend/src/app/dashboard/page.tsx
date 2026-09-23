"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, UserClaims } from "@/lib/api";
import { Navbar } from "@/components/dashboard/Navbar";
import { DonationForm } from "@/components/dashboard/DonationForm";
import { DonationList } from "@/components/dashboard/DonationList";
import { MatchingResults } from "@/components/dashboard/MatchingResults";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserClaims | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInitialData = async () => {
    try {
      const claims = await api.getMe();
      setUser(claims);
      const list = await api.listDonations();
      setDonations(list);
    } catch {
      localStorage.removeItem("fexarp_token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("fexarp_token");
    if (!token) {
      router.push("/login");
    } else {
      loadInitialData();
    }
  }, [router]);

  const handleSelectMatching = async (id: string) => {
    try {
      const results = await api.getMatches(id);
      setMatches(results);
    } catch (err) {
      console.error("Error al calcular matching:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fexarp_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-xs text-neutral-500 font-mono">
        Cargando plataforma...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="max-w-5xl mx-auto">
        {user?.role === "empresa" ? (
          /* VISTA PARA EMPRESAS: Publicación, Escaneo y Matching de Excedentes */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <DonationForm onDonationCreated={loadInitialData} />
            <div className="md:col-span-2 space-y-6">
              <DonationList
                donations={donations}
                onSelectMatching={handleSelectMatching}
                onRefreshList={loadInitialData}
              />
              <MatchingResults matches={matches} />
            </div>
          </div>
        ) : (
          /* VISTA PARA ONGs: Recepción y Monitoreo */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card title="Panel de ONG" subtitle="Recepción de donaciones y asignaciones">
              <p className="text-xs text-neutral-400">
                Tu perfil está activo para recibir emparejamientos calculados por el motor de IA según cercanía geográfica y requerimientos prioritarios.
              </p>
              <div className="mt-4 pt-4 border-t border-neutral-800">
                <span className="text-xs text-emerald-400 font-mono font-medium">
                  Estado: En espera de asignaciones
                </span>
              </div>
            </Card>

            <div className="md:col-span-2">
              <Card title="Donaciones Disponibles en el Sistema" subtitle="Lotes con prioridad asignada a tu zona">
                {donations.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4">No hay donaciones activas vinculadas a tu perfil actualmente.</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {donations.map((d) => (
                      <div key={d.id} className="border border-neutral-800 bg-neutral-950/60 p-3 rounded-lg">
                        <p className="text-sm font-medium text-white">{d.title}</p>
                        <p className="text-xs text-neutral-400">Cantidad disponible: {d.quantity} unidades</p>
                        {d.status && (
                          <div className="mt-2">
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                              Estado logístico: {d.status}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
