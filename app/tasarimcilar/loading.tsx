export default function DesignersLoading() {
  return (
    <main className="min-h-screen">
      <section className="px-4">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-[28px] border border-slate-200/70 bg-white/75 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="h-5 w-44 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[24px] border border-slate-200/70 bg-white/80 p-4 shadow-sm"
              >
                <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                <div className="mt-4 h-5 w-2/3 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
                <div className="mt-4 flex gap-2">
                  <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
