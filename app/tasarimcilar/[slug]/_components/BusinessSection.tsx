"use client";

import type { Designer } from "../../_data/designers";

function IconPhone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m22 6-10 7L2 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCurrency({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 2v4M8 2v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

function IconPinterest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0Z" />
    </svg>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-900 hover:text-violet-600 transition-colors"
    >
      {value}
    </a>
  ) : (
    <span className="text-gray-900">{value}</span>
  );

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{content}</p>
      </div>
    </div>
  );
}

function normalizeInstagramHandle(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (raw.includes("instagram.com")) {
    try {
      const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      const firstPath = parsed.pathname
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)[0];
      return (firstPath ?? "").replace(/^@+/, "");
    } catch {
      return "";
    }
  }

  return raw.replace(/^@+/, "");
}

export default function BusinessSection({ designer }: { designer: Designer }) {
  const business = designer.business;

  if (!business) {
    return (
      <section id="is" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 mt-8">
          <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.18)]">
            <div className="p-10 md:p-14">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-9 w-9 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
                      <path d="M1 21h22" />
                      <path d="M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  İşletme bilgisi eklenmedi
                </h3>
                <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                  {designer.name} henüz işletme detaylarını paylaşmadı.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const address = business.address
    ? [
        business.address.street,
        business.address.district,
        business.address.city,
        business.address.postalCode,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  const typicalCost =
    business.typicalJobCost?.min && business.typicalJobCost?.max
      ? `${business.typicalJobCost.min} – ${business.typicalJobCost.max}`
      : business.typicalJobCost?.min || business.typicalJobCost?.max || null;

  const socials = business.socials || {};
  const instagramHandle = normalizeInstagramHandle(socials.instagram);
  const instagramHref = instagramHandle
    ? `https://www.instagram.com/${encodeURIComponent(instagramHandle)}/`
    : "";
  const hasSocials = Boolean(
    instagramHref || socials.pinterest || socials.linkedin || socials.twitter || socials.youtube
  );

  return (
    <section id="is" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 mt-8">
        <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.18)]">
          <div className="p-6 md:p-8">
            {/* Grid: Sol - İletişim, Sağ - Detaylar */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Sol kolon - İletişim Bilgileri */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  İletişim
                </h3>
                <div className="space-y-1 divide-y divide-gray-100">
                  {business.name && (
                    <InfoRow
                      icon={<IconShield className="h-4 w-4" />}
                      label="İşletme Adı"
                      value={business.name}
                    />
                  )}
                  {business.phone && (
                    <InfoRow
                      icon={<IconPhone className="h-4 w-4" />}
                      label="Telefon"
                      value={business.phone}
                      href={`tel:${business.phone.replace(/\s/g, "")}`}
                    />
                  )}
                  {business.email && (
                    <InfoRow
                      icon={<IconMail className="h-4 w-4" />}
                      label="E-posta"
                      value={business.email}
                      href={`mailto:${business.email}`}
                    />
                  )}
                  {business.website && (
                    <InfoRow
                      icon={<IconGlobe className="h-4 w-4" />}
                      label="Website"
                      value={business.website}
                      href={`https://${business.website}`}
                    />
                  )}
                  {address && (
                    <InfoRow
                      icon={<IconMapPin className="h-4 w-4" />}
                      label="Adres"
                      value={address}
                      href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                    />
                  )}
                </div>
              </div>

              {/* Sağ kolon - İşletme Detayları */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  İşletme Detayları
                </h3>
                <div className="space-y-1 divide-y divide-gray-100">
                  {typicalCost && (
                    <InfoRow
                      icon={<IconCurrency className="h-4 w-4" />}
                      label="Tipik Proje Maliyeti"
                      value={typicalCost}
                    />
                  )}
                  {business.employees && (
                    <InfoRow
                      icon={<IconUsers className="h-4 w-4" />}
                      label="Ekip Büyüklüğü"
                      value={`${business.employees} çalışan`}
                    />
                  )}
                  {business.founded && (
                    <InfoRow
                      icon={<IconCalendar className="h-4 w-4" />}
                      label="Kuruluş Yılı"
                      value={business.founded}
                    />
                  )}
                  {business.license && (
                    <InfoRow
                      icon={<IconShield className="h-4 w-4" />}
                      label="Lisans / Sicil No"
                      value={business.license}
                    />
                  )}
                  {business.workingHours && (
                    <InfoRow
                      icon={<IconClock className="h-4 w-4" />}
                      label="Çalışma Saatleri"
                      value={
                        [
                          business.workingHours.weekdays &&
                            `Hafta içi: ${business.workingHours.weekdays}`,
                          business.workingHours.saturday &&
                            `Cumartesi: ${business.workingHours.saturday}`,
                          business.workingHours.sunday &&
                            `Pazar: ${business.workingHours.sunday}`,
                        ]
                          .filter(Boolean)
                          .join(" • ") || ""
                      }
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Alt kısım - Sosyal Medya & Takipçi */}
            {(hasSocials || business.followers) && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Sosyal Medya */}
                  {hasSocials && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 mr-1">
                        Sosyal Medya
                      </span>
                      {instagramHref && (
                        <a
                          href={instagramHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-pink-50 hover:text-pink-600"
                          title="Instagram"
                        >
                          <IconInstagram className="h-4 w-4" />
                        </a>
                      )}
                      {socials.pinterest && (
                        <a
                          href={`https://pinterest.com/${socials.pinterest}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
                          title="Pinterest"
                        >
                          <IconPinterest className="h-4 w-4" />
                        </a>
                      )}
                      {socials.linkedin && (
                        <a
                          href={`https://linkedin.com/company/${socials.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600"
                          title="LinkedIn"
                        >
                          <IconLinkedIn className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Takipçi */}
                  {business.followers && (
                    <div className="flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2">
                      <IconUsers className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-semibold text-violet-700">
                        {business.followers.toLocaleString("tr-TR")}
                      </span>
                      <span className="text-xs text-violet-500">takipçi</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sigorta badge */}
            {business.insurance && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                <IconShield className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Mesleki Sorumluluk Sigortası Mevcut
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
