"use client";

import { useState } from "react";
import type { Designer } from "../../_data/designers";

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={className}>
      <path
        d="M5.5 7.5 10 12l4.5-4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AboutSection({ designer }: { designer: Designer }) {
  const about = designer.about;

  const headline = about?.headline?.trim() || `${designer.name} hakkında`;

  const bio =
    about?.bio?.trim() ||
    "Bu tasarımcı henüz detaylı bir açıklama eklemedi. Yakında daha fazla bilgi burada yer alacak.";

  // 3 satırlık limit için yaklaşık karakter sayısı
  const MAX_CHARS = 250;
  const isLong = bio.length > MAX_CHARS;
  const [expanded, setExpanded] = useState(false);

  // Kelime ortasında kesmemek için son boşluğa kadar al
  const getDisplayText = () => {
    if (!isLong || expanded) return bio;
    const truncated = bio.slice(0, MAX_CHARS);
    const lastSpace = truncated.lastIndexOf(" ");
    return truncated.slice(0, lastSpace > 180 ? lastSpace : MAX_CHARS);
  };

  return (
    <section id="hakkinda" className="scroll-mt-32 lg:scroll-mt-28">
      <div className="mx-auto max-w-6xl px-4 mt-6">
        {/* Ana kart */}
        <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.18)]">
          <div className="p-6 md:p-8">
            {/* Headline */}
            <p className="text-base font-medium text-gray-800 leading-relaxed">
              {headline}
            </p>

            {/* Bio */}
            <div className="mt-4">
              <p className="text-[15px] leading-[1.75] text-gray-600">
                {getDisplayText()}
                {!expanded && isLong && (
                  <span className="text-gray-400">...</span>
                )}
              </p>
            </div>

            {/* Expand/Collapse butonu */}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-4 group inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-100 transition-all hover:bg-gray-100 hover:ring-gray-200"
              >
                <span>{expanded ? "Daha az göster" : "Devamını oku"}</span>
                <IconChevronDown
                  className={[
                    "h-4 w-4 text-gray-500 transition-transform duration-200",
                    expanded ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
