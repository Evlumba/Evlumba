"use client";

import React from "react";
import { cn } from "@/lib/cn";

export default function Input({
  label,
  hint,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium">{label}</div> : null}

      <input
        className={cn(
          "ev-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none",
          error ? "border-red-400" : "focus:border-black/20",
          className
        )}
        {...props}
      />

      {error ? (
        <div className="mt-1 text-xs text-red-600">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-black/60">{hint}</div>
      ) : null}
    </label>
  );
}
