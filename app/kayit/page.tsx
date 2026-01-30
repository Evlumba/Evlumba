"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser, Role } from "../../lib/storage";
import { toast } from "../../lib/toast";

// İkonlar
function HomeIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// Ev Sahibi için özellik listesi
const homeownerFeatures = [
  { icon: <SparklesIcon />, title: "Binlerce tasarım keşfet", desc: "Odana göre filtreleyip ilham al" },
  { icon: <HeartIcon />, title: "Beğendiklerini kaydet", desc: "Koleksiyonlar oluştur, düzenle" },
  { icon: <FolderIcon />, title: "Mood board hazırla", desc: "Fikirleri görselleştir, paylaş" },
  { icon: <ChatIcon />, title: "Profesyonellerle iletişim", desc: "Direkt mesaj at, teklif al" },
];

// Profesyonel için özellik listesi
const professionalFeatures = [
  { icon: <PhotoIcon />, title: "Portfolyonu sergile", desc: "Projelerini yükle, hikayeni anlat" },
  { icon: <UsersIcon />, title: "Yeni müşteriler bul", desc: "Sana uyan projeleri keşfet" },
  { icon: <ChartIcon />, title: "Görünürlüğünü artır", desc: "Arama sonuçlarında öne çık" },
  { icon: <ChatIcon />, title: "Talepleri yönet", desc: "Mesajları tek panelden takip et" },
];

// Dekoratif iç mekan görselleri - daha büyük, oyunsu yerleşim
const decorImages = [
  {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=80",
    rotate: -6,
    translateY: 8,
    size: "h-28 w-40 sm:h-36 sm:w-52",
  },
  {
    src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=500&q=80",
    rotate: 0,
    translateY: -12,
    size: "h-32 w-44 sm:h-40 sm:w-56",
  },
  {
    src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=500&q=80",
    rotate: 5,
    translateY: 4,
    size: "h-28 w-40 sm:h-36 sm:w-52",
  },
];

export default function KayitPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-violet-50/30">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.35), rgba(139,92,246,0) 60%)",
          }}
        />
        <div
          className="absolute -right-32 top-1/3 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.35), rgba(16,185,129,0) 60%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Hayalindeki Eve Bir Adım
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Keşfet, ilham al, hayata geçir
          </p>
        </div>

        {/* Dekoratif görsel bandı - oyunsu, büyük */}
        <div className="mt-8 flex justify-center items-center gap-[-8px] sm:gap-0">
          {decorImages.map((img, i) => (
            <div
              key={i}
              className={`relative ${img.size} overflow-hidden rounded-3xl shadow-xl shadow-black/10 border-4 border-white transition-transform duration-500 hover:scale-105 hover:z-10`}
              style={{
                transform: `rotate(${img.rotate}deg) translateY(${img.translateY}px)`,
                marginLeft: i > 0 ? "-16px" : "0",
                zIndex: i === 1 ? 2 : 1,
              }}
            >
              <img
                src={img.src}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/5 to-transparent" />
            </div>
          ))}
        </div>

        {step === 1 ? (
          /* STEP 1: Rol Seçimi */
          <div className="mt-10">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Seni en iyi tanımlayan hangisi?</h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Ev Sahibi Kartı */}
              <button
                type="button"
                onClick={() => setRole("homeowner")}
                className="group relative text-left"
              >
                {/* Ana kart */}
                <div
                  className={`relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                    role === "homeowner"
                      ? "border-transparent shadow-xl -translate-y-1"
                      : "border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {/* Sol kenar accent bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                      role === "homeowner" ? "bg-teal-500" : "bg-transparent"
                    }`}
                  />

                  <div className="p-5 pl-6">
                    {/* Üst kısım: Icon + Radio */}
                    <div className="flex items-start justify-between">
                      {/* Icon */}
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${
                          role === "homeowner"
                            ? "bg-teal-500 text-white shadow-md shadow-teal-500/25"
                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-50"
                        }`}
                      >
                        <HomeIcon />
                      </div>

                      {/* Radio button */}
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          role === "homeowner"
                            ? "border-teal-500 bg-teal-500"
                            : "border-gray-300 bg-white group-hover:border-gray-400"
                        }`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full bg-white transition-all duration-200 ${
                            role === "homeowner" ? "scale-100" : "scale-0"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`mt-4 text-lg font-semibold transition-colors duration-300 ${
                      role === "homeowner" ? "text-teal-900" : "text-gray-900"
                    }`}>
                      Ev Sahibiyim
                    </h3>
                    <p className="mt-0.5 text-[13px] text-gray-500">
                      Evimi güzelleştirmek, ilham almak istiyorum
                    </p>

                    {/* Divider */}
                    <div className="my-4 h-px bg-gray-100" />

                    {/* Features - kompakt */}
                    <div className="space-y-2">
                      {homeownerFeatures.map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className={`transition-colors duration-300 ${
                            role === "homeowner" ? "text-teal-500" : "text-gray-400"
                          }`}>
                            {f.icon}
                          </div>
                          <span className="text-sm text-gray-700">{f.title}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className={`mt-4 flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${
                      role === "homeowner" ? "text-teal-600" : "text-gray-500"
                    }`}>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px]">✓</span>
                      Tamamen ücretsiz
                    </div>
                  </div>
                </div>
              </button>

              {/* Profesyonel Kartı */}
              <button
                type="button"
                onClick={() => setRole("designer")}
                className="group relative text-left"
              >
                {/* Ana kart */}
                <div
                  className={`relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                    role === "designer"
                      ? "border-transparent shadow-xl -translate-y-1"
                      : "border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {/* Sol kenar accent bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                      role === "designer" ? "bg-violet-500" : "bg-transparent"
                    }`}
                  />

                  <div className="p-5 pl-6">
                    {/* Üst kısım: Icon + Radio */}
                    <div className="flex items-start justify-between">
                      {/* Icon */}
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${
                          role === "designer"
                            ? "bg-violet-500 text-white shadow-md shadow-violet-500/25"
                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-50"
                        }`}
                      >
                        <BriefcaseIcon />
                      </div>

                      {/* Radio button */}
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          role === "designer"
                            ? "border-violet-500 bg-violet-500"
                            : "border-gray-300 bg-white group-hover:border-gray-400"
                        }`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full bg-white transition-all duration-200 ${
                            role === "designer" ? "scale-100" : "scale-0"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`mt-4 text-lg font-semibold transition-colors duration-300 ${
                      role === "designer" ? "text-violet-900" : "text-gray-900"
                    }`}>
                      Profesyonelim
                    </h3>
                    <p className="mt-0.5 text-[13px] text-gray-500">
                      Tasarımcıyım, projelerimi sergileyeceğim
                    </p>

                    {/* Divider */}
                    <div className="my-4 h-px bg-gray-100" />

                    {/* Features - kompakt */}
                    <div className="space-y-2">
                      {professionalFeatures.map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className={`transition-colors duration-300 ${
                            role === "designer" ? "text-violet-500" : "text-gray-400"
                          }`}>
                            {f.icon}
                          </div>
                          <span className="text-sm text-gray-700">{f.title}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className={`mt-4 flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${
                      role === "designer" ? "text-violet-600" : "text-gray-500"
                    }`}>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-[10px]">★</span>
                      Ücretsiz başla, sonra yükselt
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Continue button */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                type="button"
                disabled={!role}
                onClick={() => setStep(2)}
                style={
                  role
                    ? {
                        background: role === "designer"
                          ? "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)"
                          : "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)",
                        boxShadow: role === "designer"
                          ? "0 4px 14px 0 rgba(124, 58, 237, 0.35)"
                          : "0 4px 14px 0 rgba(20, 184, 166, 0.35)"
                      }
                    : {}
                }
                className={`flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
                  role
                    ? "text-white hover:scale-[1.02] active:scale-[0.98]"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                Devam Et
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <p className="text-sm text-gray-500">
                Zaten hesabın var mı?{" "}
                <Link href="/giris" className="font-medium text-violet-600 hover:text-violet-700">
                  Giriş yap
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* STEP 2: Bilgi Girişi */
          <div className="mt-10">
            <div className="mx-auto max-w-md">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Geri
              </button>

              {/* Card */}
              <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-xl shadow-black/5">
                <div className="text-center">
                  <div
                    className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl ${
                      role === "designer"
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                        : "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                    }`}
                  >
                    {role === "designer" ? <BriefcaseIcon /> : <HomeIcon />}
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-gray-900">
                    {role === "designer" ? "Profesyonel Hesabı" : "Hesabını Oluştur"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {role === "designer"
                      ? "Portfolyonu hemen oluşturmaya başla"
                      : "İlham almaya bir adım kaldı"}
                  </p>
                </div>

                {/* Form */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={role === "designer" ? "Şirket veya kişi adı" : "Adın Soyadın"}
                      className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-posta</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  {/* Terms */}
                  <p className="text-xs text-gray-500">
                    Kayıt olarak{" "}
                    <Link href="/sartlar" className="text-violet-600 hover:underline">
                      Kullanım Şartları
                    </Link>
                    {" "}ve{" "}
                    <Link href="/gizlilik" className="text-violet-600 hover:underline">
                      Gizlilik Politikası
                    </Link>
                    &apos;nı kabul etmiş olursun.
                  </p>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!name.trim() || !email.trim()) {
                        toast("Lütfen ad ve e-posta gir");
                        return;
                      }
                      registerUser({ name: name.trim(), email: email.trim(), role: role! });
                      toast(role === "designer" ? "Başvurun alındı!" : "Hoş geldin!");
                      router.push("/");
                    }}
                    style={{
                      background: role === "designer"
                        ? "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)"
                        : "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)",
                      boxShadow: role === "designer"
                        ? "0 4px 14px 0 rgba(124, 58, 237, 0.35)"
                        : "0 4px 14px 0 rgba(20, 184, 166, 0.35)"
                    }}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {role === "designer" ? "Başvuru Gönder" : "Hesap Oluştur"}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-gray-400">veya</span>
                  </div>
                </div>

                {/* Social login */}
                <button
                  type="button"
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google ile devam et
                </button>

                {/* Login link */}
                <p className="mt-5 text-center text-sm text-gray-500">
                  Zaten hesabın var mı?{" "}
                  <Link href="/giris" className="font-medium text-violet-600 hover:text-violet-700">
                    Giriş yap
                  </Link>
                </p>
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Güvenli
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  30 saniyede kayıt
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  Kredi kartı gerekmez
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
