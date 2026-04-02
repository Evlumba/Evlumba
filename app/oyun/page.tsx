import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME, toAbsoluteUrl } from "@/lib/seo";
import InfoPage from "../_components/InfoPage";

export const metadata: Metadata = {
  title: "Tarz Keşif Oyunu – Beğen ya da Geç",
  description:
    "Swipe yaparak tarzını keşfet. Evlumba'nın eğlenceli tasarım oyunuyla stilini bul ve sana uygun iç mimarla eşleş.",
  keywords: ["tarz keşif", "dekorasyon oyunu", "iç mimarlık tarzı", "stil testi", "Evlumba oyun"],
  alternates: { canonical: "/oyun" },
  openGraph: {
    title: "Tarz Keşif Oyunu – Beğen ya da Geç",
    description:
      "Swipe yaparak tarzını keşfet. Evlumba'nın eğlenceli tasarım oyunuyla stilini bul ve sana uygun iç mimarla eşleş.",
    url: toAbsoluteUrl("/oyun"),
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarz Keşif Oyunu – Beğen ya da Geç",
    description:
      "Swipe yaparak tarzını keşfet. Evlumba'nın eğlenceli tasarım oyunuyla stilini bul ve sana uygun iç mimarla eşleş.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function OyunPage() {
  return (
    <InfoPage
      title="Keşfetme Oyunu"
      description="Etkileşimli keşif oyunu bu sayfada yayınlanacak."
    />
  );
}
