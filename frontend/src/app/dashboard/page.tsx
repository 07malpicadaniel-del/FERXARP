"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, DonationItem, ScoredMatch, UserClaims } from "@/lib/api";
import { Navbar } from "@/components/dashboard/Navbar";
import { DonationForm } from "@/components/dashboard/DonationForm";
import { DonationList } from "@/components/dashboard/DonationList";
import { GardenGraph } from "@/components/dashboard/GardenGraph";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserClaims | null>(null);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<DonationItem | null>(null);
  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
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
    const active = donations.find((d) => d.id === id) || null;
    setSelectedDonation(active);
    setLoadingMatches(true);

    try {
      const results = await api.getMatches(id);
      setMatches(results);
    } catch (err) {
      console.error("Error al calcular matching vectorial:", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fexarp_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-garden-obsidian flex items-center justify-center text-xs text-garden-sage font-mono">
        Sincronizando jardín logístico...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-garden-obsidian text-neutral-100 p-8">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto">
        {user?.role === "empresa" ? (
          /* VISTA PARA EMPRESAS: Formulario de Siembra y Ramificación por IA */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <DonationForm onDonationCreated={loadInitialData} />
              <DonationList
                donations={donations}
                onSelectMatching={handleSelectMatching}
                onRefreshList={loadInitialData}
              />
            </div>

            <div className="lg:col-span-8">
              <GardenGraph
                donation={selectedDonation}
                matches={matches}
                isLoading={loadingMatches}
              />
            </div>
          </div>
        ) : (
          /* VISTA PARA ONGs: Recepción de Nutrientes */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card title="Nodo Receptor de ONG" subtitle="Recepción y canalización de insumos">
              <p className="text-xs text-garden-sage leading-relaxed">
                Tu brote receptor está conectado a la red simbiótica. Los lotes se asignan según afinidad semántica y proximidad de acopio.
              </p>
              <div className="mt-4 pt-4 border-t border-garden-border flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-garden-leaf animate-pulse" />
                <span className="text-xs text-garden-sprout font-mono">Estado: Brote Activo</span>
              </div>
            </Card>

            <div className="md:col-span-2">
              <Card title="Cosechas Asignadas" subtitle="Lotes disponibles en tránsito hacia tu territorio">
                {donations.length === 0 ? (
                  <p className="text-xs text-garden-sage py-4">No hay brotes activos vinculados a este nodo.</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {donations.map((d) => (
                      <div
                        key={d.id}
                        className="border border-garden-border bg-garden-dark/70 p-4 rounded-xl flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{d.title}</p>
                          <p className="text-xs text-garden-sage">Cantidad asignada: {d.quantity} unidades</p>
                        </div>
                        {d.status && (
                          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-garden-surface border border-garden-border text-garden-leaf">
                            {d.status}
                          </span>
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
