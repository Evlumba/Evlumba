// app/page.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import SiteTestimonials from "./components/SiteTestimonials";

type Project = {
  id: string;
  title: string;
  tag: string;
  imageUrl: string;
  href: string;
};

type Designer = {
  id: string;
  name: string;
  city: string;
  specialty: string;
  rating: number;
  projects: number;
  coverUrl: string;
  avatarUrl: string;
  href: string;

  fastReplyLabel: string;
  pinnedReview: string;
  pinnedReviewBy: string;

  isOnline?: boolean;
  lastActiveLabel?: string; // örn: "12 dk önce", "1 saat önce"
};

const projects: Project[] = [
  {
    id: "p1",
    title: "Sıcak & modern salon — küçük alan",
    tag: "SALON • MODERN",
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=70",
    href: "/kesfet?tag=salon-modern",
  },
  {
    id: "p2",
    title: "Minimal mutfak — maksimum depolama",
    tag: "MUTFAK • MINIMAL",
    imageUrl:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=70",
    href: "/kesfet?tag=mutfak-minimal",
  },
  {
    id: "p3",
    title: "Japandi yatak odası — sakin tonlar",
    tag: "YATAK ODASI • JAPANDI",
    imageUrl:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=70",
    href: "/kesfet?tag=japandi",
  },
  {
    id: "p4",
    title: "Küçük banyo — ferah his",
    tag: "BANYO • SMALL SPACE",
    imageUrl:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=70",
    href: "/kesfet?tag=kucuk-banyo",
  },
  {
    id: "p5",
    title: "Aydınlık antre — minimal karşılama",
    tag: "ANTRE • MINIMAL",
    imageUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=70",
    href: "/kesfet?tag=antre-minimal",
  },
  {
    id: "p6",
    title: "Bohem yatak odası — sıcak dokular",
    tag: "YATAK ODASI • BOHEM",
    imageUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=70",
    href: "/kesfet?tag=bohem",
  },
  {
    id: "p7",
    title: "Küçük balkon — şehirde nefes",
    tag: "BALKON • SMALL SPACE",
    imageUrl:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1400&q=70",
    href: "/kesfet?tag=balkon",
  },
  {
    id: "p8",
    title: "Modern banyo — temiz çizgiler",
    tag: "BANYO • MODERN",
    imageUrl:
      "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1400&q=70",
    href: "/kesfet?tag=banyo-modern",
  },
];

const designers: Designer[] = [
  {
    id: "d1",
    name: "Elif A.",
    city: "İstanbul",
    specialty: "Modern • Konut",
    rating: 4.8,
    projects: 46,
    coverUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=70",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=70",
    href: "/tasarimcilar/elif-a",
    fastReplyLabel: "Ortalama 2 saatte dönüş",
    pinnedReview:
      "Brief’i çok hızlı kavradı; aynı gün 2 alternatif plan + moodboard ile döndü. İletişim çok rahattı.",
    pinnedReviewBy: "Zeynep • Salon yenileme",
  },
  {
    id: "d2",
    name: "Mert K.",
    city: "Ankara",
    specialty: "Minimal • Ofis",
    rating: 4.7,
    projects: 31,
    coverUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=70",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=70",
    href: "/tasarimcilar/mert-k",
    fastReplyLabel: "Aynı gün dönüş",
    pinnedReview:
      "Küçük ofisi ferah hissettirdi. Ölçü–mobilya uyumu ve depolama çözümleri çok yerindeydi.",
    pinnedReviewBy: "Bora • Ofis düzenleme",
  },
  {
    id: "d3",
    name: "Derya S.",
    city: "İzmir",
    specialty: "Bohem • Konut",
    rating: 4.9,
    projects: 52,
    coverUrl:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1400&q=70",
    avatarUrl:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=256&q=70",
    href: "/tasarimcilar/derya-s",
    fastReplyLabel: "30 dk içinde dönüş",
    pinnedReview:
      "Dokuları ve ışığı çok iyi kullandı. Bohem ama dağınık değil; ‘premium sıcaklık’ gibi oldu.",
    pinnedReviewBy: "Ece • Yatak odası",
  },
];

function MiniIcon({
  path,
  className = "h-5 w-5",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl border border-black/5 bg-white/70 backdrop-blur shadow-[0_20px_60px_-50px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}

function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  children: ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "border border-black/10 bg-white text-slate-900 hover:bg-black/5";
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div>
      <div className="text-xs font-extrabold tracking-widest text-slate-500">
        {eyebrow}
      </div>
      <div className="mt-2 text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </div>
      <div className="mt-2 text-sm text-slate-600 max-w-2xl">{desc}</div>
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const tagText = p.tag.replace("•", "·");

  const [t1, t2] = p.title.split("—").map((x) => x?.trim());
  const titleMain = t1 || p.title;
  const titleSub = t2 || "";

  return (
    <Link
      href={p.href}
      className="group block overflow-hidden rounded-3xl border border-black/5 bg-white/55 backdrop-blur
                 shadow-[0_18px_55px_-52px_rgba(0,0,0,0.35)]
                 transition duration-300 hover:bg-white/70 hover:-translate-y-0.5"
    >
      {/* IMAGE */}
      <div className="relative aspect-16/10 overflow-hidden bg-black/5">
        <img
          src={p.imageUrl}
          alt={p.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          loading="lazy"
        />

        {/* çok hafif gradient (sadece tag için) */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/25 via-transparent to-transparent" />

        {/* TAG (glass pill) */}
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5
                        text-[11px] font-semibold tracking-wide text-white backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
          {tagText}
        </div>
      </div>

      {/* BODY */}
      <div className="p-4">
        {/* TITLE (beyaz alanda) */}
        <div className="min-w-0">
          <div className="text-[15px] md:text-[16px] font-semibold tracking-tight text-slate-900 leading-snug">
            {titleMain}
          </div>
          {titleSub ? (
            <div className="mt-1 text-[12.5px] md:text-[13px] text-slate-600">
              {titleSub}
            </div>
          ) : null}
        </div>

        {/* alt aksiyon barı (senin beğendiğin kısım) */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
              <span className="font-semibold tabular-nums">1.2k</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
              <span className="font-semibold tabular-nums">142</span>
            </span>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5
                           text-xs font-semibold text-slate-800 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.25)]">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Kaydet
          </span>
        </div>
      </div>
    </Link>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 17.27l-5.18 3.04 1.39-5.94L3 9.24l6.04-.52L12 3l2.96 5.72 6.04.52-5.21 5.13 1.39 5.94z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4l6 6" />
      <path d="M8 10l6-6" />
      <path d="M9 7l8 8" />
      <path d="M6 12l6 6" />
      <path d="M8 14l-5 5" />
      <path d="M14 20l-6-6" />
    </svg>
  );
}

/** ✅ TASARIMCI KARTI: CTA yok + pinned yorum pin ikonuyla */
function DesignerCard({ d }: { d: Designer }) {
  return (
    <Link
      href={d.href}
      className="group block overflow-hidden rounded-3xl border border-black/5 bg-white/60 backdrop-blur
                 shadow-[0_18px_55px_-50px_rgba(0,0,0,0.35)]
                 transition hover:bg-white/70 hover:-translate-y-0.5"
    >
      {/* Cover */}
      <div className="relative aspect-16/10 overflow-hidden bg-black/5">
        <img
          src={d.coverUrl}
          alt={`${d.name} kapak`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-black/0 to-transparent" />

        {/* Hızlı dönüş badge */}
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
          <span className="text-emerald-300">
            <BoltIcon />
          </span>
          {d.fastReplyLabel}
        </div>

        {/* Kimlik */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center gap-3">
            <img
              src={d.avatarUrl}
              alt={`${d.name} avatar`}
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/25 shadow-sm"
              loading="lazy"
            />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-white">
                {d.name}
              </div>
              <div className="truncate text-xs text-white/80">
                {d.city} • {d.specialty}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* rating pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
          <span className="text-amber-500">
            <StarIcon />
          </span>
          {d.rating.toFixed(1)}
          <span className="text-slate-400 font-normal">•</span>
          <span className="font-normal text-slate-600">{d.projects} proje</span>
        </div>

        {/* Pinned review */}
        <div className="mt-3 relative rounded-2xl border border-black/10 bg-white/70 p-3">
          <div
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-xl border border-black/10 bg-white/80 text-slate-600 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.25)]"
            title="Sabit yorum"
            aria-label="Sabit yorum"
          >
            <PinIcon />
          </div>

          <div className="text-sm text-slate-800 leading-snug pr-10">
            “{d.pinnedReview}”
          </div>

          <div className="mt-2 text-xs text-slate-500">— {d.pinnedReviewBy}</div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Profili aç</span>

          <span
            className={`inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-2.5 py-1 font-semibold
            ${d.isOnline ? "text-emerald-700" : "text-slate-600"}`}
            title={d.isOnline ? "Şu an online" : "Son aktif zamanı"}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full
      ${d.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
              aria-hidden="true"
            />
            {d.isOnline ? "Şu an online" : `${d.lastActiveLabel ?? "Bugün aktif"}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="relative">
      {/* HERO */}
      <section className="mt-6 md:mt-8">
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-x-6 -inset-y-6 rounded-[44px] bg-white/55 backdrop-blur-2xl"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden rounded-4xl border border-black/5 bg-white/45 backdrop-blur-xl shadow-[0_35px_90px_-70px_rgba(0,0,0,0.45)]">
            <div className="p-5 md:p-7">
              <div className="grid gap-6 md:grid-cols-12 items-start">
                {/* LEFT */}
                <div className="md:col-span-7">
                  <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-xs text-slate-800 backdrop-blur shadow-[0_10px_30px_-22px_rgba(0,0,0,0.25)]">
                    <span
                      className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
                      aria-hidden="true"
                    />
                    <span className="font-semibold">Yeni nesil keşif</span>
                    <span className="h-3 w-px bg-black/10" aria-hidden="true" />
                    <span className="text-slate-600">Tarzını 3 dakikada netleştir</span>
                  </div>

                  <h1 className="mt-6 text-[clamp(2.25rem,4.6vw,4.25rem)] font-semibold tracking-[-0.035em] leading-[1.06] text-slate-950">
                    Evinin{" "}
                    <span className="relative inline-block">
                      <span className="absolute inset-x-0 -bottom-1 h-3 rounded-full bg-emerald-200/60 blur-[0.5px]" />
                      <span className="relative">tarzını</span>
                    </span>{" "}
                    bul.
                    <span className="block mt-2 text-slate-600 font-medium tracking-[-0.02em]">
                      İlhamı keşfet, doğru tasarımcıyla{" "}
                      <span className="text-slate-950 font-semibold">eşleş.</span>
                    </span>
                  </h1>

                  <p className="mt-4 max-w-[56ch] text-[15px] md:text-[16px] text-slate-600 leading-7">
                    Evlumba; binlerce iç mekân örneğini “beğen / geç” gibi basit
                    oynanabilir bir keşif deneyimine dönüştürür. Sonra, zevkine en
                    yakın tasarımcıları ve uygulanabilir paketleri önüne getirir.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <div className="group inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3.5 py-2 backdrop-blur shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] transition hover:bg-white/85 hover:-translate-y-px">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/15">
                        <MiniIcon
                          path="M12 20l9-8-9-8-9 8 9 8z"
                          className="h-4 w-4 text-emerald-700"
                        />
                      </div>
                      <div className="text-xs font-semibold tracking-tight text-slate-900">
                        Tarz profili
                      </div>
                    </div>

                    <div className="group inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3.5 py-2 backdrop-blur shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] transition hover:bg-white/85 hover:-translate-y-px">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/15">
                        <MiniIcon
                          path="M20 6L9 17l-5-5"
                          className="h-4 w-4 text-indigo-700"
                        />
                      </div>
                      <div className="text-xs font-semibold tracking-tight text-slate-900">
                        AI uyum skoru
                      </div>
                    </div>

                    <div className="group inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3.5 py-2 backdrop-blur shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] transition hover:bg-white/85 hover:-translate-y-px">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-violet-500/10 ring-1 ring-violet-500/15">
                        <MiniIcon
                          path="M12 1v22M1 12h22"
                          className="h-4 w-4 text-violet-700"
                        />
                      </div>
                      <div className="text-xs font-semibold tracking-tight text-slate-900">
                        Paket &amp; bütçe uyumu
                      </div>
                    </div>
                  </div>

                  {/* HIZLI ARAMA */}
                  <Card className="mt-6 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Hızlı Arama
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Bir şey yaz, direkt keşfe git.
                        </div>
                      </div>

                      <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                        Hazır
                      </div>
                    </div>

                    <form action="/kesfet" method="GET" className="mt-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            ⌕
                          </span>
                          <input
                            name="q"
                            placeholder="Örn: japandi küçük salon, minimal mutfak, ferah banyo…"
                            className="w-full rounded-2xl border border-black/10 bg-white/80 pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-black/10"
                            autoComplete="off"
                          />
                        </div>

                        <button
                          type="submit"
                          className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)] hover:bg-slate-800"
                        >
                          Ara
                        </button>
                      </div>

                      <div className="mt-5 border-t border-black/5 pt-4">
                        <div className="text-xs font-semibold text-slate-500">Öneriler</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[
                            "Modern salon",
                            "Bohem yatak odası",
                            "Küçük banyo",
                            "Minimal mutfak",
                            "Japandi",
                            "TV ünitesi",
                            "Aydınlatma",
                            "Çocuk odası",
                          ].map((s) => (
                            <Link
                              key={s}
                              href={`/kesfet?q=${encodeURIComponent(s)}`}
                              className="inline-flex items-center rounded-full border border-black/10 bg-white/70 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 transition"
                            >
                              {s}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </form>
                  </Card>
                </div>

                {/* RIGHT */}
                <div className="md:col-span-5">
                  <Card className="p-3 evl-float-soft">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-3xl overflow-hidden aspect-3/4 bg-black/5">
                        <img
                          src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=70"
                          alt="Yatak odası"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-3xl overflow-hidden aspect-4/3 bg-black/5">
                          <img
                            src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=70"
                            alt="Mutfak"
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        <div className="rounded-3xl overflow-hidden aspect-4/3 bg-black/5">
                          <img
                            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=70"
                            alt="Salon"
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-3xl border border-black/10 bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/15">
                              <span className="text-emerald-700 text-sm" aria-hidden="true">
                                ✨
                              </span>
                            </div>

                            <div className="min-w-0">
                              <div className="text-sm font-semibold tracking-tight text-slate-900 leading-tight">
                                Tarz Uyum Skoru
                              </div>
                              <div className="mt-0.5 text-xs text-slate-600">
                                Japandi <span className="text-slate-300">•</span> sıcak minimal
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-900 tabular-nums">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                            92%
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">AI hesapladı</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-2.5 rounded-full bg-black/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-emerald-500 via-indigo-500 to-violet-500"
                            style={{ width: "92%" }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Benzer zevk</span>
                          <span>Yüksek uyum</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Keşfetme Oyunu (Swipe hissi) */}
                  <div className="mt-4">
                    <Link href="/oyun" className="group block">
                      <Card className="relative overflow-hidden p-4 md:p-5">
                        <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-rose-500/10 blur-2xl" />
                        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-2xl" />

                        <div className="relative flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                              <div className="text-sm font-semibold text-slate-900">
                                Keşfetme Oyunu
                              </div>
                            </div>

                            <div className="mt-1 text-xs text-slate-600">
                              Swipe hissiyle hızlı karar ver — zevkin netleşsin.
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-rose-600">
                                <span className="grid h-6 w-6 place-items-center rounded-full bg-rose-500/10 text-rose-700">
                                  ✕
                                </span>

                                <span className="inline-flex items-center gap-1">
                                  <span className="evl-swipe-left inline-flex items-center" aria-hidden="true">
                                    <span className="text-rose-400">‹</span>
                                    <span className="text-rose-400 -ml-0.5">‹</span>
                                  </span>
                                  <span>Geç</span>
                                </span>

                                <span className="text-rose-400/80" aria-hidden="true">
                                  sol
                                </span>
                              </span>

                              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/10 text-emerald-800">
                                  ♥
                                </span>

                                <span className="inline-flex items-center gap-1">
                                  <span>Beğen</span>
                                  <span className="evl-swipe-right inline-flex items-center" aria-hidden="true">
                                    <span className="text-emerald-400">›</span>
                                    <span className="text-emerald-400 -ml-0.5">›</span>
                                  </span>
                                </span>

                                <span className="text-emerald-400/80" aria-hidden="true">
                                  sağ
                                </span>
                              </span>

                              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="text-slate-400" aria-hidden="true">
                                  •
                                </span>
                                koleksiyona ekle
                              </span>
                            </div>
                          </div>

                          <div className="relative shrink-0">
                            <div className="relative h-20 w-28 md:h-24 md:w-32">
                              <div className="absolute inset-0 rounded-2xl border border-black/10 bg-white/55 shadow-sm rotate-[-8deg]" />
                              <div className="absolute inset-0 rounded-2xl border border-black/10 bg-white/65 shadow-sm rotate-6 translate-x-1 translate-y-1" />

                              <div className="absolute inset-0 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-md evl-swipe-nudge">
                                <img
                                  src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=700&q=70"
                                  alt="Swipe preview"
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />

                                <div
                                  className="absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] font-semibold text-white"
                                  style={{
                                    background:
                                      "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))",
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1">
                                      <span className="text-rose-300">←</span> Geç
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      Beğen <span className="text-emerald-300">→</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="relative mt-4 flex items-center justify-between gap-3">
                          <div className="text-xs text-slate-600">
                            30 saniye oyna → AI daha iyi önerir
                          </div>

                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-slate-800">
                            Dene
                            <span className="transition-transform group-hover:translate-x-0.5">
                              →
                            </span>
                          </span>
                        </div>
                      </Card>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <SectionTitle
            eyebrow="İLHAM"
            title="Koleksiyon gibi akan, stabil ve şık içerikler"
            desc="Rastgele kartlar değil: kategori, stil ve alan bazlı keşif. Beğen, kaydet, koleksiyon oluştur."
          />
          <div className="hidden md:block">
            <ButtonLink href="/kesfet" variant="secondary">
              Tümünü gör
            </ButtonLink>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {projects.slice(0, 3).map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>

        <div className="mt-4 md:hidden">
          <ButtonLink href="/kesfet" variant="secondary" className="w-full py-3">
            Tümünü gör
          </ButtonLink>
        </div>
      </section>

      {/* DESIGNERS ✅ */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <SectionTitle
            eyebrow="PROFESYONELLER"
            title="Yaşam alanınızı yenileyecek profesyonellerle tanışın"
            desc="Portföylere göz atın, sabitlenmiş yorumları okuyun. Hızlı dönüş yapanları tek bakışta anlayın."
          />

          <div className="hidden md:block">
            <ButtonLink href="/tasarimcilar" variant="secondary">
              Tüm tasarımcılar
            </ButtonLink>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {designers.map((d) => (
            <DesignerCard key={d.id} d={d} />
          ))}
        </div>
      </section>

      {/* FINAL CTA (revize) */}
      <section className="mt-12">
        <Card className="relative overflow-hidden p-6 md:p-8">
          <div
            className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                İlham koleksiyonu
                <span className="h-3 w-px bg-black/10" aria-hidden="true" />
                profesyoneller • gerçek yorumlar
              </div>

              <div className="mt-3 text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
                Evlumba ile evini <span className="text-slate-900">oyun gibi</span> keşfet.
              </div>

              <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed max-w-xl">
                İlhamı kartlardan topla, beğendiklerini kaydet, tarzın netleşince sana uygun
                profesyonelleri tek ekranda gör.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-rose-500/10 text-rose-700">
                    ↔
                  </span>
                  Beğen / Geç
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-900/5 text-slate-900">
                    ⎘
                  </span>
                  Kaydet & Koleksiyon
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500/10 text-amber-700">
                    ★
                  </span>
                  Pinned yorumlar
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/10 text-emerald-800">
                    ⚡
                  </span>
                  Hızlı dönüş
                </span>
              </div>
            </div>

            <div className="flex flex-col items-stretch md:items-end">
              <div
                className="w-full md:w-[320px] rounded-3xl border border-black/10 bg-white/60 backdrop-blur p-3
                  shadow-[0_18px_55px_-45px_rgba(15,23,42,0.22)]"
              >
                <Link
                  href="/kayit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5
                 text-sm font-semibold text-white shadow-[0_18px_55px_-35px_rgba(15,23,42,0.55)]
                 hover:bg-slate-800 transition"
                >
                  Ücretsiz Başla
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                    →
                  </span>
                </Link>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5
                       text-[11px] font-semibold text-slate-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    Kredi kartı gerekmez
                  </span>

                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5
                       text-[11px] font-semibold text-slate-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
                    30 sn’de keşfe başla
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ✅ TESTIMONIALS (Footer'ın hemen üstü) */}
      <SiteTestimonials />
    </div>
  );
}
