"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { designers } from "../../lib/data";
import { getSession, loadState } from "../../lib/storage";

type FollowMap = Record<string, boolean>;

export default function FeedPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [follows, setFollows] = useState<FollowMap>({});

  useEffect(() => {
    setIsLoggedIn(!!getSession());
    const st = loadState();
    setFollows(st.follows ?? {});
  }, []);

  const followedDesigners = useMemo(() => {
    return designers.filter((d) => !!follows[d.id]);
  }, [follows]);

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Takip Akışı</h1>
        <p className="mt-2 text-gray-600">Akışı görmek için önce giriş yapmalısın.</p>

        <div className="mt-4 flex gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            Giriş yap
          </Link>
          <Link href="/designers" className="rounded-xl border px-4 py-2 text-sm">
            İç mimarlara göz at
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Takip Akışı</h1>
        <Link className="underline text-sm" href="/designers">
          İç mimarlar →
        </Link>
      </div>

      {followedDesigners.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-white p-6">
          <p className="text-gray-600">
            Henüz kimseyi takip etmiyorsun. İç Mimarlar sayfasından “Takip et”e basınca
            burada yeni projeleri görürsün.
          </p>

          <Link
            href="/designers"
            className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            İç mimar keşfet
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {followedDesigners.map((d) => {
            const latest = d.projects?.[0];
            const thumbs = d.projects?.slice(0, 2) ?? [];

            return (
              <Link
                key={d.id}
                href={`/designers/${d.id}`}
                className="block overflow-hidden rounded-2xl border bg-white hover:shadow-sm"
              >
                <div className="aspect-[16/10] w-full bg-gray-100">
                  <img
                    src={d.coverUrl}
                    alt={d.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-sm text-gray-500">{d.city}</div>

                  <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                    {latest ? (
                      <>
                        <span className="font-medium">{d.name}</span> yeni proje ekledi:{" "}
                        <span className="font-medium">{latest.title}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{d.name}</span> profilini güncelledi.
                      </>
                    )}
                  </div>

                  {thumbs.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {thumbs.map((p) => (
                        <div key={p.pid} className="overflow-hidden rounded-xl border">
                          <div className="aspect-[4/3] bg-gray-100">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {d.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
