"use client";

import Link from "next/link";
import { useState } from "react";
import { addEmailLog } from "../../lib/storage";
import { toast } from "../../lib/toast";

export default function SifremiUnuttum() {
  const [email, setEmail] = useState("");

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Şifremi Unuttum</h1>
      <p className="mt-2 text-sm text-gray-600">
        Demo: E-posta log’u oluşturuyoruz.
      </p>

      <input
        className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"
        placeholder="mail@ornek.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        className="mt-4 w-full rounded-xl bg-black px-4 py-2 text-sm text-white"
        onClick={() => {
          if (!email.trim()) return toast("Lütfen e-posta gir");
          addEmailLog(email.trim(), "Şifre sıfırlama isteği (Demo)");
          toast("Sıfırlama bağlantısı gönderildi (Demo) ✅");
        }}
      >
        Sıfırlama bağlantısı gönder
      </button>

      <div className="mt-4 text-sm">
        <Link className="underline" href="/giris">Girişe dön</Link>
      </div>
    </div>
  );
}
