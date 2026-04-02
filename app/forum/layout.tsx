import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const title = "Evlumba Forum – Tasarım ve Dekorasyon Topluluk";
const description =
  "Tasarım, iç mimarlık ve dekorasyon hakkında fikirlerini paylaş, sorularını sor ve profesyonellerle etkileşime gir.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "dekorasyon forum",
    "iç mimarlık topluluk",
    "tasarım soruları",
    "ev dekorasyonu",
    "Evlumba forum",
  ],
  alternates: { canonical: "/forum" },
  openGraph: {
    title,
    description,
    url: toAbsoluteUrl("/forum"),
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

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
