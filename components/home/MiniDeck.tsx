import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evlumba",
  description: "Keşfet • Kaydet • Bağlan — Turkey-first interior discovery platform",
};

function HeaderIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        width: 40,
        height: 40,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        background: "rgba(255,255,255,0.78)",
        border: "1px solid rgba(15,23,42,0.10)",
      }}
    >
      {children}
    </span>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="ev-bg min-h-screen">
          {/* Header */}
          <header className="ev-nav sticky top-0 z-50">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex h-16 items-center justify-between gap-3">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 16,
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,0.9), rgba(16,185,129,0.85))",
                      boxShadow: "0 10px 20px rgba(15,23,42,0.12)",
                    }}
                  />
                  <div style={{ lineHeight: 1.05 }}>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>Evlumba</div>
                    <div style={{ fontSize: 12, color: "rgba(15,23,42,0.60)" }}>
                      Keşfet • Kaydet • Bağlan
                    </div>
                  </div>
                </Link>

                {/* Nav */}
                <nav className="hidden md:flex items-center gap-6">
                  {[
                    { href: "/designs", label: "Tasarımlar" },
                    { href: "/professionals", label: "Profesyoneller" },
                    { href: "/ai", label: "İlham AI" },
                    { href: "/discover", label: "Tarzını Keşfet" },
                  ].map((x) => (
                    <Link
                      key={x.href}
                      href={x.href}
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "rgba(15,23,42,0.72)",
                        textDecoration: "none",
                      }}
                    >
                      {x.label}
                    </Link>
                  ))}
                </nav>

                {/* Search + actions */}
                <div className="flex items-center gap-2">
                  <form action="/designs" className="hidden sm:flex items-center gap-2">
                    <input
                      name="q"
                      placeholder="Tasarım, stil, profesyonel..."
                      style={{
                        width: 340,
                        height: 40,
                        borderRadius: 14,
                        padding: "0 14px",
                        background: "rgba(255,255,255,0.78)",
                        border: "1px solid rgba(15,23,42,0.10)",
                        outline: "none",
                        color: "#0f172a",
                      }}
                    />
                    <button className="ev-btn ev-btn-primary" type="submit">
                      Ara
                    </button>
                  </form>

                  <Link href="/notifications" aria-label="Bildirimler">
                    <HeaderIcon>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                        <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                        <path d="M13.73 21a2 2 0 01-3.46 0" />
                      </svg>
                    </HeaderIcon>
                  </Link>

                  <Link href="/login" className="ev-btn ev-btn-ghost">
                    Giriş
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Page */}
          {children}

          {/* Footer (light, clean) */}
          <footer style={{ borderTop: "1px solid rgba(15,23,42,0.08)" }}>
            <div className="mx-auto max-w-7xl px-4 py-10">
              <div className="grid gap-8 md:grid-cols-4">
                <div>
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>Evlumba</div>
                  <div className="ev-soft" style={{ fontSize: 13, marginTop: 8 }}>
                    Keşfi oyunlaştırır, AI ile ihtiyacı netleştirir, koleksiyonla kararı hızlandırır ve doğru profesyonele bağlar.
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>Keşfet</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <Link href="/designs">Tasarımlar</Link>
                    <Link href="/professionals">Profesyoneller</Link>
                    <Link href="/discover">Tarzını Keşfet</Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>Ürün</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <Link href="/ai">İlham AI</Link>
                    <Link href="/collections">Koleksiyonlar</Link>
                    <Link href="/messages">Mesajlar</Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>Hesap</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <Link href="/login">Giriş</Link>
                    <Link href="/register">Kayıt</Link>
                    <Link href="/support">Destek</Link>
                  </div>
                </div>
              </div>

              <div className="ev-soft" style={{ fontSize: 12, marginTop: 26 }}>
                © {new Date().getFullYear()} Evlumba — Tüm hakları saklıdır.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
