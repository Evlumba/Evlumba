import Link from "next/link";

const metrics = [
  { label: "Aktif Projeler", value: "5" },
  { label: "Potansiyel Müşteriler", value: "12" },
  { label: "Profil Görüntülemeleri", value: "150" },
  { label: "Sorular", value: "3" },
];

const menu = [
  { href: "/designer-panel", label: "Dashboard" },
  { href: "/designer-panel/profile", label: "Profil" },
  { href: "/designer-panel/projects", label: "Projelerim" },
  { href: "/designer-panel#leads", label: "Liderler (Leads)" },
  { href: "/designer-panel/profile#services", label: "Hizmetler" },
  { href: "/designer-panel/profile#reviews", label: "İncelemeler" },
  { href: "/designer-panel/profile#settings", label: "Ayarlar" },
];

export default function DesignerPanelPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4">
          <h1 className="text-sm font-bold text-slate-900">Evlumba Profesyonel Paneli</h1>
          <nav className="mt-4 space-y-1">
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2 text-sm ${
                  item.href === "/designer-panel"
                    ? "bg-sky-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-bold text-slate-900">Evlumba Profesyonel Paneli - Hoş Geldiniz!</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-600">{m.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{m.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-slate-900">Son Aktiviteler</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>Aktif Proje Bağlandı - Salon Yenileme</li>
                <li>Son Proje Bağlandı - Mutfak Tasarımı</li>
                <li>Yeni mesaj alındı - Teklif talebi</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-slate-900">Hızlı Bağlantılar</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/designer-panel/profile" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                  Profili Düzenle
                </Link>
                <Link href="/designer-panel/projects" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                  Proje Yükle
                </Link>
                <Link href="/pro/public-profile" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                  Public Profili Gör
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
