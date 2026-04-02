import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const title = "İlham Keşfet – İç Mimarlık ve Dekorasyon";
const description =
  "Oda tarzına göre filtrele, ilham al ve tarzına uygun iç mimar ile eşleş. Evlumba'da binlerce dekorasyon ve tasarım fikri seni bekliyor.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "dekorasyon ilham",
    "iç mimarlık fikirleri",
    "oda tasarımı",
    "oturma odası tasarımı",
    "yatak odası dekorasyonu",
    "mutfak tasarımı",
    "Evlumba keşfet",
  ],
  alternates: { canonical: "/kesfet" },
  openGraph: {
    title,
    description,
    url: toAbsoluteUrl("/kesfet"),
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

export default function KesfetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
