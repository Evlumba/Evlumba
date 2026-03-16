export default function GizlilikPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Gizlilik Politikası</h1>
          <p className="mt-3 text-sm text-slate-600">
            Son güncelleme: 14 Mart 2026
          </p>
          <p className="mt-4 text-slate-700">
            Evlumba olarak kişisel verilerinizi korumayı önceliklendiriyoruz. Bu politika, platformu
            kullanırken hangi verileri topladığımızı, bu verileri neden işlediğimizi, kimlerle
            paylaşabildiğimizi ve tercihlerinizi nasıl yönetebileceğinizi açıklar.
          </p>
        </div>

        <section className="space-y-6 text-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">1. Topladığımız Veri Türleri</h2>
            <p className="mt-2">
              Platform kullanımına bağlı olarak ad-soyad, e-posta, telefon, profil bilgileri, mesajlar,
              yorumlar, görseller, işlem ve ödeme bilgileri ile teknik kullanım verileri (IP, cihaz,
              tarayıcı, ziyaret zamanı, sayfa etkileşimleri gibi) toplayabiliriz.
            </p>
            <p className="mt-2">
              Ayrıca sosyal oturum açma, iş ortakları veya kamuya açık kaynaklar üzerinden tarafımıza
              iletilen sınırlı bilgileri de mevzuata uygun şekilde işleyebiliriz.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">2. Verileri Kullanma Amaçlarımız</h2>
            <p className="mt-2">
              Verileri; hesabınızı oluşturmak, platform işlevlerini sağlamak, teklif/mesaj akışını
              yürütmek, güvenliği artırmak, kötüye kullanımı önlemek, müşteri desteği sunmak,
              deneyimi kişiselleştirmek ve hizmet kalitesini geliştirmek için kullanırız.
            </p>
            <p className="mt-2">
              Yasal yükümlülüklerin yerine getirilmesi, uyuşmazlık yönetimi ve hakların korunması gibi
              hukuki amaçlar için de veri işlenebilir.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">3. Verilerin Paylaşımı</h2>
            <p className="mt-2">
              Verileriniz; yalnızca gerekli olduğu ölçüde altyapı, analiz, ödeme, güvenlik, iletişim ve
              destek sağlayıcılarıyla paylaşılabilir. Bazı profil/yorum içerikleri, platform doğası gereği
              diğer kullanıcılar tarafından görüntülenebilir.
            </p>
            <p className="mt-2">
              Yasal zorunluluk veya resmi makam talebi halinde, yürürlükteki mevzuat kapsamında ilgili
              kurumlara sınırlı açıklama yapılabilir.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">4. Çerezler ve Benzeri Teknolojiler</h2>
            <p className="mt-2">
              Evlumba; oturum yönetimi, güvenlik, performans ölçümü, tercihlerin hatırlanması ve içerik
              iyileştirme amaçlarıyla zorunlu ve zorunlu olmayan çerezlerden yararlanabilir.
            </p>
            <p className="mt-2">
              Çerez tercihlerinizi tarayıcı ayarlarınızdan yönetebilir, silebilir veya engelleyebilirsiniz.
              Bazı çerezleri devre dışı bırakmanız halinde platformun bazı bölümleri beklenen şekilde
              çalışmayabilir.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">5. Haklarınız ve Tercihleriniz</h2>
            <p className="mt-2">
              Uygulanabilir mevzuata göre verilerinize erişim, düzeltme, silme, işleme itiraz etme,
              taşınabilirlik talep etme ve pazarlama iletişimi tercihlerinizi güncelleme haklarına
              sahip olabilirsiniz.
            </p>
            <p className="mt-2">
              Hesap ayarlarınız üzerinden birçok tercihi doğrudan yönetebilir, kalan talepler için bizimle
              iletişime geçebilirsiniz.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">6. Saklama, Güvenlik ve Çocuklar</h2>
            <p className="mt-2">
              Verileri, işleme amacının gerektirdiği süre boyunca ve yasal saklama yükümlülüklerine uygun
              şekilde tutarız. Yetkisiz erişim, kayıp veya kötüye kullanım risklerini azaltmak için teknik ve
              idari güvenlik önlemleri uygularız.
            </p>
            <p className="mt-2">
              Evlumba 18 yaş altına yönelik bir hizmet değildir. 18 yaş altına ait veri işlendiğinin fark
              edilmesi halinde, bu veriler makul süre içinde silinir.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">7. Politika Güncellemeleri</h2>
            <p className="mt-2">
              Bu politika zaman zaman güncellenebilir. Önemli değişikliklerde platform içinde bildirim
              yayınlanır veya uygun kanallardan bilgilendirme yapılır.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">8. İletişim</h2>
            <p className="mt-2">
              Gizlilik talepleriniz için bize <a className="font-medium text-slate-900 underline" href="mailto:info@evlumba.com">info@evlumba.com</a> adresinden
              ulaşabilirsiniz.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
