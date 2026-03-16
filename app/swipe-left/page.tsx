import Link from "next/link";

export default function StyleSwipePage() {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Tarzını Keşfet</h1>
      <p className="mt-2 text-gray-600">
        Bir sonraki adımda “Hızlı 8 tur” tam oynanabilir olacak: Like / Skip / Golden Like + completion.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link className="rounded-xl bg-black px-4 py-2 text-sm text-white" href="/designs">
          Tasarımlara git
        </Link>
        <Link className="rounded-xl border px-4 py-2 text-sm" href="/ai">
          İlham AI
        </Link>
        <Link className="rounded-xl border px-4 py-2 text-sm" href="/login">
          Demo giriş yap
        </Link>
      </div>
    </div>
  );
}
