// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

import LayoutWrapper from "./components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Evlumba",
  description: "Keşfet • Kaydet • Eşleş",
  icons: {
    icon: "/evlumba-icon.svg",
    shortcut: "/evlumba-icon.svg",
    apple: "/evlumba-icon.svg",
  },
};

function GlobalListingsButton() {
  return (
    <div
      className="pointer-events-none fixed right-4 z-40 md:right-6"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      aria-hidden="false"
    >
      <div className="group pointer-events-auto relative evl-float-soft">
        <Link
          href="/ilanlar"
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/92 px-4 py-2.5 text-sm font-semibold text-slate-800 backdrop-blur shadow-[0_16px_45px_-30px_rgba(0,0,0,0.35)] transition hover:bg-white"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M8 13h8" />
            </svg>
          </span>
          İlanlar
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">
            Yeni
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {/* Global light background glow */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div
            className="absolute -left-40 -top-56 h-130 w-130 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.55), rgba(139,92,246,0) 60%)",
            }}
          />
          <div
            className="absolute -right-40 -top-40 h-130 w-130 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.45), rgba(16,185,129,0) 60%)",
            }}
          />
          <div
            className="absolute left-1/3 top-130 h-140 w-140 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.40), rgba(99,102,241,0) 60%)",
            }}
          />
        </div>

        <LayoutWrapper>{children}</LayoutWrapper>
        <GlobalListingsButton />
      </body>
    </html>
  );
}
