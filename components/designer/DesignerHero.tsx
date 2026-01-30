import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Sparkles, ShieldCheck, Star } from "lucide-react";

const shell: CSSProperties = {
  background: "rgba(255,255,255,0.62)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.08), 0 28px 80px rgba(15,23,42,0.10)",
  backdropFilter: "blur(18px)",
};

const chip: CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.08), 0 10px 28px rgba(15,23,42,0.06)",
  backdropFilter: "blur(14px)",
};

export default function DesignerHero() {
  return (
    <section className="px-4 overflow-x-clip">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mt-8 md:mt-10">
          <div className="relative overflow-hidden rounded-[28px]" style={shell}>
            {/* soft glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-12 h-72 w-72 rounded-full bg-[rgba(16,185,129,0.16)] blur-3xl" />
              <div className="absolute -bottom-24 right-10 h-80 w-80 rounded-full bg-[rgba(99,102,241,0.14)] blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_10%_10%,rgba(255,255,255,0.80),transparent_58%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_90%_20%,rgba(255,255,255,0.55),transparent_55%)]" />
            </div>

            <div className="relative grid items-center gap-6 p-5 md:grid-cols-12 md:p-6">
              {/* LEFT */}
              <div className="md:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm" style={chip}>
                  <Sparkles className="h-4 w-4 text-[rgba(15,23,42,0.78)]" />
                  <span className="font-medium text-[rgba(15,23,42,0.86)]">ProMatch</span>
                  <span className="text-[rgba(15,23,42,0.35)]">•</span>
                  <span className="text-[rgba(15,23,42,0.62)]">3 soru → doğru profesyonel</span>
                </div>

                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#0f172a] md:text-2xl">
                  Filtre karmaşası yok. 30 sn’de pro bul.
                </h2>

                <p className="mt-2 max-w-xl text-sm text-[rgba(15,23,42,0.60)] md:text-base">
                  Sadece birkaç seçiminle tarzını çıkarır, en uyumlu iç mimarları düzenli listeleriz.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href="/tasarimcilar?wizard=1"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-4 py-3 text-sm font-medium text-white shadow-[0_14px_40px_rgba(15,23,42,0.25)] transition hover:opacity-95"
                  >
                    ProMatch’i Başlat <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/tasarimcilar#liste"
                    className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium text-[rgba(15,23,42,0.78)] transition hover:opacity-95"
                    style={{
                      background: "rgba(255,255,255,0.66)",
                      boxShadow: "0 0 0 1px rgba(15,23,42,0.08), 0 12px 30px rgba(15,23,42,0.06)",
                      backdropFilter: "blur(14px)",
                    }}
                  >
                    Örnek Profilleri Gör
                  </Link>

                  <div className="ml-0 mt-2 flex items-center gap-2 text-xs text-[rgba(15,23,42,0.55)] md:ml-2 md:mt-0">
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-2" style={chip}>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Kredi kartı gerekmez
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-2" style={chip}>
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      30 sn’de başla
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT – artık ABSOLUTE yok, GRID var (iç içe geçme biter) */}
              <div className="md:col-span-5">
                <CollageGrid />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Houzz vibe: editorial grid, NO overlap, NO broken image */
function CollageGrid() {
  return (
    <div
      className="h-42.5 w-full rounded-3xl p-3"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.34))",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 24px 70px rgba(15,23,42,0.10)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="grid h-full grid-cols-12 grid-rows-2 gap-2">
        {/* Big room photo */}
        <div className="col-span-7 row-span-2 overflow-hidden rounded-[20px]" style={photo("/images/promatch/room-1.jpg")}>
          <div className="h-full w-full bg-[radial-gradient(700px_circle_at_20%_10%,rgba(255,255,255,0.55),transparent_55%)]" />
          <div
            className="absolute"
            style={{ display: "none" }}
          />
          <div
            className="relative h-full w-full"
            style={{}}
          >
            <div
              className="absolute bottom-3 left-3 right-3 rounded-2xl px-3 py-2 text-xs"
              style={{
                background: "rgba(255,255,255,0.74)",
                boxShadow: "0 0 0 1px rgba(15,23,42,0.06)",
                backdropFilter: "blur(14px)",
              }}
            >
              <div className="font-semibold text-[rgba(15,23,42,0.82)]">Warm Minimal</div>
              <div className="text-[rgba(15,23,42,0.55)]">tarz özeti çıkarıldı</div>
            </div>
          </div>
        </div>

        {/* Score card */}
        <div className="col-span-5 row-span-1 rounded-[20px] px-4 py-3" style={card()}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[rgba(15,23,42,0.82)]">Uyum Skoru</div>
              <div className="text-[12px] text-[rgba(15,23,42,0.55)]">seçimlerinle eşleşen profesyoneller</div>
            </div>
            <div className="text-sm font-semibold text-[rgba(15,23,42,0.78)]">92%</div>
          </div>

          <div className="mt-2 h-2 w-full rounded-full bg-[rgba(15,23,42,0.08)] overflow-hidden">
            <div className="h-full w-[92%] rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.68),rgba(99,102,241,0.55))]" />
          </div>
        </div>

        {/* Pro card */}
        <div className="col-span-5 row-span-1 rounded-[20px] p-3" style={card()}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl" style={avatar("/images/promatch/pro-1.jpg")} />
              <div className="leading-tight">
                <div className="text-xs font-semibold text-[rgba(15,23,42,0.82)]">İç Mimar</div>
                <div className="text-[11px] text-[rgba(15,23,42,0.55)]">24s dönüş</div>
              </div>
            </div>

            <span
              className="rounded-full px-2 py-1 text-[10px] font-medium"
              style={{
                background: "rgba(16,185,129,0.12)",
                boxShadow: "0 0 0 1px rgba(16,185,129,0.18)",
                color: "rgba(15,23,42,0.72)",
              }}
            >
              verified
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-[rgba(15,23,42,0.60)]">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3" />
              4.9
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              120 yorum
            </span>
          </div>

          <div
            className="mt-2 rounded-xl px-2 py-2 text-[11px]"
            style={{
              background: "rgba(15,23,42,0.035)",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.06)",
              color: "rgba(15,23,42,0.60)",
            }}
          >
            <span className="font-semibold text-[rgba(15,23,42,0.78)]">İpucu:</span> 3 soru → net eşleşme
          </div>
        </div>
      </div>
    </div>
  );
}

/** helpers (görsel yoksa bile premium gradient görünür) */
function photo(url: string): CSSProperties {
  return {
    position: "relative",
    backgroundImage:
      `url('${url}'), ` +
      "radial-gradient(900px circle at 20% 20%, rgba(255,255,255,0.75), transparent 55%), " +
      "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(99,102,241,0.14))",
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 0 0 1px rgba(15,23,42,0.07), 0 20px 60px rgba(15,23,42,0.18)",
  };
}

function avatar(url: string): CSSProperties {
  return {
    backgroundImage:
      `url('${url}'), ` +
      "linear-gradient(135deg, rgba(15,23,42,0.10), rgba(255,255,255,0.65))",
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 0 0 1px rgba(15,23,42,0.06)",
  };
}

function card(): CSSProperties {
  return {
    background: "rgba(255,255,255,0.74)",
    boxShadow: "0 0 0 1px rgba(15,23,42,0.07), 0 18px 55px rgba(15,23,42,0.12)",
    backdropFilter: "blur(16px)",
  };
}
