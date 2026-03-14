import Link from "next/link";

const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "Evlumba nedir?",
    answer:
      "Evlumba; ev sahipleri ile profesyonelleri bir araya getiren, ilham keşfi, tasarım kaydetme ve iletişim süreçlerini tek yerde toplayan bir platformdur.",
  },
  {
    question: "Evlumba’yı kullanmak ücretli mi?",
    answer:
      "Temel kullanıcı akışları ücretsizdir. Platform içinde sunulan bazı profesyonel hizmetler veya ek özellikler ileride ücretli olabilir.",
  },
  {
    question: "Nasıl hesap açabilirim?",
    answer:
      "Kayıt sayfasından e-posta/şifre ile veya Google hesabınla kayıt olabilirsin. Kayıt sırasında ev sahibi ya da profesyonel rolünü seçebilirsin.",
  },
  {
    question: "Profesyonel hesaba nasıl geçebilirim?",
    answer:
      "Profil ayarları içindeki 'Profesyonel Ol' sekmesine gidip hesabını profesyonel role yükseltebilirsin. Onay sonrası profilin profesyonel olarak görünür.",
  },
  {
    question: "Destek ekibine nasıl ulaşırım?",
    answer:
      "İletişim sayfasındaki formu doldurabilir veya doğrudan info@evlumba.com adresine e-posta gönderebilirsin.",
  },
];

export default function SssPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sık Sorulan Sorular</h1>
          <p className="mt-3 text-slate-600">
            Evlumba hakkında en çok sorulan klasik sorular ve kısa yanıtlar.
          </p>

          <div className="mt-8 space-y-3">
            {FAQS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-slate-200 bg-white p-4 open:border-sky-300 open:bg-sky-50/40"
              >
                <summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-slate-900">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/iletisim"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              İletişime Geç
            </Link>
            <Link
              href="/gizlilik"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Gizlilik
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
