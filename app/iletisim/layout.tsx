import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const title = "İletişim – Evlumba";
const description =
  "Evlumba ekibiyle iletişime geç. Destek, iş birliği ve platform hakkındaki sorularını bize iletebilirsin.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["Evlumba iletişim", "destek", "iletişim formu"],
  alternates: { canonical: "/iletisim" },
  openGraph: {
    title,
    description,
    url: toAbsoluteUrl("/iletisim"),
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
