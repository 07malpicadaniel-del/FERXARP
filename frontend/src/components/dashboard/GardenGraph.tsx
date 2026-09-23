"use client";

import { useState } from "react";
import { DonationItem, ScoredMatch } from "@/lib/api";

interface GardenGraphProps {
  donation: DonationItem | null;
  matches: ScoredMatch[];
  isLoading?: boolean;
}

export function GardenGraph({ donation, matches, isLoading = false }: GardenGraphProps) {
  const [activeMatch, setActiveMatch] = useState<ScoredMatch | null>(null);

  const width = 760;
  const height = 440;
  const originX = 130;
  const originY = height / 2;

  // Distribución vertical de nodos receptores (ONGs / Frutos)
  const targetX = 610;
  const totalTargets = matches.length;

  const getTargetY = (index: number) => {
    if (totalTargets === 1) return height / 2;
    const padding = 70;
    const step = (height - padding * 2) / (totalTargets - 1);
    return padding + index * step;
  };

  return (
    <div className="relative border border-garden-border bg-garden-surface/80 backdrop-blur-md rounded-2xl p-5 overflow-hidden shadow-garden-glow">
      {/* Cabecera del Lienzo */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-garden-leaf animate-pulse" />
            Red Arbórea de Simbiosis
          </h3>
          <p className="text-[11px] text-garden-sage">
            Topología generativa ponderada por IA y proximidad geográfica
          </p>
        </div>

        {donation && (
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-garden-dark border border-garden-border text-garden-sprout">
            {donation.quantity} unidades en distribución
          </span>
        )}
      </div>

      {/* Estado Vacío: Semilla en Reposo */}
      {!donation ? (
        <div className="h-80 flex flex-col items-center justify-center text-center p-6 border border-dashed border-garden-border/60 rounded-xl bg-garden-dark/40">
          <div className="w-12 h-12 rounded-full bg-garden-surface border border-garden-emerald/30 flex items-center justify-center mb-3 shadow-inner">
            <div className="w-3.5 h-3.5 rounded-full bg-garden-sage/40" />
          </div>
          <p className="text-xs font-medium text-neutral-300">Semilla en reposo</p>
          <p className="text-[11px] text-garden-sage max-w-xs mt-1">
            Selecciona un lote del inventario para germinar las ramas hacia las ONGs con mayor afinidad semántica.
          </p>
        </div>
      ) : isLoading ? (
        /* Estado de Carga: Germinación */
        <div className="h-80 flex flex-col items-center justify-center border border-garden-border/40 rounded-xl bg-garden-dark/30">
          <div className="w-10 h-10 border-2 border-garden-emerald/30 border-t-garden-leaf rounded-full animate-spin mb-3" />
          <p className="text-xs text-garden-sprout font-mono tracking-wide">
            Canalizando nutrientes vectoriales...
          </p>
        </div>
      ) : matches.length === 0 ? (
        /* Sin Coincidencias */
        <div className="h-80 flex flex-col items-center justify-center text-center p-6 border border-dashed border-garden-border/60 rounded-xl bg-garden-dark/40">
          <p className="text-xs text-garden-amber">No se encontraron ramas receptoras viables en la zona.</p>
        </div>
      ) : (
        /* Lienzo SVG Dinámico */
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[620px] select-none"
          >
            <defs>
              {/* Filtro de resplandor para nodos vivos */}
              <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Gradiente Tronco -> Rama */}
              <linearGradient id="branch-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#34d399" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* RAMAS (Curvas de Bézier cúbicas con grosor variable según final_score) */}
            {matches.map((match, i) => {
              const destY = getTargetY(i);
              const branchThickness = Math.max(1.5, (match.final_score / 100) * 6.5);
              const isSelected = activeMatch?.ngo_id === match.ngo_id;

              // Curvatura orgánica en S suave
              const cp1X = originX + (targetX - originX) * 0.45;
              const cp1Y = originY;
              const cp2X = originX + (targetX - originX) * 0.55;
              const cp2Y = destY;

              const pathData = `M ${originX} ${originY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${destY}`;

              return (
                <g key={match.ngo_id} className="cursor-pointer" onClick={() => setActiveMatch(match)}>
                  {/* Sombra interactiva ampliada para hover cómodo */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={20}
                    className="transition-all"
                  />

                  {/* Rama Estructural Base */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isSelected ? "#6ee7b7" : "url(#branch-gradient)"}
                    strokeWidth={isSelected ? branchThickness + 2 : branchThickness}
                    strokeOpacity={isSelected ? 1 : 0.6}
                    strokeLinecap="round"
                    className="transition-all duration-300 hover:stroke-garden-sprout"
                  />

                  {/* Pulso de Sabia Orgánica (Línea punteada en movimiento) */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={Math.max(1, branchThickness * 0.35)}
                    strokeDasharray="4 16"
                    strokeDashoffset={i * 8}
                    strokeOpacity={0.4}
                    className="animate-[dash_12s_linear_infinite]"
                  />
                </g>
              );
            })}

            {/* NODO CENTRAL (La Semilla Nutriente / Excedente Donado) */}
            <g transform={`translate(${originX}, ${originY})`}>
              <circle
                r={26}
                fill="#0f1913"
                stroke="#10b981"
                strokeWidth={2}
                filter="url(#glow-emerald)"
              />
              <circle r={14} fill="#10b981" opacity={0.2} className="animate-ping" />
              <circle r={7} fill="#34d399" />
              {/* Etiqueta de Origen */}
              <text
                x={-35}
                y={-34}
                fill="#ffffff"
                fontSize="11"
                fontWeight="600"
                className="font-sans"
              >
                {donation.title.length > 18 ? `${donation.title.slice(0, 18)}...` : donation.title}
              </text>
              <text x={-35} y={-20} fill="#8fa896" fontSize="9" className="font-mono">
                Semilla Matriz
              </text>
            </g>

            {/* NODOS RECEPTORES (Frutos / ONGs Ponderadas) */}
            {matches.map((match, i) => {
              const destY = getTargetY(i);
              const isSelected = activeMatch?.ngo_id === match.ngo_id;
              const isHighPrio = match.final_score >= 80;

              return (
                <g
                  key={match.ngo_id}
                  transform={`translate(${targetX}, ${destY})`}
                  className="cursor-pointer group"
                  onClick={() => setActiveMatch(match)}
                >
                  {/* Halo reactivo al nodo */}
                  <circle
                    r={isSelected ? 18 : 14}
                    fill="#0a110d"
                    stroke={isHighPrio ? "#34d399" : "#10b981"}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter={isHighPrio ? "url(#glow-emerald)" : undefined}
                    className="transition-all duration-300 group-hover:stroke-garden-sprout"
                  />
                  {/* Núcleo del Brote */}
                  <circle
                    r={isSelected ? 6 : 4.5}
                    fill={isHighPrio ? "#6ee7b7" : "#34d399"}
                    className="transition-all duration-300"
                  />

                  {/* Nombre de la ONG */}
                  <text
                    x={24}
                    y={-2}
                    fill={isSelected ? "#ffffff" : "#d1d5db"}
                    fontSize="11"
                    fontWeight={isSelected ? "600" : "500"}
                    className="transition-colors group-hover:fill-white font-sans"
                  >
                    {match.ngo_name}
                  </text>

                  {/* Afinidad y Distancia */}
                  <text x={24} y={12} fill="#8fa896" fontSize="9.5" className="font-mono">
                    Score: {match.final_score.toFixed(1)}% | {match.distance_km.toFixed(1)} km
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* DETALLE EXPANDIDO DEL NODO SELECCIONADO */}
      {activeMatch && (
        <div className="mt-4 p-3.5 rounded-xl bg-garden-dark/90 border border-garden-border flex flex-wrap justify-between items-center gap-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-garden-surface border border-garden-emerald/40 flex items-center justify-center font-mono font-bold text-xs text-garden-sprout">
              {activeMatch.final_score.toFixed(0)}%
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{activeMatch.ngo_name}</p>
              <p className="text-[11px] text-garden-sage">
                Similitud semántica: {(activeMatch.semantic_similarity * 100).toFixed(1)}% | Distancia geodésica: {activeMatch.distance_km.toFixed(1)} km
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-garden-emerald/10 border border-garden-emerald/30 text-garden-leaf">
              Prioridad Optimizada
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
