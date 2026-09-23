import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl text-xs px-4 py-2.5 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-garden-emerald to-garden-leaf hover:opacity-95 text-garden-obsidian font-semibold shadow-[0_0_15px_rgba(16,185,129,0.25)]",
    secondary:
      "bg-garden-surface hover:bg-garden-card text-white border border-garden-border",
    outline:
      "bg-transparent hover:bg-garden-surface text-neutral-200 border border-garden-border hover:border-garden-leaf/40",
    ghost:
      "bg-transparent hover:bg-garden-surface/60 text-garden-sage hover:text-white",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2 font-mono">
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Cargando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
