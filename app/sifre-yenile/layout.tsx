import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Şifre Yenile",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SifreYenileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
