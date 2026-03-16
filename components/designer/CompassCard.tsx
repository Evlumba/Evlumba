// components/designer/CompassCard.tsx
import { Compass } from "lucide-react";

export default function CompassCard() {
  return (
    <div
      className="w-[74px] md:w-[86px] overflow-hidden rounded-[22px]"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.70), rgba(255,255,255,0.40))",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.08), 0 22px 70px rgba(15,23,42,0.10)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="flex h-full flex-col items-center justify-between p-3">
        <div
          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-white"
          style={{ background: "#0f172a", boxShadow: "0 14px 40px rgba(15,23,42,0.28)" }}
        >
          <Compass className="h-4 w-4" />
        </div>

        <div className="mt-2 flex flex-col items-center">
          <MiniCompass />
          <div className="mt-2 text-[10px] leading-tight text-center">
            <div className="text-[rgba(15,23,42,0.70)]">ProMatch</div>
            <div className="text-[rgba(15,23,42,0.45)]">Pusula</div>
          </div>
        </div>

        <div
          className="mt-2 w-full rounded-full px-2 py-1 text-center text-[10px] font-medium"
          style={{
            background: "rgba(15,23,42,0.05)",
            boxShadow: "0 0 0 1px rgba(15,23,42,0.06)",
            color: "rgba(15,23,42,0.70)",
          }}
        >
          AI
        </div>
      </div>
    </div>
  );
}

function MiniCompass() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <radialGradient
          id="rg2"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(28 28) rotate(90) scale(28)"
        >
          <stop stopColor="rgba(15,23,42,0.10)" />
          <stop offset="1" stopColor="rgba(15,23,42,0.02)" />
        </radialGradient>
      </defs>

      <circle cx="28" cy="28" r="24" fill="url(#rg2)" />
      <circle cx="28" cy="28" r="16.5" stroke="rgba(15,23,42,0.10)" strokeWidth="1" />
      <path d="M28 12 L32 28 L28 44 L24 28 Z" fill="rgba(15,23,42,0.14)" />
      <path d="M28 14 L30.5 28 L28 42 L25.5 28 Z" fill="rgba(15,23,42,0.28)" />
      <circle cx="28" cy="28" r="3" fill="rgba(15,23,42,0.55)" />
      <text x="28" y="9" textAnchor="middle" fontSize="8" fill="rgba(15,23,42,0.45)">
        N
      </text>
    </svg>
  );
}
