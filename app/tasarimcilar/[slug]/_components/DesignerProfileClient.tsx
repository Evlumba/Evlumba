import ProfileHero from "./ProfileHero";
import ProfileSectionNav from "./ProfileSectionNav";
import AboutSection from "./AboutSection";


export default function DesignerProfileClient({ designer }: { designer: any }) {
  return (
    <>
      <ProfileHero designer={designer} />
      <ProfileSectionNav />

      {/* Bölümler */}
      <div className="mx-auto max-w-6xl px-4">
        <section id="hakkinda" className="scroll-mt-40 py-10">
          {/* Hakkında içeriğin */}
        </section>

        <section id="projeler" className="scroll-mt-40 py-10">
          {/* Projeler içeriğin */}
        </section>

        <section id="is" className="scroll-mt-40 py-10">
          {/* İşletme içeriğin */}
        </section>

        <section id="belgeler" className="scroll-mt-40 py-10">
          {/* Belgeler içeriğin */}
        </section>

        <section id="yorumlar" className="scroll-mt-40 py-10">
          {/* Yorumlar içeriğin */}
        </section>

        <section id="ilham" className="scroll-mt-40 py-10">
          {/* İlham Kitabı içeriğin */}
        </section>
      </div>
    </>
  );
}
