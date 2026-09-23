import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs text-neutral-400">{label}</label>}
      <input
        className={`w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 ${className}`}
        {...props}
      />
    </div>
  );
}
