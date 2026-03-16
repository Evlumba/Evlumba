import Link from "next/link";

export default function ProBul() {
  return (
    <div className="mt-6 rounded-[28px] border border-black/10 bg-white/70 backdrop-blur p-7 shadow-[0_30px_90px_-72px_rgba(0,0,0,0.45)]">
      <div className="text-xs font-semibold tracking-widest text-slate-500">
        PROFESYONEL
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        Doğru tasarımcıyı bulalım
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600 max-w-[70ch]">
        Burası bir sonraki adım. Burada “kısa brief” akışı + tasarımcı önerileri olacak.
        Şimdilik placeholder.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/kayit"
          className="rounded-2xl border border-black/10 bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white transition"
        >
          Ücretsiz kayıt →
        </Link>
        <Link
          href="/kesfet"
          className="rounded-2xl border border-black/10 bg-white/65 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white transition"
        >
          Keşfet’e dön
        </Link>
      </div>
    </div>
  );
}
