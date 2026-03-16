"use client";
/* cspell:disable */

import Image from "next/image";
import React from "react";

const FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6d28d9" stop-opacity="0.22"/>
        <stop offset="0.55" stop-color="#2563eb" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#10b981" stop-opacity="0.20"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <circle cx="300" cy="260" r="190" fill="#111827" fill-opacity="0.10"/>
    <circle cx="840" cy="520" r="220" fill="#111827" fill-opacity="0.08"/>
    <text x="50%" y="52%" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="42" fill="#0f172a" fill-opacity="0.55">Evlumba</text>
    <text x="50%" y="60%" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="18" fill="#0f172a" fill-opacity="0.45">Görsel yüklenemedi</text>
  </svg>
`);

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export default function SafeImg({
  src,
  alt = "Evlumba görseli",
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: Props) {
  const [err, setErr] = React.useState(false);

  const safeSrc = !src || err ? FALLBACK_SVG : src;

  return (
    <Image
      src={safeSrc}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setErr(true)}
    />
  );
}
