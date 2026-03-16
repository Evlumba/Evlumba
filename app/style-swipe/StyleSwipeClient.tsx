"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as data from "@/lib/data";
import { toast } from "@/lib/toast";
import {
  buildSwipeDeck,
  consumeGoldenLike,
  saveStyleVectorFromLikes,
  type SwipeCard,
  type SwipeMode,
  type SwipeLength,
} from "@/lib/swipe";

export default function StyleSwipeClient() {
  const router = useRouter();

  const anyData: any = data;
  const rawItems: any[] =
    (Array.isArray(anyData.designs) && anyData.designs) ||
    (Array.isArray(anyData.feedItems) && anyData.feedItems) ||
    (Array.isArray(anyData.items) && anyData.items) ||
    [];

  const cards: SwipeCard[] = useMemo(() => {
    return rawItems.map((x) => ({
      id: String(x.id),
      title: String(x.title || x.name || "Tasarım"),
      imageUrl: String(x.imageUrl || x.coverUrl || "/placeholder.png"),
      tags: Array.isArray(x.tags)
        ? x.tags.map(String)
        : Array.isArray(x.styleTags)
        ? x.styleTags.map(String)
        : Array.isArray(x.styles)
        ? x.styles.map(String)
        : [],
      room: x.room || x.roomType || "",
      city: x.city || "",
    }));
  }, [rawItems]);

  const [step, setStep] = useState<"setup" | "play" | "done">("setup");
  const [mode, setMode] = useState<SwipeMode>("random");
  const [category, setCategory] = useState<string>("salon");
  const [tourLen, setTourLen] = useState<SwipeLength>(8);

  const [deck, setDeck] = useState<SwipeCard[]>([]);
  const [idx, setIdx] = useState(0);

  const [liked, setLiked] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [goldenLiked, setGoldenLiked] = useState<string[]>([]);

  const current = deck[idx]; // ✅ olabilir/olmayabilir

  function start() {
    const d = buildSwipeDeck({
      items: cards,
      mode,
      category: mode === "category" ? category : undefined,
      tourLen,
    });
    setDeck(d);
    setIdx(0);
    setLiked([]);
    setSkipped([]);
    setGoldenLiked([]);
    setStep("play");
  }

  function finish() {
    const allLiked = [...liked, ...goldenLiked];
    saveStyleVectorFromLikes({ likedIds: allLiked, allCards: deck.length ? deck : cards });
    setStep("done");
  }

  function next() {
    const nextIdx = idx + 1;
    if (nextIdx >= deck.length) return finish();
    setIdx(nextIdx);
  }

  function like() {
    if (!current) return;
    setLiked((a) => [...a, current.id]);
    next();
  }

  function skip() {
    if (!current) return;
    setSkipped((a) => [...a, current.id]);
    next();
  }

  function golden() {
    if (!current) return;
    const res = consumeGoldenLike(3);
    if (!res.ok) return toast("Golden Like hakkın bugün bitti (3/gün).");
    setGoldenLiked((a) => [...a, current.id]);
    toast(`Golden Like! Kalan: ${res.left}`);
    next();
  }

  // Deck boşalıp play'de kalırsa setup'a dön
  useEffect(() => {
    if (step === "play" && deck.length === 0) setStep("setup");
  }, [step, deck.length]);

  if (step === "setup") {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Tarzını Keşfet</h1>
        <p className="mt-2 text-gray-600">
          Hızlı tur (8) ile başlayalım. Beğenilerine göre sana özel öneriler üreteceğiz.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <div className="text-sm text-gray-600">Mod</div>
            <div className="mt-2 flex gap-2">
              <button
                className={`rounded-xl border px-4 py-2 text-sm ${
                  mode === "random" ? "bg-black text-white" : ""
                }`}
                onClick={() => setMode("random")}
              >
                Rastgele
              </button>
              <button
                className={`rounded-xl border px-4 py-2 text-sm ${
                  mode === "category" ? "bg-black text-white" : ""
                }`}
                onClick={() => setMode("category")}
              >
                Kategori
              </button>
            </div>

            {mode === "category" ? (
              <div className="mt-3">
                <div className="text-sm text-gray-600">Kategori</div>
                <select
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="salon">Salon</option>
                  <option value="mutfak">Mutfak</option>
                  <option value="yatak">Yatak Odası</option>
                  <option value="banyo">Banyo</option>
                  <option value="ofis">Ofis</option>
                  <option value="balkon">Balkon</option>
                  <option value="cocuk">Çocuk</option>
                </select>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-sm text-gray-600">Tur uzunluğu</div>
            <div className="mt-2 flex gap-2">
              <button
                className={`rounded-xl border px-4 py-2 text-sm ${
                  tourLen === 8 ? "bg-black text-white" : ""
                }`}
                onClick={() => setTourLen(8)}
              >
                Hızlı (8)
              </button>
              <button
                className={`rounded-xl border px-4 py-2 text-sm ${
                  tourLen === 20 ? "bg-black text-white" : ""
                }`}
                onClick={() => setTourLen(20)}
              >
                Uzun (20)
              </button>
            </div>
          </div>
        </div>

        <button
          className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-sm text-white"
          onClick={start}
        >
          Başla
        </button>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-2xl font-semibold">Tamamlandı ✅</h2>
        <p className="mt-2 text-gray-600">
          Tarz vektörün kaydedildi. Artık feed’de sana özel öneriler gösterebiliriz.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            className="rounded-xl bg-black px-4 py-2 text-sm text-white"
            onClick={() => router.push("/feed")}
          >
            Önerilerimi Gör
          </button>
          <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => setStep("setup")}>
            Tekrar Oyna
          </button>
        </div>
      </div>
    );
  }

  // play step
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          {idx + 1} / {deck.length || tourLen}
        </div>
        <Link className="underline" href="/feed">
          Feed
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="aspect-[4/5] bg-gray-100">
          {current ? (
            <img src={current.imageUrl} alt={current.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Kart yok (seed data)
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="font-semibold">{current?.title || "Tasarım"}</div>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-700">
            {(current?.tags ?? []).map((t) => (
              <span key={t} className="rounded-full border px-3 py-1">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button className="rounded-xl border px-3 py-2 text-sm" onClick={skip}>
              Geç
            </button>
            <button className="rounded-xl bg-black px-3 py-2 text-sm text-white" onClick={like}>
              Beğen
            </button>
            <button className="rounded-xl border px-3 py-2 text-sm" onClick={golden}>
              Golden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
