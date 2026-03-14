"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getSession, logout } from "../lib/storage";
import { toast } from "../lib/toast";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm transition ${
        active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(() => getSession() || null);
  const [q, setQ] = useState("");

  const isLoggedIn = !!session;

  const userLabel = useMemo(() => {
    if (!session) return "Misafir";
    return session?.name || session?.email || "Hesabım";
  }, [session]);

  function goSearch() {
    const query = q.trim();
    if (!query) return toast("Arama için bir şey yaz");
    toast(`Arama: "${query}" (sonraki adımda gerçek arama sonuçları bağlayacağız)`);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-black text-white font-bold">
              E
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Evlumba</div>
              <div className="text-xs text-gray-500">Keşfet • Kaydet • Paylaş</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/designs" label="Tasarımlar" />
            <NavLink href="/professionals" label="Profesyoneller" />
            <NavLink href="/ai" label="İlham AI" />
            <NavLink href="/style-swipe" label="Tarzını Keşfet" />
          </nav>
        </div>

        {/* Middle search */}
        <div className="hidden w-[420px] items-center gap-2 md:flex">
          <div className="flex w-full items-center gap-2 rounded-2xl border bg-white px-3 py-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tasarım, oda, stil, profesyonel ara…"
              className="w-full bg-transparent text-sm outline-none"
            />
            <button
              className="rounded-xl bg-black px-3 py-2 text-xs text-white"
              onClick={goSearch}
            >
              Ara
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            title="Bildirimler"
          >
            🔔
          </Link>

          <Link
            href="/messages"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            title="Mesajlar"
          >
            💬
          </Link>

          {/* User menu */}
          <div className="relative">
            <button
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpen((v) => !v)}
            >
              {userLabel} ▾
            </button>

            {open ? (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border bg-white shadow-lg">
                <div className="px-4 py-3 text-xs text-gray-500 border-b">
                  {isLoggedIn ? "Hesap menüsü" : "Misafir moddasın"}
                </div>

                <div className="p-2">
                  <Link
                    className="block rounded-xl px-3 py-2 text-sm hover:bg-gray-50"
                    href="/profile"
                    onClick={() => setOpen(false)}
                  >
                    Profilim
                  </Link>

                  <Link
                    className="block rounded-xl px-3 py-2 text-sm hover:bg-gray-50"
                    href="/profile/collections"
                    onClick={() => setOpen(false)}
                  >
                    Koleksiyonlarım
                  </Link>

                  <Link
                    className="block rounded-xl px-3 py-2 text-sm hover:bg-gray-50"
                    href="/designs"
                    onClick={() => setOpen(false)}
                  >
                    Kaydedilecek Tasarımlar
                  </Link>

                  <div className="my-2 border-t" />

                  {!isLoggedIn ? (
                    <>
                      <Link
                        className="block rounded-xl px-3 py-2 text-sm hover:bg-gray-50"
                        href="/login"
                        onClick={() => setOpen(false)}
                      >
                        Giriş Yap
                      </Link>
                      <Link
                        className="block rounded-xl px-3 py-2 text-sm hover:bg-gray-50"
                        href="/register"
                        onClick={() => setOpen(false)}
                      >
                        Kayıt Ol
                      </Link>
                    </>
                  ) : (
                    <button
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => {
                        logout?.();
                        setSession(null);
                        setOpen(false);
                        toast("Çıkış yapıldı");
                        router.push("/");
                      }}
                    >
                      Çıkış
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Mobile quick */}
          <div className="md:hidden">
            <Link className="rounded-xl border px-3 py-2 text-sm" href="/designs">
              Menü
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
