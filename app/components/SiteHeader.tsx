"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSession, logout } from "@/lib/storage";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ---------------- 3D / Glass Orb Icon ---------------- */
function GlassOrb({
  tone = "violet",
  children,
}: {
  tone?: "violet" | "emerald" | "indigo";
  children: React.ReactNode;
}) {
  const tint =
    tone === "emerald"
      ? "rgba(16,185,129,0.24)"
      : tone === "indigo"
      ? "rgba(99,102,241,0.24)"
      : "rgba(139,92,246,0.24)";

  return (
    <span
      className={cn(
        "relative grid h-9 w-9 place-items-center rounded-2xl",
        "border border-white/40 bg-white/20 backdrop-blur-md",
        "ring-1 ring-black/8",
        "shadow-[0_18px_45px_-32px_rgba(0,0,0,0.45)]",
        "transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-[1.03]"
      )}
      aria-hidden="true"
    >
      {/* 3D highlight + tint */}
      <span
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `
            radial-gradient(circle at 30% 22%, rgba(255,255,255,0.80), rgba(255,255,255,0.12) 55%, rgba(255,255,255,0.0) 75%),
            radial-gradient(circle at 70% 85%, ${tint}, rgba(255,255,255,0.0) 62%)
          `,
        }}
      />
      {/* specular */}
      <span className="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-white/55 blur-[1px]" />
      <span className="relative text-slate-900/85">{children}</span>
    </span>
  );
}

/* ---------------- Icons (revize: daha fonksiyonel) ---------------- */
function TilesIcon() {
  // Keşfet: galeri/koleksiyon hissi
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5A1.5 1.5 0 0 1 10.5 12h-5A1.5 1.5 0 0 1 4 10.5z" />
      <path d="M12.8 5.5A1.5 1.5 0 0 1 14.3 4h4.2A1.5 1.5 0 0 1 20 5.5v5A1.5 1.5 0 0 1 18.5 12h-4.2a1.5 1.5 0 0 1-1.5-1.5z" />
      <path d="M4 14.3A1.5 1.5 0 0 1 5.5 12.8h5A1.5 1.5 0 0 1 12 14.3v4.2A1.5 1.5 0 0 1 10.5 20h-5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M14 13.2l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" />
    </svg>
  );
}

function ProStarIcon() {
  // Tasarımcılar: profesyonel + yıldız (seçkinlik)
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12z" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      <path d="M18.3 6.2l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
    </svg>
  );
}

function SwipeCardsIcon() {
  // Keşfetme Oyunu: kart swipe
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 7.2A2.2 2.2 0 0 1 10.2 5h7.6A2.2 2.2 0 0 1 20 7.2v9.6A2.2 2.2 0 0 1 17.8 19h-7.6A2.2 2.2 0 0 1 8 16.8z" />
      <path d="M4 9.2A2.2 2.2 0 0 1 6.2 7h.7" />
      <path d="M4 14.8A2.2 2.2 0 0 0 6.2 17h.7" />
      <path d="M12.2 11l-1.6 1.6 1.6 1.6" />
      <path d="M15.8 11l1.6 1.6-1.6 1.6" />
    </svg>
  );
}

function ForumIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h9" />
    </svg>
  );
}

function BlogIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function AiHomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.8v3" />
      <path d="M12 18.2v3" />
      <path d="M2.8 12h3" />
      <path d="M18.2 12h3" />
      <path d="M5.4 5.4 7.6 7.6" />
      <path d="M16.4 16.4 18.6 18.6" />
      <path d="M18.6 5.4 16.4 7.6" />
      <path d="M7.6 16.4 5.4 18.6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function ListingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M8 13h8" />
    </svg>
  );
}

function MessageIconWithBadge({ count }: { count: number }) {
  const display = count > 99 ? "99+" : String(count);
  return (
    <span className="relative inline-flex">
      <MessageIcon />
      {count > 0 ? (
        <span className="absolute -right-2.5 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-5 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.95)]">
          {display}
        </span>
      ) : null}
    </span>
  );
}

function CollectionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M8 13h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

/* ---------------- Brand ---------------- */
function Brand() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-white/45 transition"
    >
      <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl ring-1 ring-black/8 shadow-[0_14px_35px_-28px_rgba(0,0,0,0.35)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,102,241,1) 35%, rgba(16,185,129,1) 100%)",
          }}
        />
        <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-white/18 blur-xl" />
        <span className="relative text-white font-extrabold tracking-tight">E</span>
      </div>

      <div className="leading-tight">
        <div className="text-[15px] font-extrabold tracking-tight text-slate-900">
          Evlumba
        </div>
      </div>
    </Link>
  );
}

/* ---------------- Nav Item ---------------- */
function NavItem({
  href,
  label,
  icon,
  active,
  disabled,
  aiAccent,
  hideIcon,
}: {
  href: string;
  label: React.ReactNode;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  aiAccent?: boolean;
  hideIcon?: boolean;
}) {
  if (disabled) {
    return (
      <div
        className={cn(
          "group relative inline-flex items-center gap-2 rounded-2xl px-3 py-2",
          aiAccent
            ? "border-cyan-300/70 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(99,102,241,0.14),rgba(255,255,255,0.55))]"
            : "border border-black/10 bg-white/45",
          "backdrop-blur",
          "shadow-[0_12px_35px_-30px_rgba(0,0,0,0.18)]",
          "cursor-not-allowed select-none opacity-75"
        )}
        aria-disabled="true"
      >
        {!hideIcon ? (
          <span className={cn(aiAccent && "relative after:absolute after:-right-1 after:-top-1 after:h-2 after:w-2 after:rounded-full after:bg-cyan-400/90 after:shadow-[0_0_0_4px_rgba(34,211,238,0.18)] after:animate-pulse")}>
            {icon}
          </span>
        ) : null}
        <span className={cn("text-sm font-semibold text-slate-700 whitespace-nowrap", aiAccent && "text-slate-800")}>
          {label}
        </span>
        {aiAccent ? (
          <span className="rounded-full border border-cyan-300/80 bg-white/70 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-cyan-700">
            AI
          </span>
        ) : null}
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2",
            "hidden rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm",
            "group-hover:block"
          )}
        >
          Çok yakında
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-2xl px-3 py-2",
        "border border-black/10 bg-white/55 backdrop-blur",
        "shadow-[0_12px_35px_-30px_rgba(0,0,0,0.22)]",
        "hover:bg-white/80 transition",
        active && "bg-white/90"
      )}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}

/* ---------------- Glass Register Button ---------------- */
function GlassRegisterButton({
  href,
  labelDesktop = "Ücretsiz kayıt",
  labelCompact = "Kayıt",
  className = "",
}: {
  href: string;
  labelDesktop?: string;
  labelCompact?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl",
        "border border-black/10 backdrop-blur-xl",
        "text-slate-900 font-semibold whitespace-nowrap",
        "shadow-[0_16px_45px_-34px_rgba(0,0,0,0.28)]",
        "transition hover:shadow-[0_22px_60px_-40px_rgba(0,0,0,0.32)]",
        "px-4 py-2.5 text-sm",
        className
      )}
      style={{
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.16), rgba(99,102,241,0.12), rgba(16,185,129,0.14))",
      }}
    >
      {/* subtle inner sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.70), rgba(255,255,255,0.0) 58%)",
        }}
      />
      <span className="relative hidden xl:inline">{labelDesktop}</span>
      <span className="relative xl:hidden">{labelCompact}</span>
      <span aria-hidden="true" className="relative text-slate-700">
        →
      </span>
    </Link>
  );
}

function ProfileMenu({
  profileHref,
  isLoggingOut,
  onLogout,
  compact,
}: {
  profileHref: string;
  isLoggingOut: boolean;
  onLogout: () => void;
  compact?: boolean;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="menu"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10",
          "bg-white/65 text-slate-800 hover:bg-white transition",
          "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.18)] backdrop-blur",
          "font-semibold whitespace-nowrap",
          compact ? "px-3.5 py-2 text-sm" : "px-4 py-2.5 text-sm"
        )}
      >
        <UserIcon />
        <span className={compact ? "hidden sm:inline" : "hidden 2xl:inline"}>Profil</span>
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-slate-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className={cn(
          "invisible absolute right-0 top-full z-40 mt-2 w-48 rounded-2xl border border-black/10 bg-white/95 p-1.5 shadow-[0_18px_45px_-30px_rgba(0,0,0,0.35)] backdrop-blur",
          "translate-y-1 opacity-0 transition-all duration-150",
          "group-hover:visible group-hover:translate-y-0 group-hover:opacity-100",
          "group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
        )}
        role="menu"
      >
        <Link
          href={profileHref}
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          <UserIcon />
          Profil Ayarları
        </Link>
        <Link
          href="/ilanlar"
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          <ListingsIcon />
          İlanlar
        </Link>
        <Link
          href="/blog"
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          <BlogIcon />
          Blog
        </Link>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4.5 w-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          {isLoggingOut ? "Çıkış..." : "Çıkış"}
        </button>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [role, setRole] = React.useState<"designer" | "homeowner" | null>(null);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const cached = getSession();
    setIsLoggedIn(Boolean(cached));
    if (cached?.role === "designer" || cached?.role === "homeowner") {
      setRole(cached.role);
    }

    void supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
      const r = data.session?.user?.user_metadata?.role;
      if (r === "designer" || r === "homeowner") setRole(r);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoggedIn(!!session);
      if (!session?.user) {
        setRole(null);
        return;
      }
      const metadataRole = session.user.user_metadata?.role;
      if (metadataRole === "designer" || metadataRole === "homeowner") {
        setRole(metadataRole);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.role === "designer" || profile?.role === "homeowner") {
        setRole(profile.role);
      }
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "evlumba_session_v1") return;
      const next = getSession();
      setIsLoggedIn(Boolean(next));
      if (next?.role === "designer" || next?.role === "homeowner") {
        setRole(next.role);
      } else {
        setRole(null);
      }
    };

    const handleSessionChanged = () => {
      const next = getSession();
      setIsLoggedIn(Boolean(next));
      if (next?.role === "designer" || next?.role === "homeowner") {
        setRole(next.role);
      } else {
        setRole(null);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("evlumba:session-changed", handleSessionChanged);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("evlumba:session-changed", handleSessionChanged);
    };
  }, []);

  React.useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    const refreshUnread = async () => {
      const { data, error } = await supabase.rpc("get_unread_message_count");
      if (cancelled || error) return;
      setUnreadCount(typeof data === "number" ? data : 0);
    };

    void refreshUnread();

    const handleMessagesUpdated = () => {
      void refreshUnread();
    };

    const intervalId = window.setInterval(() => {
      void refreshUnread();
    }, 15000);

    window.addEventListener("focus", handleMessagesUpdated);
    window.addEventListener("evlumba:messages-updated", handleMessagesUpdated);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleMessagesUpdated);
      window.removeEventListener("evlumba:messages-updated", handleMessagesUpdated);
    };
  }, [isLoggedIn]);

  const profileHref = role === "designer" ? "/designer-panel/profile" : "/profile";
  const messagesHref = "/messages";
  const messagesLabel = "Mesajlar";
  const projectsHref = "/designer-panel/projects";
  const collectionsHref = "/profile/collections";
  const showCollectionsShortcut = role === "homeowner";

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const nav = [
    {
      id: "kesfet",
      href: "/kesfet",
      label: "Keşfet",
      icon: (
        <GlassOrb tone="emerald">
          <TilesIcon />
        </GlassOrb>
      ),
    },
    {
      id: "tasarimcilar",
      href: "/tasarimcilar",
      label: "Tasarımcılar",
      icon: (
        <GlassOrb tone="indigo">
          <ProStarIcon />
        </GlassOrb>
      ),
    },
    {
      id: "oyun",
      href: "/oyun",
      label: (
        <>
          <span className="hidden xl:inline">Keşfetme Oyunu</span>
          <span className="xl:hidden">Oyun</span>
        </>
      ),
      icon: (
        <GlassOrb tone="violet">
          <SwipeCardsIcon />
        </GlassOrb>
      ),
    },
    {
      id: "forum",
      href: "/forum",
      label: "Forum",
      icon: (
        <GlassOrb tone="indigo">
          <ForumIcon />
        </GlassOrb>
      ),
    },
    {
      id: "ai-evini-tasarla",
      href: "#",
      label: "AI ile Evini Tasarla",
      disabled: true,
      icon: (
        <GlassOrb tone="violet">
          <AiHomeIcon />
        </GlassOrb>
      ),
    },
  ];

  return (
    /* ✅ Mobilde sticky yok — sadece lg+ sticky */
<header className="relative mt-3 sm:mt-4 lg:mt-0 lg:sticky lg:top-4 z-50">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="rounded-[28px] border border-black/5 bg-white/60 backdrop-blur-xl shadow-[0_30px_80px_-65px_rgba(0,0,0,0.55)]">
          {/* MOBILE/TABLET */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between gap-3 px-3.5 pt-3.5">
              <Brand />

              <div className="flex items-center gap-2">
                {isLoggedIn ? (
                  <>
                    {role === "designer" ? (
                      <Link
                        href={projectsHref}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10",
                          "bg-white/65 text-slate-800 hover:bg-white transition",
                          "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.18)] backdrop-blur",
                          "px-3.5 py-2 text-sm font-semibold whitespace-nowrap"
                        )}
                      >
                        <ProjectsIcon />
                        <span className="hidden sm:inline">Projelerim</span>
                      </Link>
                    ) : null}
                    {showCollectionsShortcut ? (
                      <Link
                        href={collectionsHref}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10",
                          "bg-white/65 text-slate-800 hover:bg-white transition",
                          "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.18)] backdrop-blur",
                          "px-3.5 py-2 text-sm font-semibold whitespace-nowrap"
                        )}
                      >
                        <CollectionIcon />
                        <span className="hidden sm:inline">Koleksiyonlar</span>
                      </Link>
                    ) : null}
                    <Link
                      href={messagesHref}
                      title={messagesLabel}
                      aria-label={messagesLabel}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10",
                        "bg-white/65 text-slate-800 hover:bg-white transition",
                        "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.18)] backdrop-blur",
                        "px-3 py-2 text-sm font-semibold whitespace-nowrap"
                      )}
                    >
                      <MessageIconWithBadge count={unreadCount} />
                    </Link>
                    <ProfileMenu
                      profileHref={profileHref}
                      isLoggingOut={isLoggingOut}
                      onLogout={() => {
                        void handleLogout();
                      }}
                      compact
                    />
                  </>
                ) : (
                  <>
                    <Link
                      href="/giris"
                      className={cn(
                        "inline-flex items-center justify-center rounded-2xl border border-black/10",
                        "bg-white/55 text-slate-700 hover:bg-white/85 hover:text-slate-900 transition",
                        "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.18)] backdrop-blur",
                        "px-3.5 py-2 text-sm font-semibold whitespace-nowrap"
                      )}
                    >
                      Giriş
                    </Link>

                    <GlassRegisterButton
                      href="/kayit"
                      labelDesktop="Ücretsiz kayıt"
                      labelCompact="Kayıt"
                      className="px-3.5 py-2"
                    />
                  </>
                )}
              </div>
            </div>

            {/* yatay scroll nav (hamburger yok) */}
            <div className="px-3.5 pt-3">
              <div
                className={cn(
                  "flex items-center gap-2 overflow-x-auto pb-1",
                  "[-ms-overflow-style:none] [scrollbar-width:none]"
                )}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {nav.map((n) => (
                  <NavItem
                    key={n.id}
                    href={n.href}
                    label={n.label}
                    icon={n.icon}
                    active={pathname === n.href}
                    disabled={Boolean(n.disabled)}
                    aiAccent={n.id === "ai-evini-tasarla"}
                    hideIcon={n.id === "ai-evini-tasarla"}
                  />
                ))}
              </div>
            </div>

            {/* search */}
            <div className="px-3.5 pt-3 pb-3.5">
              <form action="/kesfet" method="GET" className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    name="q"
                    placeholder="tarz, oda, şehir, profesyonel…"
                    className={cn(
                      "w-full rounded-2xl border border-black/10 bg-white/75",
                      "pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
                      "outline-none focus:ring-2 focus:ring-black/10"
                    )}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  className={cn(
                    "shrink-0 rounded-2xl border border-black/10 bg-white/70 text-slate-800 font-semibold",
                    "backdrop-blur hover:bg-white/95 transition",
                    "shadow-[0_12px_35px_-28px_rgba(0,0,0,0.25)]",
                    "px-4 py-2.5 text-sm"
                  )}
                >
                  Ara
                </button>
              </form>
            </div>
          </div>

          {/* DESKTOP */}
          <div className="hidden lg:block px-4 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                <Brand />
              </div>

              <nav className="shrink-0 flex items-center gap-2">
                {nav.map((n) => (
                  <NavItem
                    key={n.id}
                    href={n.href}
                    label={n.label}
                    icon={n.icon}
                    active={pathname === n.href}
                    disabled={Boolean(n.disabled)}
                    aiAccent={n.id === "ai-evini-tasarla"}
                    hideIcon={n.id === "ai-evini-tasarla"}
                  />
                ))}
              </nav>

              {/* actions */}
              <div className="ml-auto shrink-0 flex items-center gap-2">
                {isLoggedIn ? (
                  <>
                    {role === "designer" ? (
                      <Link
                        href={projectsHref}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10",
                          "bg-white/65 text-slate-800 hover:bg-white transition",
                          "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.18)] backdrop-blur",
                          "px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
                        )}
                      >
                        <ProjectsIcon />
                        Projelerim
                      </Link>
                    ) : null}
                    {showCollectionsShortcut ? (
                      <Link
                        href={collectionsHref}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10",
                          "bg-white/65 text-slate-800 hover:bg-white transition",
                          "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.18)] backdrop-blur",
                          "px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
                        )}
                      >
                        <CollectionIcon />
                        Koleksiyonlar
                      </Link>
                    ) : null}
                    <Link
                      href={messagesHref}
                      title={messagesLabel}
                      aria-label={messagesLabel}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10",
                        "bg-white/65 text-slate-800 hover:bg-white transition",
                        "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.18)] backdrop-blur",
                        "px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap"
                      )}
                    >
                      <MessageIconWithBadge count={unreadCount} />
                    </Link>
                    <ProfileMenu
                      profileHref={profileHref}
                      isLoggingOut={isLoggingOut}
                      onLogout={() => {
                        void handleLogout();
                      }}
                    />
                </>
              ) : (
                  <>
                    <Link
                      href="/giris"
                      className={cn(
                        "inline-flex items-center justify-center rounded-2xl border border-black/10",
                        "bg-white/55 text-slate-700 hover:bg-white/85 hover:text-slate-900 transition",
                        "shadow-[0_10px_30px_-26px_rgba(0,0,0,0.18)] backdrop-blur",
                        "px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
                      )}
                    >
                      Giriş
                    </Link>

                    <GlassRegisterButton href="/kayit" />
                  </>
                )}
              </div>
            </div>

            {/* search row */}
            <div className="pt-3">
              <form action="/kesfet" method="GET" className="flex items-center gap-3 w-full">
                <div className="relative flex-1 min-w-0">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    name="q"
                    placeholder="Tarz, oda, şehir veya profesyonel ara..."
                    className={cn(
                      "w-full rounded-2xl border border-black/10 bg-white/80",
                      "pl-11 pr-4 py-3 text-base text-slate-900 placeholder:text-slate-400",
                      "outline-none focus:ring-2 focus:ring-black/10"
                    )}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  className={cn(
                    "shrink-0 rounded-2xl border border-black/10 bg-white text-slate-800 font-semibold",
                    "backdrop-blur hover:bg-white/95 transition",
                    "shadow-[0_12px_35px_-28px_rgba(0,0,0,0.25)]",
                    "px-6 py-3 text-base"
                  )}
                  title="Ara"
                >
                  Ara
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="h-3 lg:h-0" />
      </div>
    </header>
  );
}
