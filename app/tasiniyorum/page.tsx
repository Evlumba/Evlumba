import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Taşınıyorum",
  alternates: {
    canonical: "/tasiniyorum",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function TasiniyorumPage() {
  return (
    <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-black/10 bg-white/80 p-8 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.3)]">
      <p className="text-xs font-semibold tracking-[0.16em] text-slate-500">TAŞINIYORUM</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Çok yakında</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Taşınma dönemine özel iç mimar, mimar, dekorasyon ve uygulama planlama akışını yakında bu alanda
        sunacağız.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Ana sayfaya dön →
        </Link>
      </div>
    </section>
  );
}
