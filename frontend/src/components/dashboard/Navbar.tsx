import Link from "next/link";
import { UserClaims } from "@/lib/api";

interface NavbarProps {
  user: UserClaims | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="max-w-5xl mx-auto flex justify-between items-center border border-garden-border bg-garden-surface/60 backdrop-blur-md px-6 py-4 rounded-2xl mb-8 shadow-garden-glow transition-all">
      <div className="flex items-center gap-3">
        {/* Nodo Simbólico / Brote Central */}
        <div className="w-8 h-8 rounded-lg bg-garden-dark border border-garden-emerald/30 flex items-center justify-center shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-garden-emerald shadow-[0_0_10px_#10b981] animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-white">Fexarp</h1>
            <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-garden-emerald/10 border border-garden-emerald/20 text-garden-leaf">
              Ecosistema
            </span>
          </div>
          <p className="text-xs text-garden-sage">Distribución simbiótica de excedentes</p>
        </div>
      </div>

      {user && (
        <nav className="flex items-center gap-3">
          <Link
            href="/map"
            className="text-xs bg-garden-dark/80 hover:bg-garden-surface text-neutral-300 hover:text-white border border-garden-border hover:border-garden-emerald/40 px-3.5 py-1.5 rounded-lg transition duration-200 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-garden-leaf" />
            Red Geoespacial
          </Link>

          {/* Badge de Rol Orgánico */}
          <div className="flex items-center gap-1.5 bg-garden-dark border border-garden-border px-3 py-1 rounded-full text-xs font-mono">
            <span className="text-garden-sage text-[11px]">NODO:</span>
            <span
              className={`font-semibold ${
                user.role === "empresa"
                  ? "text-garden-leaf"
                  : user.role === "ong"
                  ? "text-garden-sprout"
                  : "text-garden-amber"
              }`}
            >
              {user.role.toUpperCase()}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="text-xs text-neutral-400 hover:text-rose-400 px-2 py-1 rounded transition duration-150 cursor-pointer"
          >
            Desconectar
          </button>
        </nav>
      )}
    </header>
  );
}
