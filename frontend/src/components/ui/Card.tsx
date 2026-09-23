import React from "react";

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-neutral-900 border border-neutral-800 p-6 rounded-xl ${className}`}>
      {title && <h2 className="text-base font-semibold text-neutral-100">{title}</h2>}
      {subtitle && <p className="text-xs text-neutral-400 mt-0.5 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}
