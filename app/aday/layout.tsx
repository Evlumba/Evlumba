import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const title = "Evlumba Kariyer | Bizimle Çalışın";
const description = "Evlumba açık pozisyonlarını inceleyin, size uygun ilana hemen başvurun.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/aday",
  },
  openGraph: {
    title,
    description,
    url: toAbsoluteUrl("/aday"),
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

export default function AdayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
