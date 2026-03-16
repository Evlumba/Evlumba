import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200/70 bg-white/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-sm font-semibold text-neutral-900">Evlumba</div>
          <p className="mt-2 text-sm text-neutral-600 max-w-md">
            İç mekân ilhamını keşfet, tarzını netleştir, doğru tasarımcıyla hızlıca eşleş.
            Türkiye-öncelikli, modern bir keşif platformu.
          </p>
          <p className="mt-4 text-xs text-neutral-500">
            © {new Date().getFullYear()} Evlumba
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold text-neutral-900">Ürün</div>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link className="hover:text-neutral-900" href="/kesfet">Keşfet</Link></li>
            <li><Link className="hover:text-neutral-900" href="/oyun">Keşfetme Oyunu</Link></li>
            <li><Link className="hover:text-neutral-900" href="/ai-match">AI Matchmaker</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-neutral-900">Tasarımcı</div>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link className="hover:text-neutral-900" href="/tasarimcilar">Liste</Link></li>
            <li><Link className="hover:text-neutral-900" href="/kayit">Profil oluştur</Link></li>
            <li><Link className="hover:text-neutral-900" href="/giris">Giriş</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
