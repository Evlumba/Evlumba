// app/components/SiteTestimonials.tsx

type Platform = "Instagram" | "X" | "TikTok" | "WhatsApp";

type Mention = {
  id: string;
  platform: Platform;
  author: string;
  handle?: string;
  text: string;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "muted";
  vibe?: string; // ✅ zaman yok; yerine “kafa rahat”, “zevk netleşti” gibi
};

const mentions: Mention[] = [
  {
    id: "m1",
    platform: "Instagram",
    author: "Zeynep",
    handle: "@zeynep",
    vibe: "kafa rahat",
    size: "md",
    text:
      "Şu “beğen/geç” keşfi beklediğimden iyi çıktı. 10 dakikada zevkim netleşti, sonra aynı çizgide 2 tasarımcı önerdi.",
  },
  {
    id: "m2",
    platform: "X",
    author: "Bora",
    handle: "@bora",
    vibe: "çok pratik",
    size: "md",
    text:
      "Küçük mutfakta depolama fikri noktayı koydu. Bütçeyi patlatmadan ‘ferah’ hissi geldi.",
  },
  {
    id: "m3",
    platform: "TikTok",
    author: "Ece",
    handle: "@ece",
    vibe: "premium his",
    size: "lg",
    text:
      "Bohem istiyordum ama ‘dağınık’ gibi durmasın diye korkuyordum. Tam ‘premium sıcaklık’ hissini yakaladı. Dokular + ışık dengesi çok iyi.",
  },
  {
    id: "m4",
    platform: "WhatsApp",
    author: "Melis",
    vibe: "net brief",
    size: "md",
    text:
      "Pinterest’te gezer gibi değil — daha net, daha karar odaklı. Antre için 3 fikir çıktı; hepsi uygulanabilir.",
  },
  {
    id: "m5",
    platform: "Instagram",
    author: "Derya",
    handle: "@derya",
    vibe: "az efor, çok fark",
    size: "md",
    text:
      "Balkonda 2 küçük dokunuş önerisi geldi, ikisi de ‘az efor–çok fark’. Tam aradığım ilham formatı.",
  },
  {
    id: "m6",
    platform: "X",
    author: "Kerem",
    handle: "@kerem",
    vibe: "iyi çalışıyor",
    size: "md",
    tone: "muted",
    text:
      "Ofis tarafında ölçü–mobilya uyumu çok işime yaradı. “Sadece güzel” değil; çalışıyor. Bu ayrım değerli.",
  },
];

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function PlatformMark({ p }: { p: Platform }) {
  const label =
    p === "Instagram" ? "IG" : p === "TikTok" ? "TT" : p === "WhatsApp" ? "WA" : "X";

  const dot =
    p === "Instagram"
      ? "bg-violet-500"
      : p === "TikTok"
      ? "bg-emerald-500"
      : p === "WhatsApp"
      ? "bg-emerald-600"
      : "bg-slate-900";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700 backdrop-blur">
      <span className={cx("h-1.5 w-1.5 rounded-full", dot)} aria-hidden="true" />
      <span className="tracking-tight">{label}</span>
    </span>
  );
}

function MentionCard({ m }: { m: Mention }) {
  const sizePad =
    m.size === "lg" ? "p-6" : m.size === "sm" ? "p-4" : "p-5";

  return (
    <div
      className={cx(
        "break-inside-avoid overflow-hidden rounded-3xl border border-black/5",
        "bg-white/65 backdrop-blur shadow-[0_22px_70px_-60px_rgba(0,0,0,0.35)]",
        "transition hover:bg-white/75 hover:-translate-y-0.5",
      )}
    >
      <div className={cx("relative", sizePad)}>
        {/* mini glow */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.22), rgba(139,92,246,0) 60%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.18), rgba(16,185,129,0) 60%)",
          }}
          aria-hidden="true"
        />

        {/* top row */}
        <div className="relative flex items-center justify-between gap-3">
          <PlatformMark p={m.platform} />

          {/* ✅ zaman yerine vibe */}
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {m.vibe ?? "memnuniyet"}
          </span>
        </div>

        {/* quote */}
        <div className="relative mt-4">
          <div className="text-[26px] leading-none text-slate-300 select-none" aria-hidden="true">
            “
          </div>

          <p
            className={cx(
              "mt-2 text-[14.5px] md:text-[15px] leading-7",
              m.tone === "muted" ? "text-slate-600" : "text-slate-800",
            )}
          >
            {m.text}
          </p>
        </div>

        {/* bottom */}
        <div className="relative mt-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-slate-900">
              {m.author}
            </div>
            {m.handle ? (
              <div className="text-xs text-slate-500">{m.handle}</div>
            ) : (
              <div className="text-xs text-slate-500">topluluktan</div>
            )}
          </div>

          {/* tiny “signal” pill (soft) */}
          <span className="shrink-0 inline-flex items-center rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
            Evlumba’da konuşuluyor
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SiteTestimonials() {
  return (
    <section className="mt-12">
      {/* outer glass wrapper */}
      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-x-6 -inset-y-6 rounded-[44px] bg-white/45 backdrop-blur-2xl"
          aria-hidden="true"
        />

        <div className="relative overflow-hidden rounded-4xl border border-black/5 bg-white/40 backdrop-blur-xl shadow-[0_35px_90px_-70px_rgba(0,0,0,0.45)]">
          <div className="p-6 md:p-8">
            {/* header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold tracking-widest text-slate-500">
                  EVLUMBA’DA KONUŞULANLAR
                </div>
                <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                  Küçük notlar, DM’ler, yorumlar…
                  <span className="block mt-1 text-slate-600 font-medium">
                    “ilham → karar → uygulama” akışı insanı rahatlatıyor.
                  </span>
                </h2>

                {/* ✅ “100’lerce deneyimden bazıları” satırı */}
                <div className="mt-3 text-sm text-slate-600">
                  Yüzlerce deneyimden seçilmiş birkaç küçük alıntı.
                </div>
              </div>

              {/* soft stats (no CTA) */}
              <div className="flex flex-wrap gap-2 md:justify-end">
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  4.9+ memnuniyet hissi
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden="true" />
                  “Pinned” yorum kültürü
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
                  hızlı dönüş sinyalleri
                </span>
              </div>
            </div>

            {/* masonry grid */}
            <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:balance]">
              {mentions.map((m) => (
                <div key={m.id} className="mb-4">
                  <MentionCard m={m} />
                </div>
              ))}
            </div>
          </div>

          {/* subtle bottom fade */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.65))",
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
