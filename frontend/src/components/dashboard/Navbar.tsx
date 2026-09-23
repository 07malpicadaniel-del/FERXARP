import Link from "next/link";
import { UserClaims } from "@/lib/api";

interface NavbarProps {
  user: UserClaims | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="max-w-5xl mx-auto flex justify-between items-center border-b border-neutral-800 pb-6 mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Fexarp Platform</h1>
        <p className="text-sm text-neutral-400">Distribución de excedentes y emparejamiento con ONGs</p>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <Link
            href="/map"
            className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-lg transition"
          >
            Ver Mapa de Envíos
          </Link>
          <span className="text-xs bg-neutral-800 px-3 py-1 rounded-full text-neutral-300 font-mono">
            ROL: {user.role.toUpperCase()}
          </span>
          <button
            onClick={onLogout}
            className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}
