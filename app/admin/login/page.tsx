import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthLoginView from "@/app/_components/AuthLoginView";
import { getCurrentAdminContext } from "@/lib/admin/access";

// export const dynamic = "force-dynamic"; // COST-FIX: removed
export const revalidate = 60; // COST-FIX: 1 min cache

function AdminLoginFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 text-center text-sm text-slate-500">
        Giriş ekranı yükleniyor...
      </div>
    </div>
  );
}

export default async function AdminLoginPage() {
  const adminContext = await getCurrentAdminContext();
  if (adminContext) {
    redirect("/admin");
  }

  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AuthLoginView title="Admin Girişi" subtitle="" googleLabel="" minimal />
    </Suspense>
  );
}
