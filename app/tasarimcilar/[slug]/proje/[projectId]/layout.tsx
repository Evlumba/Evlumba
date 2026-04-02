// app/tasarimcilar/[slug]/proje/[projectId]/layout.tsx

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bu layout full-screen proje detay görünümü için
  // Ana layout'taki header/footer bu sayfa için gizlenecek
  return (
    <div className="project-detail-page">
      {children}
    </div>
  );
}
