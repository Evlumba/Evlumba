"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { consumeIntendedAction, executeIntendedAction, loginUser } from "../../lib/storage";
import { toast } from "../../lib/toast";

export default function GirisPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");

  function afterLogin() {
    const action = consumeIntendedAction();
    const next = sp.get("next");

    if (action) {
      executeIntendedAction(action);
      toast("Giriş tamamlandı: aksiyon uygulandı ✅");
      router.push(action.returnTo || "/");
      return;
    }

    router.push(next || "/");
  }

  function doLogin(targetEmail: string) {
    const s = loginUser(targetEmail.trim());
    if (!s) {
      toast("Bu e-posta bulunamadı. Demo butonlarını deneyebilirsin.");
      return;
    }
    toast("Giriş başarılı ✅");
    afterLogin();
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Giriş</h1>
      <p className="mt-2 text-gray-600 text-sm">Demo için hızlı giriş butonlarını kullanabilirsin.</p>

      <div className="mt-4">
        <label className="text-sm text-gray-700">E-posta</label>
        <input
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="ornek@evlumba.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="mt-4 w-full rounded-xl bg-black px-4 py-2 text-sm text-white"
          onClick={() => doLogin(email)}
        >
          Giriş yap
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link className="underline" href="/sifremi-unuttum">Şifremi unuttum</Link>
          <Link className="underline" href="/kayit">Kayıt ol</Link>
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <div className="text-sm font-semibold">Demo Giriş</div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => doLogin("demo@evlumba.com")}>
            Demo Ev Sahibi
          </button>
          <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => doLogin("pro@evlumba.com")}>
            Demo Approved Designer
          </button>
          <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => doLogin("pending@evlumba.com")}>
            Demo Pending Designer
          </button>
          <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => doLogin("admin@evlumba.com")}>
            Demo Admin
          </button>
        </div>
      </div>
    </div>
  );
}
