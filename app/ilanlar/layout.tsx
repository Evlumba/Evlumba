import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, toAbsoluteUrl } from "@/lib/seo";

const title = "İç Mimar, Mimar ve Dekorasyon İlanları";
const description =
  "İç mimar, mimar, dekorasyon ve tasarım ihtiyaçları için güncel ilanları keşfet. Doğru profesyonelle daha hızlı eşleş.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "iç mimar ilanları",
    "mimar ilanları",
    "dekorasyon ilanları",
    "tasarım hizmet ilanı",
    "iç mimarlık",
    "ev dekorasyonu",
  ],
  alternates: {
    canonical: "/ilanlar",
  },
  openGraph: {
    title,
    description,
    url: toAbsoluteUrl("/ilanlar"),
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

export default function IlanlarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
