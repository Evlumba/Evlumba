"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import PopupBanner from "./PopupBanner";
import ToastHost from "../../lib/ToastHost";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Proje detay ve tasarım detay sayfalarında header/footer gizle
  const isProjectDetailPage = /^\/tasarimcilar\/[^/]+\/proje\/[^/]+$/.test(pathname);
  const isDesignDetailPage = /^\/tasarim\/[^/]+$/.test(pathname);
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isProjectDetailPage || isDesignDetailPage || isAdminPage) {
    // Detay sayfası - tam ekran, header/footer yok
    return <>{children}</>;
  }

  // Normal sayfalar - header ve footer ile
  return (
    <>
      <PopupBanner />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6">
        {children}
      </main>
      <SiteFooter />
      <ToastHost />
    </>
  );
}
