import Link from "next/link";

export default function AIPage() {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">İlham AI</h1>
      <p className="mt-2 text-gray-600">
        Burayı sıradaki adımda chat + brief + plan (koleksiyon/teklif/kopyala) şeklinde kuracağız.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link className="rounded-xl bg-black px-4 py-2 text-sm text-white" href="/style-swipe">
          Tarzını Keşfet
        </Link>
        <Link className="rounded-xl border px-4 py-2 text-sm" href="/designs">
          Tasarımlar
        </Link>
        <Link className="rounded-xl border px-4 py-2 text-sm" href="/professionals">
          Profesyoneller
        </Link>
      </div>
    </div>
  );
}
