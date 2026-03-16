// app/pro-bul/page.tsx
import Link from "next/link";

export default function Page() {
  return (
    <div className="mt-10 rounded-3xl border border-black/5 bg-white/60 p-8 backdrop-blur">
      <div className="text-2xl font-semibold tracking-tight text-slate-900">
        Profesyonel Bul (yakında)
      </div>
      <div className="mt-2 text-sm text-slate-600">
        Burayı bir sonraki adımda tasarlayacağız: hızlı brief → uygun tasarımcı önerileri.
      </div>

      <Link className="mt-6 inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold" href="/kesfet">
        Keşfet’e dön →
      </Link>
    </div>
  );
}
