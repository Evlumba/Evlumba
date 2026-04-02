// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";

import LayoutWrapper from "./components/LayoutWrapper";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "tr_TR",
    url: SITE_URL,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: "/evlumba-icon.svg",
    shortcut: "/evlumba-icon.svg",
    apple: "/web_icon2.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {/* Global light background glow */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div
            className="absolute -left-40 -top-56 h-130 w-130 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.55), rgba(139,92,246,0) 60%)",
            }}
          />
          <div
            className="absolute -right-40 -top-40 h-130 w-130 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.45), rgba(16,185,129,0) 60%)",
            }}
          />
          <div
            className="absolute left-1/3 top-130 h-140 w-140 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.40), rgba(99,102,241,0) 60%)",
            }}
          />
        </div>

        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
