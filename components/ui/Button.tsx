import Link from "next/link";
import React from "react";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm",
  secondary:
    "bg-white/70 text-neutral-900 hover:bg-white border border-neutral-200 shadow-sm backdrop-blur",
  ghost: "bg-transparent text-neutral-900 hover:bg-neutral-100",
};

export function Button({
  href,
  onClick,
  children,
  variant = "primary",
  className = "",
  type = "button",
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition active:scale-[0.99]";

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
