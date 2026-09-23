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

    // Carga de coordenadas desde el backend en Rust
    api.getMapPoints()
      .then((data) => {
        setPoints(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener puntos geodésicos:", err);
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (loading || !mapContainerRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      // Inyección de estilos de Leaflet y filtro mineral para OpenStreetMap
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("map-botanical-filter")) {
        const style = document.createElement("style");
        style.id = "map-botanical-filter";
        style.innerHTML = `
          /* Inversión mineral nocturna para teselas de OpenStreetMap */
          .botanical-tiles .leaflet-tile {
            filter: brightness(0.65) invert(1) contrast(1.7) hue-rotate(185deg) saturate(0.35) !important;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            background: #0f1913;
            border: 1px solid rgba(36, 62, 49, 0.7);
            border-radius: 14px;
            color: #e5e7eb;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
          }
          .custom-popup .leaflet-popup-tip {
            background: #0f1913;
            border: 1px solid rgba(36, 62, 49, 0.7);
          }
        `;
        document.head.appendChild(style);
      }

      const map = L.map(mapContainerRef.current!, {
        zoomControl: false,
      }).setView([19.1738, -96.1342], 12);
      mapInstanceRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Teselas libres tratadas con filtro mineral botánico
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        className: "botanical-tiles",
        maxZoom: 19,
      }).addTo(map);

      const acopioPoint = points.find((p) => p.point_type === "acopio");

      points.forEach((p) => {
        const isAcopio = p.point_type === "acopio";

        // Marcadores botánicos SVG personalizados
        const iconHtml = isAcopio
          ? `<div class="relative flex items-center justify-center w-8 h-8">
               <div class="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping"></div>
               <div class="w-6 h-6 rounded-full bg-[#0a110d] border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_12px_#34d399]">
                 <div class="w-2 h-2 rounded-full bg-emerald-300"></div>
               </div>
             </div>`
          : `<div class="relative flex items-center justify-center w-6 h-6">
               <div class="w-5 h-5 rounded-full bg-[#0a110d] border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                 <div class="w-1.5 h-1.5 rounded-full bg-[#6ee7b7]"></div>
               </div>
             </div>`;

        const customIcon = L.divIcon({
          className: "bg-transparent border-0",
          html: iconHtml,
          iconSize: isAcopio ? [32, 32] : [24, 24],
          iconAnchor: isAcopio ? [16, 16] : [12, 12],
        });

        const marker = L.marker([p.latitude, p.longitude], { icon: customIcon }).addTo(map);

        marker.bindPopup(
          `
          <div style="font-family: inherit; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <strong style="color: #ffffff; font-size: 13px;">${p.name}</strong>
              <span style="font-size: 9px; font-family: monospace; text-transform: uppercase; padding: 2px 6px; border-radius: 9999px; background: #060907; border: 1px solid rgba(36, 62, 49, 0.8); color: ${isAcopio ? "#34d399" : "#6ee7b7"};">
                ${isAcopio ? "Árbol Matriz" : "Brote Receptor"}
              </span>
            </div>
            <p style="margin: 0; color: #8fa896; font-size: 11px; line-height: 1.4;">${p.details}</p>
          </div>
          `,
          { className: "custom-popup" }
        );

        // Ramas logísticas (enlaces que unen el árbol central con cada brote)
        if (!isAcopio && acopioPoint) {
          L.polyline(
            [
              [acopioPoint.latitude, acopioPoint.longitude],
              [p.latitude, p.longitude],
            ],
            {
              color: "#34d399",
              weight: 2,
              opacity: 0.5,
              dashArray: "4, 8",
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
    <main className="min-h-screen bg-garden-obsidian text-neutral-100 p-8 flex flex-col">
      {/* Cabecera Mineral */}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center border border-garden-border bg-garden-surface/70 backdrop-blur-md px-6 py-4 rounded-2xl mb-6 shadow-garden-glow">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-garden-dark border border-garden-emerald/30 flex items-center justify-center shadow-inner">
            <span className="text-sm">🌱</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Topografía Logística</h1>
            <p className="text-xs text-garden-sage">Cartografía viva de acopio y brotes en territorio</p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs bg-garden-dark hover:bg-garden-surface text-neutral-200 border border-garden-border hover:border-garden-emerald/40 px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>←</span>
          <span>Regresar al Jardín</span>
        </Link>
      </header>

      {/* Contenedor del Mapa */}
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-6 px-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-garden-emerald shadow-[0_0_8px_#10b981]" />
            <span className="text-garden-sage">Árbol Matriz (Acopio Central)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-garden-leaf shadow-[0_0_6px_#34d399]" />
            <span className="text-garden-sage">Brotes Receptores (ONGs Vinculadas)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0 border-t-2 border-dashed border-garden-leaf/60" />
            <span className="text-garden-sage font-mono text-[11px]">Ruta de Sabia Simbiótica</span>
          </div>
        </div>

        <div className="flex-1 min-h-[580px] w-full rounded-2xl overflow-hidden border border-garden-border relative bg-garden-surface shadow-garden-glow">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-garden-obsidian/85 z-20 text-xs font-mono text-garden-sprout">
              Sincronizando coordenadas del ecosistema...
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full min-h-[580px]" />
        </div>
      </div>
    </main>
  );
}
