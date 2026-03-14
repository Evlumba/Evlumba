"use client";

import Link from "next/link";
import { useState } from "react";
import { getSession, logout } from "@/lib/storage";

type SessionLike = {
  role?: "homeowner" | "designer" | "admin" | "pendingDesigner" | string;
  name?: string;
};

function Icon({ name }: { name: "bell" | "chat" | "search" | "user" }) {
  const cls = "h-5 w-5";
  if (name === "search")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
        <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (name === "bell")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z" fill="currentColor" />
        <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  if (name === "chat")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M7 18l-3 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none">
      <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function Header() {
  const [session, setSession] = useState<SessionLike | null>(() => (getSession() as SessionLike | null) ?? null);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    window.location.href = `/designs?q=${encodeURIComponent(query)}`;
  }

  const isDesigner = session?.role === "designer";
  const isAdmin = session?.role === "admin";
  const pending = session?.role === "pendingDesigner";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F14]/80 backdrop-blur">
      {pending ? (
        <div className="bg-(--ev-warn) text-black">
          <div className="mx-auto max-w-6xl px-4 py-2 text-sm font-medium">
            Profesyonel başvurun inceleniyor. Onaylanınca “Designer Paneli” açılacak.
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-linear-to-br from-(--ev-accent-1) to-(--ev-accent-2) shadow-[0_10px_30px_rgba(124,58,237,0.35)]" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Evlumba</div>
            <div className="text-[11px] text-white/60">Keşfet • Kaydet • Bağlan</div>
          </div>
        </Link>

        <nav className="ml-2 hidden items-center gap-2 md:flex">
          <Link className="rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white" href="/designs">
            Tasarımlar
          </Link>
          <Link className="rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white" href="/professionals">
            Profesyoneller
          </Link>
          <Link className="rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white" href="/ai">
            İlham AI
          </Link>
          <Link className="rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white" href="/style-swipe">
            Tarzını Keşfet
          </Link>

          {isDesigner ? (
            <Link className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15" href="/designer-panel">
              Designer Paneli
            </Link>
          ) : null}

          {isAdmin ? (
            <Link className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15" href="/admin">
              Admin
            </Link>
          ) : null}
        </nav>

        <form onSubmit={submit} className="ml-auto hidden w-90 md:block">
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-white ring-1 ring-white/10 focus-within:ring-white/25">
            <Icon name="search" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tasarımlar, stiller, profesyoneller…"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link className="ev-glass p-2 text-white/90 hover:bg-white/10" href="/notifications" aria-label="Bildirimler">
            <Icon name="bell" />
          </Link>
          <Link className="ev-glass p-2 text-white/90 hover:bg-white/10" href="/messages" aria-label="Mesajlar">
            <Icon name="chat" />
          </Link>

          <button className="ev-glass p-2 text-white/90 hover:bg-white/10" onClick={() => setMenu((s) => !s)} aria-label="Menü">
            <Icon name="user" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-3 md:hidden">
        <div className="grid grid-cols-4 gap-2">
          <Link className="ev-glass px-2 py-2 text-center text-xs text-white" href="/designs">Tasarımlar</Link>
          <Link className="ev-glass px-2 py-2 text-center text-xs text-white" href="/professionals">Pro</Link>
          <Link className="ev-glass px-2 py-2 text-center text-xs text-white" href="/ai">AI</Link>
          <Link className="ev-glass px-2 py-2 text-center text-xs text-white" href="/style-swipe">Swipe</Link>
        </div>
      </div>

      {menu ? (
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <div className="rounded-2xl border border-white/10 bg-[#0B0F14] p-2 text-white shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="px-3 py-2 text-sm text-white/70">
              {session ? (
                <>Merhaba, <span className="text-white">{session.name ?? "Kullanıcı"}</span></>
              ) : (
                <>Giriş yapmadın</>
              )}
            </div>

            <div className="grid gap-1">
              <Link className="rounded-xl px-3 py-2 text-sm hover:bg-white/10" href="/profile">Profilim</Link>
              <Link className="rounded-xl px-3 py-2 text-sm hover:bg-white/10" href="/collections">Koleksiyonlarım</Link>
              <Link className="rounded-xl px-3 py-2 text-sm hover:bg-white/10" href="/feed">Ana Akış</Link>

              {!session ? (
                <>
                  <Link className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15" href="/login">Giriş</Link>
                  <Link className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15" href="/register">Kayıt</Link>
                </>
              ) : (
                <button
                  className="rounded-xl bg-white/10 px-3 py-2 text-left text-sm hover:bg-white/15"
                  onClick={async () => {
                    if (isLoggingOut) return;
                    setIsLoggingOut(true);
                    await logout();
                    setSession(null);
                    setMenu(false);
                    window.location.href = "/";
                  }}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Çıkış..." : "Çıkış"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
