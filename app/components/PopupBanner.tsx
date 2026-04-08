"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type PopupData = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  max_impressions_per_user: number;
  pages: string[];
  media_type: string;
};

function getImpressionCount(popupId: string): number {
  try {
    return Number(localStorage.getItem(`evlumba:popup:${popupId}`) || "0");
  } catch {
    return 0;
  }
}

function incrementImpression(popupId: string) {
  try {
    const current = getImpressionCount(popupId);
    localStorage.setItem(`evlumba:popup:${popupId}`, String(current + 1));
  } catch {}
}

export default function PopupBanner() {
  const pathname = usePathname();
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/public/popup");
        const data = (await res.json()) as { ok?: boolean; popup?: PopupData | null };
        if (!data.ok || !data.popup) return;

        // Check page filter - empty array means show everywhere
        const pages = data.popup.pages ?? [];
        if (pages.length > 0 && !pages.some((p) => pathname === p || pathname.startsWith(p + "/"))) return;

        const impressions = getImpressionCount(data.popup.id);
        if (impressions >= data.popup.max_impressions_per_user) return;

        setPopup(data.popup);
        setTimeout(() => setVisible(true), 300);
        incrementImpression(data.popup.id);
      } catch {}
    };
    void load();
  }, [pathname]);

  if (!popup || !visible) return null;

  const close = () => setVisible(false);

  const isVideo = popup.media_type === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(popup.image_url);
  const isEmbed = popup.media_type === "embed";

  const content = isEmbed ? (
    <iframe
      src={popup.image_url}
      className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl md:max-w-lg aspect-video w-[90vw] md:w-[560px]"
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  ) : isVideo ? (
    <video
      src={popup.image_url}
      autoPlay
      loop
      muted
      playsInline
      className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl md:max-w-lg"
    />
  ) : (
    <img
      src={popup.image_url}
      alt={popup.title}
      className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl md:max-w-lg"
    />
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={close}
    >
      <div
        className="relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={close}
          className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg ring-1 ring-black/10 hover:bg-slate-50 cursor-pointer transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {popup.link_url ? (
          <a href={popup.link_url} target="_blank" rel="noopener noreferrer" onClick={close}>
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
