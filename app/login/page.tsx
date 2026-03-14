import { Suspense } from "react";
import AuthLoginView from "@/app/_components/AuthLoginView";

function LoginFallback() {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-3xl border border-black/10 bg-white/70 p-8 text-sm text-slate-500">
      Oturum açma ekranı yükleniyor...
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <AuthLoginView
        title="Oturum Aç"
        subtitle="Evlumba hesabınla devam et ve projelerini tek ekrandan yönet."
        googleLabel="Google ile oturum aç"
      />
    </Suspense>
  );
}
