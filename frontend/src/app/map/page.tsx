"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, MapPoint } from "@/lib/api";

export default function MapPage() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fexarp_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // 1. Cargar coordenadas desde el backend en Rust
    api.getMapPoints()
      .then((data) => {
        setPoints(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener puntos del mapa:", err);
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (loading || !mapContainerRef.current || mapInstanceRef.current) return;

    // 2. Inicializar Leaflet dinámicamente en el cliente
    import("leaflet").then((L) => {
      // Inyectar estilos de Leaflet si no existen en el documento
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapContainerRef.current!).setView([19.1738, -96.1342], 12);
      mapInstanceRef.current = map;

      // Capa base abierta de OpenStreetMap (no requiere API key ni genera marcas de agua)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // 3. Dibujar marcadores y líneas de despacho
      const acopioPoint = points.find((p) => p.point_type === "acopio");

      points.forEach((p) => {
        const isAcopio = p.point_type === "acopio";
        const markerColor = isAcopio ? "#0284c7" : "#059669";

        const customIcon = L.divIcon({
          className: "custom-map-pin",
          html: `<div style="background-color: ${markerColor}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker([p.latitude, p.longitude], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="color: #111; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <strong style="font-size: 13px;">${p.name}</strong><br/>
            <span style="display: inline-block; margin-top: 2px; padding: 2px 6px; background: #eee; border-radius: 4px; font-weight: bold; font-size: 10px;">
              ${p.point_type.toUpperCase()}
            </span>
            <p style="margin-top: 6px; margin-bottom: 0; color: #444;">${p.details}</p>
          </div>
        `);

        // Trazar línea logística entre el acopio central y la ONG de destino
        if (!isAcopio && acopioPoint) {
          L.polyline(
            [
              [acopioPoint.latitude, acopioPoint.longitude],
              [p.latitude, p.longitude],
            ],
            {
              color: "#059669",
              weight: 3,
              opacity: 0.7,
              dashArray: "6, 8",
            }
          ).addTo(map);
        }
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, points]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8 flex flex-col">
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center border-b border-neutral-800 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Monitoreo de Rutas y Acopio</h1>
          <p className="text-sm text-neutral-400">Trazabilidad geoespacial en tiempo real (Semana 3)</p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded-lg transition"
        >
          Volver al Dashboard
        </Link>
      </header>

      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col gap-4">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500"></div>
            <span className="text-neutral-300">Centro de Acopio Central</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-neutral-300">ONGs Receptoras / Puntos de Entrega</span>
          </div>
        </div>

        <div className="flex-1 min-h-[550px] w-full rounded-xl overflow-hidden border border-neutral-800 relative bg-neutral-900">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/80 z-10 text-xs text-neutral-400">
              Cargando puntos de geolocalización desde Rust...
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full min-h-[550px]" />
        </div>
      </div>
    </main>
  );
}
