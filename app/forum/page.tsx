"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AppRole = "homeowner" | "designer" | "designer_pending" | null;
type AdminRole = "admin" | "super_admin";

type ForumMember = {
  user_id: string;
  lumba_name: string;
};

type ForumTopic = {
  id: string;
  slug: string;
  title: string;
  is_pinned: boolean;
  starter_body: string | null;
  created_at: string;
  last_post_at: string;
};

type PostAuthorRelation =
  | {
      lumba_name: string | null;
    }
  | Array<{
      lumba_name: string | null;
    }>
  | null;

type ForumPostRow = {
  id: string;
  topic_id: string;
  author_id: string;
  parent_post_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author: PostAuthorRelation;
};

type ForumPost = {
  id: string;
  topic_id: string;
  author_id: string;
  parent_post_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_admin_role: AdminRole | null;
};

const EDIT_WINDOW_MS = 5 * 60 * 1000;

function normalizeRole(raw: unknown): AppRole {
  if (raw === "homeowner" || raw === "designer" || raw === "designer_pending") return raw;
  return null;
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getAuthorName(author: PostAuthorRelation) {
  if (!author) return "Lumba";
  if (Array.isArray(author)) {
    return author[0]?.lumba_name?.trim() || "Lumba";
  }
  return author.lumba_name?.trim() || "Lumba";
}

function getAdminBadgeLabel(role: AdminRole | null | undefined) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return null;
}

async function fetchUserAdminRoles(userIds: string[]) {
  const ids = Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
  if (ids.length === 0) return {} as Record<string, AdminRole>;

  try {
    const response = await fetch("/api/public/user-admin-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // cache: "no-store", // COST-FIX: use default caching
      body: JSON.stringify({ userIds: ids }),
    });
    const json = (await response.json().catch(() => null)) as
      | { ok?: boolean; roles?: Record<string, AdminRole> }
      | null;
    if (!response.ok || !json?.ok) return {};
    return json.roles ?? {};
  } catch {
    return {};
  }
}

function renderBoldTextLine(line: string, lineKey: string) {
  const segments = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return segments.map((segment, index) => {
    const key = `${lineKey}-${index}`;
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-slate-900">
          {segment.slice(2, -2)}
        </strong>
      );
    }
    return <span key={key}>{segment}</span>;
  });
}

function renderStarterBody(text: string) {
  return text.split(/\r?\n/).map((line, index) => {
    if (!line.trim()) {
      return <div key={`space-${index}`} className="h-2" />;
    }
    return (
      <p key={`line-${index}`} className="leading-6">
        {renderBoldTextLine(line, `line-${index}`)}
      </p>
    );
  });
}

function ForumPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSlug = searchParams.get("konu");

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeTopicSlug, setActiveTopicSlug] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [selfAdminRole, setSelfAdminRole] = useState<AdminRole | null>(null);
  const [member, setMember] = useState<ForumMember | null>(null);

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [joining, setJoining] = useState(false);

  const [topicTitle, setTopicTitle] = useState("");
  const [topicFirstMessage, setTopicFirstMessage] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");

  const [replyBody, setReplyBody] = useState("");
  const [replyToPost, setReplyToPost] = useState<ForumPost | null>(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isProfessional = role === "designer" || role === "designer_pending";
  const isAdmin = selfAdminRole === "admin" || selfAdminRole === "super_admin";
  const canJoinForum = isProfessional || isAdmin;
  const canParticipate = Boolean(userId && member?.lumba_name && canJoinForum);

  const postsById = (() => {
    const mapped: Record<string, ForumPost> = {};
    for (const post of posts) {
      mapped[post.id] = post;
    }
    return mapped;
  })();

  const activeTopic = topics.find((topic) => topic.id === activeTopicId) ?? null;
  const filteredTopics = topics.filter((topic) =>
    topic.title.toLocaleLowerCase("tr-TR").includes(topicSearch.trim().toLocaleLowerCase("tr-TR"))
  );

  async function loadAuthAndMembership() {
    const supabase = getSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();

    const uid = authData.user?.id ?? null;
    setUserId(uid);

    if (!uid || !authData.user) {
      setRole(null);
      setSelfAdminRole(null);
      setMember(null);
      return;
    }
    const [{ data: profile }, { data: memberData }, { data: adminRoleData }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", uid).maybeSingle(),
      supabase.from("forum_members").select("user_id, lumba_name").eq("user_id", uid).maybeSingle(),
      supabase.rpc("get_admin_role", { user_uuid: uid }),
    ]);

    const resolvedRole = normalizeRole(profile?.role ?? authData.user.user_metadata?.role);
    setRole(resolvedRole);
    const resolvedAdminRole =
      adminRoleData === "admin" || adminRoleData === "super_admin" ? adminRoleData : null;
    setSelfAdminRole(resolvedAdminRole);

    setMember(memberData ?? null);
    setJoinInput(memberData?.lumba_name ?? "");
  }

  async function loadTopics(selectedSlug: string | null) {
    const supabase = getSupabaseBrowserClient();
    const { data, error: topicsError } = await supabase
      .from("forum_topics")
      .select("id, slug, title, is_pinned, starter_body, created_at, last_post_at")
      .order("is_pinned", { ascending: false })
      .order("last_post_at", { ascending: false });

    if (topicsError) {
      setError(topicsError.message);
      setTopics([]);
      setActiveTopicId(null);
      setActiveTopicSlug(null);
      return;
    }

    const nextTopics = (data ?? []) as ForumTopic[];
    setTopics(nextTopics);

    if (nextTopics.length === 0) {
      setActiveTopicId(null);
      setActiveTopicSlug(null);
      return;
    }

    const wanted = selectedSlug
      ? nextTopics.find((topic) => topic.slug === selectedSlug) ?? nextTopics[0]
      : nextTopics[0];

    setActiveTopicId(wanted.id);
    setActiveTopicSlug(wanted.slug);
  }

  async function loadPosts(topicId: string) {
    setPostsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data, error: postsError } = await supabase
      .from("forum_posts")
      .select(
        "id, topic_id, author_id, parent_post_id, body, created_at, updated_at, author:forum_members!forum_posts_author_id_fkey(lumba_name)"
      )
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });

    if (postsError) {
      setPosts([]);
      setError(postsError.message);
      setPostsLoading(false);
      return;
    }

    const mapped = ((data ?? []) as ForumPostRow[]).map((row) => ({
      id: row.id,
      topic_id: row.topic_id,
      author_id: row.author_id,
      parent_post_id: row.parent_post_id,
      body: row.body,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author_name: getAuthorName(row.author),
      author_admin_role: null,
    }));

    const adminRoleByUserId = await fetchUserAdminRoles(mapped.map((item) => item.author_id));
    const postsWithRoles = mapped.map((item) => ({
      ...item,
      author_admin_role: adminRoleByUserId[item.author_id] ?? null,
    }));

    setPosts(postsWithRoles);
    setPostsLoading(false);
  }

  async function refreshAll(selectedSlug: string | null) {
    setLoading(true);
    setError(null);
    await Promise.all([loadAuthAndMembership(), loadTopics(selectedSlug)]);
    setLoading(false);
  }

  useEffect(() => {
    void refreshAll(requestedSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedSlug]);

  useEffect(() => {
    if (!activeTopicId) {
      setPosts([]);
      return;
    }
    void loadPosts(activeTopicId);
  }, [activeTopicId]);

  async function handleJoinForum() {
    if (!userId) {
      router.push(`/giris?redirect=${encodeURIComponent("/forum")}`);
      return;
    }

    if (!canJoinForum) {
      setError("Foruma sadece profesyoneller katılabilir.");
      return;
    }

    const lumbaName = joinInput.trim();
    if (lumbaName.length < 3) {
      setError("LumbaName en az 3 karakter olmalı.");
      return;
    }

    setJoining(true);
    setError(null);
    setNotice(null);

    const supabase = getSupabaseBrowserClient();
    const { data, error: joinError } = await supabase
      .from("forum_members")
      .upsert(
        {
          user_id: userId,
          lumba_name: lumbaName,
        },
        {
          onConflict: "user_id",
        }
      )
      .select("user_id, lumba_name")
      .single();

    if (joinError) {
      if (joinError.message.toLowerCase().includes("duplicate key")) {
        setError("Bu LumbaName kullanılıyor. Başka bir isim dene.");
      } else {
        setError(joinError.message);
      }
      setJoining(false);
      return;
    }

    setMember(data);
    setNotice("Foruma başarıyla katıldın.");
    setJoinModalOpen(false);
    setJoining(false);
  }

  function handleTopicSelect(topic: ForumTopic) {
    setActiveTopicId(topic.id);
    setActiveTopicSlug(topic.slug);
    setReplyToPost(null);
    setReplyBody("");
    router.replace(`/forum?konu=${encodeURIComponent(topic.slug)}`, { scroll: false });
  }

  async function handleCreateTopic() {
    if (!userId || !canParticipate) return;

    const title = topicTitle.trim();
    const firstMessage = topicFirstMessage.trim();

    if (title.length < 5) {
      setError("Konu başlığı en az 5 karakter olmalı.");
      return;
    }
    if (firstMessage.length < 5) {
      setError("Konu mesajı en az 5 karakter olmalı.");
      return;
    }

    setCreatingTopic(true);
    setError(null);
    setNotice(null);

    const supabase = getSupabaseBrowserClient();
    const usedSlugs = new Set(topics.map((topic) => topic.slug));
    const baseSlug = slugify(title) || `konu-${Date.now()}`;
    let slug = baseSlug;
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const { data: topicData, error: topicError } = await supabase
      .from("forum_topics")
      .insert({
        title,
        slug,
        created_by: userId,
        is_pinned: false,
      })
      .select("id, slug, title, is_pinned, created_at, last_post_at")
      .single();

    if (topicError || !topicData) {
      setError(topicError?.message ?? "Konu açılamadı.");
      setCreatingTopic(false);
      return;
    }

    const { error: postError } = await supabase.from("forum_posts").insert({
      topic_id: topicData.id,
      author_id: userId,
      body: firstMessage,
    });

    if (postError) {
      setError(postError.message);
      setCreatingTopic(false);
      return;
    }

    setTopicTitle("");
    setTopicFirstMessage("");
    setNotice("Konu oluşturuldu.");
    await loadTopics(topicData.slug);
    await loadPosts(topicData.id);
    setCreatingTopic(false);
  }

  async function handleSendReply() {
    if (!userId || !canParticipate || !activeTopicId) return;
    const body = replyBody.trim();
    if (!body) return;
    const parentPostId =
      replyToPost && replyToPost.topic_id === activeTopicId && postsById[replyToPost.id]
        ? replyToPost.id
        : null;

    setSendingReply(true);
    setError(null);
    setNotice(null);

    const supabase = getSupabaseBrowserClient();
    const { error: replyError } = await supabase.from("forum_posts").insert({
      topic_id: activeTopicId,
      author_id: userId,
      parent_post_id: parentPostId,
      body,
    });

    if (replyError) {
      const lowered = replyError.message.toLowerCase();
      if (lowered.includes("row-level security") || lowered.includes("violates")) {
        setError("Yanıt gönderilemedi. Forum şema güncellemesini uygulayıp tekrar dene.");
      } else {
        setError(replyError.message);
      }
      setSendingReply(false);
      return;
    }

    setReplyBody("");
    setReplyToPost(null);
    await Promise.all([loadPosts(activeTopicId), loadTopics(activeTopicSlug)]);
    setSendingReply(false);
  }

  function canEditPost(post: ForumPost) {
    if (!userId || post.author_id !== userId) return false;
    const createdAtTs = new Date(post.created_at).getTime();
    if (Number.isNaN(createdAtTs)) return false;
    return Date.now() - createdAtTs <= EDIT_WINDOW_MS;
  }

  function beginEdit(post: ForumPost) {
    setEditingPostId(post.id);
    setEditingBody(post.body);
    setError(null);
    setNotice(null);
  }

  function cancelEdit() {
    setEditingPostId(null);
    setEditingBody("");
  }

  async function saveEdit(post: ForumPost) {
    if (!userId || editingPostId !== post.id || savingEdit) return;
    const nextBody = editingBody.trim();
    if (!nextBody) {
      setError("Mesaj boş olamaz.");
      return;
    }

    setSavingEdit(true);
    setError(null);
    setNotice(null);

    const supabase = getSupabaseBrowserClient();
    const { error: editError } = await supabase
      .from("forum_posts")
      .update({ body: nextBody })
      .eq("id", post.id)
      .eq("author_id", userId);

    if (editError) {
      const lowered = editError.message.toLowerCase();
      if (lowered.includes("row-level security") || lowered.includes("violates")) {
        setError("Düzenleme süresi doldu. Mesajlar yalnızca ilk 5 dakika içinde düzenlenebilir.");
      } else {
        setError(editError.message);
      }
      setSavingEdit(false);
      return;
    }

    setEditingPostId(null);
    setEditingBody("");
    setNotice("Mesaj güncellendi.");
    await loadPosts(post.topic_id);
    setSavingEdit(false);
  }

  return (
    <main className="mx-auto w-full max-w-6xl py-4">
      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-[0_22px_55px_-40px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Forum</h1>
            <p className="mt-1 text-sm text-slate-600">
              Herkes okuyabilir; konu açmak ve yanıt yazmak için foruma katılman gerekir. Sadece profesyoneller içerik oluşturabilir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!userId ? (
              <button
                type="button"
                onClick={() => router.push(`/giris?redirect=${encodeURIComponent("/forum")}`)}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Katılmak için giriş yap
              </button>
            ) : canJoinForum ? (
              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                {member ? `LumbaName: ${member.lumba_name}` : "Foruma Katıl"}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl border border-black/10 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500"
              >
                Sadece profesyoneller katılabilir
              </button>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-black/10 bg-white/85 p-4 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.25)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ana Başlıklar</h2>
          <div className="mt-2">
            <input
              value={topicSearch}
              onChange={(event) => setTopicSearch(event.target.value)}
              placeholder="Forumda ara..."
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Yükleniyor...</p>
          ) : filteredTopics.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Aramana uygun konu bulunamadı.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {filteredTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleTopicSelect(topic)}
                  className={[
                    "w-full rounded-2xl border px-3 py-3 text-left transition",
                    activeTopicId === topic.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-black/10 bg-white text-slate-800 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="line-clamp-2 flex items-center gap-1.5 text-sm font-semibold">
                    {topic.is_pinned ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 shrink-0 text-amber-500"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M14.8 3a1 1 0 0 1 .8.4l1.9 2.5a1 1 0 0 1-.1 1.3l-1.9 1.9 2.6 4.1a1 1 0 0 1-1.5 1.3l-4-2.6-1.9 1.9a1 1 0 0 1-1.3.1L6 12.2a1 1 0 0 1-.4-.8V9.9a1 1 0 0 1 .3-.7l8.2-6a1 1 0 0 1 .7-.2zM4.3 19.7a1 1 0 0 1 1.4 0l2.6 2.6a1 1 0 1 1-1.4 1.4l-2.6-2.6a1 1 0 0 1 0-1.4z" />
                      </svg>
                    ) : null}
                    <span>{topic.title}</span>
                  </div>
                  <div
                    className={[
                      "mt-1 text-xs",
                      activeTopicId === topic.id ? "text-slate-200" : "text-slate-500",
                    ].join(" ")}
                  >
                    Son hareket: {formatDate(topic.last_post_at)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="space-y-4">
          <section className="rounded-3xl border border-black/10 bg-white/85 p-4 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.25)]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Yeni Konu Başlat
            </h2>
            {canParticipate ? (
              <div className="mt-3 space-y-2">
                <input
                  value={topicTitle}
                  onChange={(event) => setTopicTitle(event.target.value)}
                  placeholder="Konu başlığı yaz..."
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
                <textarea
                  value={topicFirstMessage}
                  onChange={(event) => setTopicFirstMessage(event.target.value)}
                  placeholder="Konuyu açarken ilk mesajını yaz..."
                  rows={3}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateTopic()}
                  disabled={creatingTopic}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingTopic ? "Oluşturuluyor..." : "Konu Aç"}
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                Konu başlatmak için foruma katılman gerekiyor.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-black/10 bg-white/85 p-4 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.25)]">
            <h2 className="text-lg font-semibold text-slate-900">
              {activeTopic?.title ?? "Konu seç"}
            </h2>
            {activeTopic ? (
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(activeTopic.created_at)} tarihinde açıldı
              </p>
            ) : null}
            {activeTopic?.starter_body?.trim() ? (
              <article className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-emerald-700">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                    Evlumba
                  </span>
                  <span>Sabit bilgilendirme</span>
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  {renderStarterBody(activeTopic.starter_body)}
                </div>
              </article>
            ) : null}

            <div className="mt-4 space-y-3">
              {postsLoading ? (
                <p className="text-sm text-slate-500">Yazışmalar yükleniyor...</p>
              ) : posts.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Bu başlıkta henüz mesaj yok. İlk mesajı yazabilirsin.
                </p>
              ) : (
                posts.map((post) => {
                  const parent = post.parent_post_id ? postsById[post.parent_post_id] : null;
                  const isEditing = editingPostId === post.id;
                  const editable = canEditPost(post);
                  const authorAdminBadge = getAdminBadgeLabel(post.author_admin_role);
                  const parentAdminBadge = getAdminBadgeLabel(parent?.author_admin_role);
                  const authorNameContainerClass = authorAdminBadge
                    ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5"
                    : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5";
                  return (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-black/10 bg-white px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <div className={authorNameContainerClass}>
                          <span className={authorAdminBadge ? "font-semibold text-emerald-800" : "font-semibold text-slate-700"}>
                            {post.author_name}
                          </span>
                          {authorAdminBadge ? (
                            <span className="rounded-full border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                              {authorAdminBadge}
                            </span>
                          ) : null}
                        </div>
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                      {parent ? (
                        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                          <span
                            className={
                              parentAdminBadge
                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800"
                                : undefined
                            }
                          >
                            @{parent.author_name}
                          </span>
                          {parentAdminBadge ? ` (${parentAdminBadge})` : ""} mesajına yanıt
                        </div>
                      ) : null}
                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editingBody}
                            onChange={(event) => setEditingBody(event.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void saveEdit(post)}
                              disabled={savingEdit}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingEdit ? "Kaydediliyor..." : "Kaydet"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={savingEdit}
                              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                          {post.body}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        {editable && !isEditing ? (
                          <button
                            type="button"
                            onClick={() => beginEdit(post)}
                            className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Düzenle
                          </button>
                        ) : null}
                        {canParticipate ? (
                          <button
                            type="button"
                            onClick={() => setReplyToPost(post)}
                            className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Yanıtla
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {activeTopicId ? (
              <div className="mt-4 border-t border-black/5 pt-4">
                {canParticipate ? (
                  <div className="space-y-2">
                    {replyToPost ? (
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span>@{replyToPost.author_name} mesajına yanıt yazıyorsun</span>
                        <button
                          type="button"
                          onClick={() => setReplyToPost(null)}
                          className="rounded-md border border-black/10 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-white"
                        >
                          Temizle
                        </button>
                      </div>
                    ) : null}
                    <textarea
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      rows={4}
                      placeholder="Mesajını yaz..."
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSendReply()}
                      disabled={sendingReply || !replyBody.trim()}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sendingReply ? "Gönderiliyor..." : "Yanıt Gönder"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    Yazışmaya katılmak için önce foruma katılman gerekiyor.
                  </p>
                )}
              </div>
            ) : null}
          </section>
        </div>
      </section>

      <Modal
        open={joinModalOpen}
        title="Foruma Katıl"
        onClose={() => {
          if (!joining) setJoinModalOpen(false);
        }}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            bu isim forum paylaşımlarınızda ve forum içerisindeki yazışmalarınızda görünecek isminizdir
          </p>
          <input
            value={joinInput}
            onChange={(event) => setJoinInput(event.target.value)}
            placeholder="LumbaName"
            maxLength={32}
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="button"
            onClick={() => void handleJoinForum()}
            disabled={joining}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joining ? "Katılıyor..." : "Katıl"}
          </button>
        </div>
      </Modal>
    </main>
  );
}

export default function ForumPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl py-4 text-sm text-slate-500">
          Forum yükleniyor...
        </main>
      }
    >
      <ForumPageContent />
    </Suspense>
  );
}
