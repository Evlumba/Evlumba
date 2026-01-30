import Link from "next/link";

export default function CollectionsLegacyPage() {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Koleksiyonlar</h1>
      <p className="mt-2 text-gray-600">
        Koleksiyon yönetimi artık “Profil &gt; Koleksiyonlarım” altında.
      </p>

      <div className="mt-4 flex gap-2">
        <Link
          href="/profile/collections"
          className="rounded-xl bg-black px-4 py-2 text-sm text-white"
        >
          Koleksiyonlarıma Git
        </Link>
        <Link
          href="/designs"
          className="rounded-xl border px-4 py-2 text-sm"
        >
          Tasarımlar
        </Link>
      </div>
    </div>
  );
}
