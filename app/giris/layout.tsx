import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş",
  alternates: {
    canonical: "/giris",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function GirisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
