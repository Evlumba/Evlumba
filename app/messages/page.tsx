"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const requestedDesignerId = useMemo(
    () => normalizeDesignerId(searchParams.get("designer")),
    [searchParams]
  );

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

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (cancelled) return;

      if (authError || !authData.user) {
        setError("Mesajlar için önce giriş yapman gerekiyor.");
        setLoading(false);
        return;
      }

      const currentUserId = authData.user.id;
      setUserId(currentUserId);

      const { data: meProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUserId)
        .maybeSingle();

      const currentUserRole = normalizeRole(meProfile?.role ?? authData.user.user_metadata?.role);
      if (cancelled) return;
      setUserRole(currentUserRole);

      let firstConversationId: string | null = null;
      let setupError: string | null = null;

      if (requestedDesignerId) {
        if (currentUserRole !== "homeowner") {
          setupError = "Yeni konuşma sadece kullanıcı hesabından başlatılabilir.";
        } else {
          const { data: targetRole, error: targetRoleError } = await supabase.rpc(
            "get_profile_role",
            { user_id: requestedDesignerId }
          );

          if (targetRoleError) {
            setupError = targetRoleError.message;
          } else if (targetRole !== "designer" && targetRole !== "designer_pending") {
            setupError = "Sadece profesyonellere mesaj atılabilir.";
          } else {
            const { data: existingConversation, error: existingError } = await supabase
              .from("conversations")
              .select("id")
              .eq("homeowner_id", currentUserId)
              .eq("designer_id", requestedDesignerId)
              .maybeSingle();

            if (existingError) {
              setupError = existingError.message;
            } else if (existingConversation?.id) {
              firstConversationId = existingConversation.id;
            } else {
              const { data: insertedConversation, error: insertError } = await supabase
                .from("conversations")
                .insert({
                  homeowner_id: currentUserId,
                  designer_id: requestedDesignerId,
                })
                .select("id")
                .single();

              if (insertError) {
                setupError = insertError.message;
              } else {
                firstConversationId = insertedConversation.id;
              }
            }
          }
        }
      }

      const { data: convs, error: convError } = await supabase
        .from("conversations")
        .select("id, homeowner_id, designer_id, created_at")
        .or(`homeowner_id.eq.${currentUserId},designer_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (convError) {
        setError(setupError ?? convError.message);
        setLoading(false);
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
        const { data: peopleFromRpc, error: peopleRpcError } = await supabase.rpc(
          "get_profile_briefs",
          { user_ids: profileIds }
        );

        if (!peopleRpcError && Array.isArray(peopleFromRpc)) {
          peopleRows = peopleFromRpc as ProfileLite[];
        }

        // Some environments may return partial/empty data due RPC cache mismatch.
        // Fetch missing participants one-by-one via a simpler RPC signature.
        const loadedIds = new Set(peopleRows.map((row) => row.id));
        const missingIds = profileIds.filter((id) => !loadedIds.has(id));
        if (missingIds.length > 0) {
          const missingProfiles = await Promise.all(
            missingIds.map(async (id) => {
              const { data, error } = await supabase
                .rpc("get_profile_brief", { user_id: id })
                .single();
              if (error || !data) return null;
              return data as ProfileLite;
            })
          );
          peopleRows = [
            ...peopleRows,
            ...(missingProfiles.filter((row): row is ProfileLite => Boolean(row))),
          ];
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
        setLoading(false);
      }
    };

    void load();

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
                    {message.body}
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
