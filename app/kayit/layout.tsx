import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kayıt",
  alternates: {
    canonical: "/kayit",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function KayitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
