"use client";

import Link from "next/link";
import { useState } from "react";
import { loginUser } from "../../lib/storage";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Giriş</h1>
      <p className="mt-2 text-gray-600">Email ile mock giriş (LocalStorage).</p>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        <label className="text-sm font-medium">Email</label>
        <input
          className="mt-2 w-full rounded-xl border px-3 py-2"
          placeholder="orn: can@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
        />

        <button
          className="mt-5 w-full rounded-xl bg-black px-4 py-2 text-sm text-white"
          onClick={() => {
            if (!email) {
              setMsg("Lütfen email gir.");
              return;
            }
            const ok = loginUser(email);
            if (!ok) {
              setMsg("Bu email ile kayıt bulunamadı. Önce kayıt ol.");
              return;
            }
            router.push("/designers");
          }}
        >
          Giriş yap
        </button>

        {msg ? <div className="mt-3 text-sm text-gray-600">{msg}</div> : null}

        <div className="mt-4 text-sm">
          <Link className="underline" href="/register">
            Hesabın yok mu? Kayıt ol
          </Link>
        </div>
      </div>
    </div>
  );
}
