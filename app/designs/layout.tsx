import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const title = "Tasarım Fikirleri – Evlumba";
const description =
  "İç mimarlık ve dekorasyon tasarım fikirlerini keşfet. Tarzına göre filtrele ve ilham al.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["tasarım fikirleri", "dekorasyon", "iç mimarlık", "ilham", "Evlumba"],
  alternates: { canonical: "/designs" },
  openGraph: {
    title,
    description,
    url: toAbsoluteUrl("/designs"),
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

export default function DesignsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
