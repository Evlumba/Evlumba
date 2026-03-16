import { Suspense } from "react";
import AuthLoginView from "@/app/_components/AuthLoginView";

function GirisFallback() {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-3xl border border-black/10 bg-white/70 p-8 text-sm text-slate-500">
      Giriş ekranı yükleniyor...
    </div>
  );
}

export default function GirisPage() {
  return (
    <Suspense fallback={<GirisFallback />}>
      <AuthLoginView
        title="Giriş Yap"
        subtitle="Hesabına giriş yap, ilhamını kaydet ve profesyonellerle anında konuşmaya başla."
        googleLabel="Google ile giriş yap"
      />
    </Suspense>
  );
}
