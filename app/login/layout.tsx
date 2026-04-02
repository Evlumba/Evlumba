import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oturum Aç",
  alternates: {
    canonical: "/giris",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
