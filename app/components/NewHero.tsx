"use client";

import { useEffect, useRef } from "react";

export default function NewHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleMotionPreference = (mq: MediaQueryList | MediaQueryListEvent) => {
      if (!videoRef.current) return;
      if (mq.matches) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    };

    handleMotionPreference(mediaQuery);
    mediaQuery.addEventListener("change", handleMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden h-[340px] md:h-[420px] lg:h-[560px]"
      aria-label="Hero bölümü"
    >
      {/* Video */}
      <video
        ref={videoRef}
        src="/hero-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />

    </section>
  );
}
