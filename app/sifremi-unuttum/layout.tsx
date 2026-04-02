import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SifremiUnuttumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
