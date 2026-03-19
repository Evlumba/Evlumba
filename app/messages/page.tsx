"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  homeowner_id: string;
  designer_id: string;
  created_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ProfileLite = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url?: string | null;
  role: string | null;
};

type AppRole = "homeowner" | "designer" | "designer_pending" | null;

function normalizeRole(raw: unknown): AppRole {
  if (raw === "homeowner" || raw === "designer" || raw === "designer_pending") return raw;
  return null;
}

function normalizeDesignerId(raw: string | null) {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  return value.startsWith("supa_") ? value.slice(5) : value;
}

function roleLabel(role: string | null) {
  if (role === "designer" || role === "designer_pending") return "Profesyonel";
  if (role === "homeowner") return "Kullanıcı";
  return "Hesap";
}

function isDesignerRole(role: string | null | undefined) {
  return role === "designer" || role === "designer_pending";
}

function emitMessagesUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("evlumba:messages-updated"));
}

async function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return (await Promise.race([Promise.resolve(promise), timeoutPromise])) as T;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function displayName(
  profile: ProfileLite | null | undefined,
  fallback = "Kullanıcı"
) {
  return profile?.full_name?.trim() || profile?.business_name?.trim() || fallback;
}

function avatarSrc(profile: ProfileLite | null | undefined) {
  const url = profile?.avatar_url?.trim() || "";
  return url.length > 0 ? url : null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((part) => part[0]?.toUpperCase()).filter(Boolean);
  return chars.join("") || "K";
}

function parseStructuredMessage(raw: string) {
  const lines = raw.split(/\r?\n/);
  let index = 0;
  let subject: string | null = null;
  let listingLink: string | null = null;
  let listingNo: string | null = null;

  if (lines[index]?.toLowerCase().startsWith("konu:")) {
    subject = lines[index].slice(lines[index].indexOf(":") + 1).trim() || null;
    index += 1;
  }

  while (index < lines.length) {
    const current = lines[index]?.toLowerCase() ?? "";
    if (
      current.startsWith("ilan bağlantısı:") ||
      current.startsWith("ilan baglantisi:") ||
      current.startsWith("ilan linki:")
    ) {
      listingLink = lines[index].slice(lines[index].indexOf(":") + 1).trim() || null;
      index += 1;
      continue;
    }
    if (current.startsWith("ilan no:") || current.startsWith("ilan numarası:")) {
      listingNo = lines[index].slice(lines[index].indexOf(":") + 1).trim() || null;
      index += 1;
      continue;
    }
    break;
  }

  while (index < lines.length && !lines[index].trim()) index += 1;
  const body = lines.slice(index).join("\n").trim();
  return { subject, listingLink, listingNo, body: body || raw };
}

function normalizeListingHref(raw: string | null) {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;
  try {
    const parsed = new URL(value);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function normalizeListingNo(raw: string | null) {
  if (!raw) return null;
  const normalized = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return normalized || null;
}

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const requestedDesignerId = useMemo(
    () => normalizeDesignerId(searchParams.get("designer")),
    [searchParams]
  );
  const showListingContextInMessages = !requestedDesignerId;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<AppRole>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLite>>({});
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      setLoading(true);
      setError(null);
      setMessages([]);
      try {
        const sessionUser = await new Promise<import("@supabase/supabase-js").User | null>(
          (resolve) => {
            let resolved = false;
            const timer = setTimeout(() => {
              if (!resolved) { resolved = true; resolve(null); }
            }, 10000);
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              (event, session) => {
                if (event === "INITIAL_SESSION") {
                  if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    subscription.unsubscribe();
                    resolve(session?.user ?? null);
                  }
                }
              }
            );
          }
        );
        if (cancelled) return;

        if (!sessionUser) {
          setError("Mesajlar için önce giriş yapman gerekiyor.");
          return;
        }

        const currentUserId = sessionUser.id;
        setUserId(currentUserId);

        let currentUserRole = normalizeRole(sessionUser.user_metadata?.role);
        try {
          const { data: meProfile } = await withTimeout(
            supabase.from("profiles").select("role").eq("id", currentUserId).maybeSingle(),
            7000,
            "Profil bilgileri alınamadı."
          );
          currentUserRole = normalizeRole(meProfile?.role ?? sessionUser.user_metadata?.role);
        } catch {
          // fallback to role from session metadata
        }

        if (cancelled) return;
        setUserRole(currentUserRole);

        let firstConversationId: string | null = null;
        let setupError: string | null = null;

        if (requestedDesignerId) {
          if (currentUserRole !== "homeowner") {
            setupError = "Yeni konuşma sadece kullanıcı hesabından başlatılabilir.";
          } else {
            try {
              const { data: targetRole, error: targetRoleError } = await withTimeout(
                supabase.rpc("get_profile_role", { user_id: requestedDesignerId }),
                7000,
                "Profil rolü doğrulanamadı."
              );

              if (targetRoleError) {
                setupError = targetRoleError.message;
              } else if (targetRole !== "designer" && targetRole !== "designer_pending") {
                setupError = "Sadece profesyonellere mesaj atılabilir.";
              } else {
                const { data: existingConversation, error: existingError } = await withTimeout(
                  supabase
                    .from("conversations")
                    .select("id")
                    .eq("homeowner_id", currentUserId)
                    .eq("designer_id", requestedDesignerId)
                    .maybeSingle(),
                  7000,
                  "Konuşma kontrolü zaman aşımına uğradı."
                );

                if (existingError) {
                  setupError = existingError.message;
                } else if (existingConversation?.id) {
                  firstConversationId = existingConversation.id;
                } else {
                  const { data: insertedConversation, error: insertError } = await withTimeout(
                    supabase
                      .from("conversations")
                      .insert({
                        homeowner_id: currentUserId,
                        designer_id: requestedDesignerId,
                      })
                      .select("id")
                      .single(),
                    7000,
                    "Yeni konuşma oluşturulamadı."
                  );

                  if (insertError) {
                    setupError = insertError.message;
                  } else {
                    firstConversationId = insertedConversation.id;
                  }
                }
              }
            } catch (requestError) {
              setupError =
                requestError instanceof Error
                  ? requestError.message
                  : "Konuşma başlatılırken bir hata oluştu.";
            }
          }
        }

        const { data: convs, error: convError } = await withTimeout(
          supabase
            .from("conversations")
            .select("id, homeowner_id, designer_id, created_at")
            .or(`homeowner_id.eq.${currentUserId},designer_id.eq.${currentUserId}`)
            .order("created_at", { ascending: false }),
          9000,
          "Konuşmalar yüklenirken zaman aşımı oluştu."
        );

        if (cancelled) return;
        if (convError) {
          setError(setupError ?? convError.message);
          return;
        }

        const list = convs ?? [];
        setConversations(list);

        const nextActive =
          firstConversationId && list.some((c) => c.id === firstConversationId)
            ? firstConversationId
            : list[0]?.id ?? null;
        setActiveConversationId(nextActive);

        const profileIds = Array.from(new Set(list.flatMap((c) => [c.homeowner_id, c.designer_id])));
        if (profileIds.length > 0) {
          let peopleRows: ProfileLite[] = [];

          try {
            const { data: peopleFromRpc, error: peopleRpcError } = await withTimeout(
              supabase.rpc("get_profile_briefs", { user_ids: profileIds }),
              7000,
              "Kullanıcı profilleri yüklenirken zaman aşımı oluştu."
            );
            if (!peopleRpcError && Array.isArray(peopleFromRpc)) {
              peopleRows = peopleFromRpc as ProfileLite[];
            }
          } catch {
            // fallback below
          }

          const loadedIds = new Set(peopleRows.map((row) => row.id));
          const missingIds = profileIds.filter((id) => !loadedIds.has(id));

          if (missingIds.length > 0) {
            try {
              const { data: profileRows, error: profileError } = await withTimeout(
                supabase
                  .from("profiles")
                  .select("id, full_name, business_name, avatar_url, role")
                  .in("id", missingIds),
                7000,
                "Eksik profiller yüklenemedi."
              );
              if (!profileError && Array.isArray(profileRows)) {
                peopleRows = [...peopleRows, ...(profileRows as ProfileLite[])];
              }
            } catch {
              // keep whatever we already have
            }
          }

          if (!cancelled) {
            const mapped: Record<string, ProfileLite> = {};
            for (const row of peopleRows) {
              mapped[row.id] = row;
            }
            setProfilesById(mapped);
          }
        } else {
          setProfilesById({});
        }

        if (!cancelled) {
          setError(setupError);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Bir hata oluştu, lütfen sayfayı yenileyin.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load().catch(() => {
      if (!cancelled) {
        setError("Bir hata oluştu, lütfen sayfayı yenileyin.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [requestedDesignerId]);

  useEffect(() => {
    if (!activeConversationId) return;

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    void supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true })
      .then(({ data, error: messageError }) => {
        if (cancelled) return;
        if (messageError) {
          setError(messageError.message);
          return;
        }
        setMessages(data ?? []);
      });

    void supabase
      .rpc("mark_conversation_read", { conversation_uuid: activeConversationId })
      .then(({ data }) => {
        if (!cancelled && typeof data === "number" && data > 0) {
          emitMessagesUpdated();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  async function sendMessage() {
    if (!userId || !activeConversationId || !draft.trim() || sending) return;
    const supabase = getSupabaseBrowserClient();
    setSending(true);

    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: activeConversationId,
      sender_id: userId,
      body: draft.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      setSending(false);
      return;
    }

    setDraft("");
    const { data, error: reloadError } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true });

    if (reloadError) {
      setError(reloadError.message);
    } else {
      setMessages(data ?? []);
      setError(null);
      emitMessagesUpdated();
    }

    setSending(false);
  }

  function partnerOf(conversation: Conversation) {
    if (!userId) return null;
    const partnerId =
      conversation.homeowner_id === userId ? conversation.designer_id : conversation.homeowner_id;
    return profilesById[partnerId] ?? null;
  }

  if (!userId && error) {
    return <main className="mx-auto max-w-4xl px-4 py-10 text-sm text-rose-600">{error}</main>;
  }

  const visibleMessages = activeConversationId ? messages : [];
  const activeConversation =
    activeConversationId ? conversations.find((conversation) => conversation.id === activeConversationId) : undefined;

  return (
    <main className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 py-8 md:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border bg-white p-3">
        <h1 className="mb-3 text-base font-semibold">Konuşmalar</h1>
        {loading ? (
          <div className="text-sm text-slate-500">Yükleniyor...</div>
        ) : conversations.length === 0 ? (
          <div className="space-y-1 text-sm text-slate-500">
            <p>Henüz konuşma yok.</p>
            {userRole === "homeowner" ? <p>Bir profesyonelin profilinden “Mesaj” ile başlatabilirsin.</p> : null}
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const partner = partnerOf(conversation);
              const partnerIsDesigner = conversation.homeowner_id === userId;
              const label =
                displayName(partner, partnerIsDesigner ? "Profesyonel" : "Kullanıcı");
              const partnerRole = partner?.role ?? (partnerIsDesigner ? "designer" : "homeowner");

              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    activeConversationId === conversation.id ? "bg-slate-900 text-white" : "bg-white"
                  }`}
                >
                  <div className="truncate font-semibold">{label}</div>
                  <div
                    className={`truncate text-xs ${
                      activeConversationId === conversation.id ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {roleLabel(partnerRole)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-base font-semibold">Mesajlar</h2>
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-3 max-h-[420px] space-y-2 overflow-auto rounded-xl border bg-slate-50 p-3">
          {!activeConversationId ? (
            <div className="text-sm text-slate-500">Konuşma seçildiğinde mesajlar burada görünür.</div>
          ) : visibleMessages.length === 0 ? (
            <div className="text-sm text-slate-500">Henüz mesaj yok. İlk mesajı sen yazabilirsin.</div>
          ) : (
            visibleMessages.map((message) => {
              const isOwn = message.sender_id === userId;
              const senderProfile = profilesById[message.sender_id];
              const senderName = displayName(senderProfile, isOwn ? "Sen" : "Kullanıcı");
              const senderAvatar = avatarSrc(senderProfile);
              const senderIsDesigner =
                senderProfile ? isDesignerRole(senderProfile.role) : activeConversation?.designer_id === message.sender_id;
              const senderDesignerHref = senderIsDesigner
                ? `/tasarimcilar/supa_${encodeURIComponent(message.sender_id)}`
                : null;

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  {!isOwn ? (
                    senderDesignerHref ? (
                      <Link
                        href={senderDesignerHref}
                        title={`${senderName} profiline git`}
                        className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-1 ring-black/10 transition hover:scale-105 hover:ring-black/20"
                      >
                        {senderAvatar ? (
                          <Image
                            src={senderAvatar}
                            alt={senderName}
                            width={28}
                            height={28}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-600">
                            {initials(senderName)}
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200">
                        {senderAvatar ? (
                          <Image
                            src={senderAvatar}
                            alt={senderName}
                            width={28}
                            height={28}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-600">
                            {initials(senderName)}
                          </div>
                        )}
                      </div>
                    )
                  ) : null}

                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      isOwn ? "bg-slate-900 text-white" : "bg-white"
                    }`}
                  >
                    {(() => {
                      const parsed = parseStructuredMessage(message.body);
                      const listingHref = normalizeListingHref(parsed.listingLink);
                      const listingNo = normalizeListingNo(parsed.listingNo);
                      const listingHrefFromNo = listingNo
                        ? `/ilanlar?ilanNo=${encodeURIComponent(listingNo)}`
                        : null;
                      const resolvedListingHref = listingHref ?? listingHrefFromNo;
                      const linkClass = isOwn
                        ? "text-white/90 underline decoration-white/60 hover:decoration-white"
                        : "text-slate-700 underline decoration-slate-400 hover:text-slate-900";

                      return (
                        <div className="space-y-1">
                          {showListingContextInMessages && parsed.subject ? (
                            <p className={`text-xs font-semibold ${isOwn ? "text-white/90" : "text-slate-600"}`}>
                              Konu: {parsed.subject}
                            </p>
                          ) : null}
                          {showListingContextInMessages && listingNo ? (
                            <p className={`text-xs font-semibold ${isOwn ? "text-white/90" : "text-slate-600"}`}>
                              İlan No: {listingNo}
                            </p>
                          ) : null}
                          {showListingContextInMessages && resolvedListingHref ? (
                            <Link href={resolvedListingHref} className={linkClass}>
                              İlanı Gör
                            </Link>
                          ) : null}
                          <p className="whitespace-pre-wrap">{parsed.body}</p>
                        </div>
                      );
                    })()}
                  </div>

                  {isOwn ? (
                    senderDesignerHref ? (
                      <Link
                        href={senderDesignerHref}
                        title={`${senderName} profiline git`}
                        className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-1 ring-black/10 transition hover:scale-105 hover:ring-black/20"
                      >
                        {senderAvatar ? (
                          <Image
                            src={senderAvatar}
                            alt={senderName}
                            width={28}
                            height={28}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-600">
                            {initials(senderName)}
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200">
                        {senderAvatar ? (
                          <Image
                            src={senderAvatar}
                            alt={senderName}
                            width={28}
                            height={28}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-600">
                            {initials(senderName)}
                          </div>
                        )}
                      </div>
                    )
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Mesaj yaz..."
            disabled={!activeConversationId || sending}
            className="flex-1 rounded-xl border px-3 py-2 text-sm disabled:bg-slate-100"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={!activeConversationId || !draft.trim() || sending}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Gönderiliyor..." : "Gönder"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500">Yukleniyor...</main>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
