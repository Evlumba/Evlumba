"use client";

import { useEffect, useState } from "react";

export default function AppBanner({ projectId }: { projectId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Sadece mobil cihazlarda göster
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isMobile) setShow(true);
  }, []);

  if (!show) return null;

  const isAndroid = /android/i.test(navigator.userAgent);
  const storeUrl = isAndroid
    ? "https://play.google.com/store/apps/details?id=com.evlumba.app"
    : "https://apps.apple.com/app/evlumba/id0000000000"; // iOS App Store ID ekle

  function handleOpen() {
    // Intent URL ile uygulamayı aç; yüklü değilse store'a yönlendir
    if (isAndroid) {
      window.location.href = `intent://www.evlumba.com/projects/${projectId}#Intent;scheme=https;package=com.evlumba.app;S.browser_fallback_url=${encodeURIComponent(storeUrl)};end`;
    } else {
      window.location.href = storeUrl;
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/icon/icon.png" alt="Evlumba" className="h-10 w-10 rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <p className="text-sm font-semibold text-gray-900">Evlumba</p>
            <p className="text-xs text-gray-500">Uygulamada daha iyi deneyim</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShow(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Kapat
          </button>
          <button
            onClick={handleOpen}
            className="rounded-full bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Aç
          </button>
        </div>
      </div>
    </div>
  );
}
