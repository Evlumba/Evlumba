"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AdminRole = "super_admin" | "admin";

type DashboardProps = {
  currentRole: AdminRole;
  currentUserId: string;
};

type OverviewMetrics = {
  users: number;
  publishedBlogPosts: number;
  forumPosts: number;
  publishedListings: number;
  bannedUsers: number;
  deletedUsers: number;
};

type RecentLog = {
  id: string;
  actorUserId: string;
  actorRole: AdminRole;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
};

type ModerationUser = {
  id: string;
  fullName: string;
  businessName: string;
  role: string;
  email: string;
  city: string;
  createdAt: string;
  moderation: {
    isBanned: boolean;
    bannedReason: string | null;
    bannedUntil: string | null;
    isDeleted: boolean;
    deletedReason: string | null;
    deletedAt: string | null;
  };
  adminRole: AdminRole | null;
};

type BlogContent = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  createdAt: string;
  publishedAt: string | null;
};

type ForumContent = {
  id: string;
  topicId: string;
  topicTitle: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type ListingContent = {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  city: string;
  status: "draft" | "published" | "closed";
  createdAt: string;
};

type BlogCommentContent = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
};

type ForumReplyContent = {
  id: string;
  topicId: string;
  topicTitle: string;
  parentPostId: string | null;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type ProjectReviewContent = {
  id: string;
  designerId: string;
  designerName: string;
  homeownerId: string;
  homeownerName: string;
  projectId: string | null;
  projectTitle: string;
  rating: number | null;
  reviewText: string;
  createdAt: string;
};

type DesignerProjectContent = {
  id: string;
  designerId: string;
  designerName: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
};

type ManagedAdminUser = {
  userId: string;
  role: AdminRole;
  isActive: boolean;
  createdBy: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
};

type TabId = "overview" | "users" | "content" | "admins" | "banners";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Genel Durum" },
  { id: "users", label: "Kullanıcı Moderasyonu" },
  { id: "content", label: "İçerik Moderasyonu" },
  { id: "banners", label: "Bannerlar" },
  { id: "admins", label: "Admin Yetkileri" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("tr-TR");
}

function shortText(value: string, max = 120) {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function displayUserName(user: ModerationUser) {
  return user.fullName || user.businessName || user.id;
}

function getUserAdminPromotionAction(user: ModerationUser): { role: AdminRole; label: string } | null {
  if (!user.adminRole) return { role: "admin", label: "Admin Yap" };
  if (user.adminRole === "admin") return { role: "super_admin", label: "Super Admin Yap" };
  return null;
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } & T;
  if (!response.ok || json?.ok === false) {
    throw new Error(json?.error || "İstek başarısız oldu.");
  }
  return json;
}

export default function AdminDashboardClient({ currentRole, currentUserId }: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [overviewLoading, setOverviewLoading] = useState(false);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

  const [userLoading, setUserLoading] = useState(false);
  const [users, setUsers] = useState<ModerationUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [contentLoading, setContentLoading] = useState(false);
  const [contentSearch, setContentSearch] = useState("");
  const [blogPosts, setBlogPosts] = useState<BlogContent[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumContent[]>([]);
  const [blogComments, setBlogComments] = useState<BlogCommentContent[]>([]);
  const [forumReplies, setForumReplies] = useState<ForumReplyContent[]>([]);
  const [projectReviews, setProjectReviews] = useState<ProjectReviewContent[]>([]);
  const [listings, setListings] = useState<ListingContent[]>([]);
  const [designerProjects, setDesignerProjects] = useState<DesignerProjectContent[]>([]);
  const [busyContentId, setBusyContentId] = useState<string | null>(null);

  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<ManagedAdminUser[]>([]);
  const [newAdminUserId, setNewAdminUserId] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("admin");

  const [banners, setBanners] = useState<{ slot: number; image_url: string | null }[]>([
    { slot: 1, image_url: null },
    { slot: 2, image_url: null },
  ]);
  const [bannerUploading, setBannerUploading] = useState<number | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const canManageAdmins = currentRole === "super_admin";
  const visibleTabs = canManageAdmins ? TABS : TABS.filter((tab) => tab.id !== "admins");

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      const json = await requestJson<{ metrics: OverviewMetrics; recentLogs: RecentLog[] }>(
        "/api/admin/overview"
      );
      setMetrics(json.metrics);
      setRecentLogs(json.recentLogs ?? []);
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadUsers(query = userSearch) {
    setUserLoading(true);
    try {
      const encoded = encodeURIComponent(query.trim());
      const url = encoded ? `/api/admin/users?q=${encoded}` : "/api/admin/users";
      const json = await requestJson<{ users: ModerationUser[] }>(url);
      setUsers(json.users ?? []);
    } finally {
      setUserLoading(false);
    }
  }

  async function loadContent(query = contentSearch) {
    setContentLoading(true);
    try {
      const encoded = encodeURIComponent(query.trim());
      const url = encoded ? `/api/admin/content?q=${encoded}` : "/api/admin/content";
      const json = await requestJson<{
        blogPosts: BlogContent[];
        forumPosts: ForumContent[];
        blogComments: BlogCommentContent[];
        forumReplies: ForumReplyContent[];
        projectReviews: ProjectReviewContent[];
        listings: ListingContent[];
        designerProjects: DesignerProjectContent[];
      }>(url);
      setBlogPosts(json.blogPosts ?? []);
      setForumPosts(json.forumPosts ?? []);
      setBlogComments(json.blogComments ?? []);
      setForumReplies(json.forumReplies ?? []);
      setProjectReviews(json.projectReviews ?? []);
      setListings(json.listings ?? []);
      setDesignerProjects(json.designerProjects ?? []);
    } finally {
      setContentLoading(false);
    }
  }

  async function loadAdminUsers() {
    if (!canManageAdmins) return;
    setAdminUsersLoading(true);
    try {
      const json = await requestJson<{ adminUsers: ManagedAdminUser[] }>("/api/admin/admin-users");
      setAdminUsers(json.adminUsers ?? []);
    } finally {
      setAdminUsersLoading(false);
    }
  }

  async function reloadAfterMutation() {
    await Promise.all([
      loadOverview(),
      loadUsers(),
      loadContent(),
      canManageAdmins ? loadAdminUsers() : Promise.resolve(),
    ]);
  }

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        await Promise.all([
          loadOverview(),
          loadUsers(),
          loadContent(),
          canManageAdmins ? loadAdminUsers() : Promise.resolve(),
        ]);
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Admin paneli yüklenemedi.");
        }
      }
    }
    void boot();
    return () => {
      mounted = false;
    };
  }, [canManageAdmins]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.from("app_banners").select("slot, image_url").then(({ data }) => {
      if (data && data.length > 0) {
        setBanners(prev => prev.map(b => {
          const found = data.find((d: { slot: number; image_url: string | null }) => d.slot === b.slot);
          return found ? { ...b, image_url: found.image_url } : b;
        }));
      }
    });
  }, []);

  async function runUserAction(
    user: ModerationUser,
    action: "ban" | "unban" | "soft_delete" | "restore" | "hard_delete"
  ) {
    const actorText =
      action === "ban"
        ? "Banlamak üzeresin"
        : action === "unban"
          ? "Banı kaldırmak üzeresin"
          : action === "soft_delete"
            ? "Hesabı pasifleştirmek üzeresin"
            : action === "restore"
              ? "Hesabı tekrar aktifleştirmek üzeresin"
              : "Hesabı kalıcı olarak silmek üzeresin";

    const confirmed = window.confirm(`${actorText}: ${displayUserName(user)}\nDevam edilsin mi?`);
    if (!confirmed) return;

    let reason: string | null = null;
    let bannedUntil: string | null = null;

    if (action === "ban" || action === "soft_delete" || action === "hard_delete") {
      reason = window.prompt("Sebep (opsiyonel):", "")?.trim() || null;
    }
    if (action === "ban") {
      const input = window
        .prompt("Ban bitiş tarihi (opsiyonel, ISO format örn: 2026-12-31T23:59:59Z):", "")
        ?.trim();
      bannedUntil = input || null;
    }
    if (action === "hard_delete") {
      const text = window.prompt('Kalıcı silmeyi onaylamak için "SIL" yaz:', "")?.trim().toUpperCase();
      if (text !== "SIL") return;
    }

    setBusyUserId(user.id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await requestJson<{ ok: true }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          action,
          reason,
          bannedUntil,
        }),
      });
      setSuccessMessage(`${displayUserName(user)} için "${action}" işlemi tamamlandı.`);
      await reloadAfterMutation();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "İşlem başarısız oldu.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function removeContent(
    targetType:
      | "blog_post"
      | "forum_post"
      | "listing"
      | "blog_comment"
      | "forum_reply"
      | "project_review"
      | "designer_project",
    targetId: string
  ) {
    const confirmed = window.confirm("Bu içeriği kalıcı olarak silmek istediğine emin misin?");
    if (!confirmed) return;

    const reason = window.prompt("Silme sebebi (opsiyonel):", "")?.trim() || null;
    setBusyContentId(targetId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await requestJson<{ ok: true }>("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          targetType,
          targetId,
          action: "delete",
          reason,
        }),
      });
      setSuccessMessage("İçerik silindi.");
      await reloadAfterMutation();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "İçerik silinemedi.");
    } finally {
      setBusyContentId(null);
    }
  }

  async function sendProjectToDraft(projectId: string) {
    const confirmed = window.confirm("Bu projeyi taslağa göndermek istediğine emin misin?");
    if (!confirmed) return;

    const reason = window.prompt("Taslağa gönderme sebebi (opsiyonel):", "")?.trim() || null;
    setBusyContentId(projectId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await requestJson<{ ok: true }>("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          targetType: "designer_project",
          targetId: projectId,
          action: "send_to_draft",
          reason,
        }),
      });
      setSuccessMessage("Proje taslağa gönderildi.");
      await reloadAfterMutation();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Proje taslağa gönderilemedi.");
    } finally {
      setBusyContentId(null);
    }
  }

  async function upsertAdminUser(payload: { userId: string; role: AdminRole; isActive: boolean }) {
    setAdminUsersLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await requestJson<{ ok: true }>("/api/admin/admin-users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccessMessage("Admin yetkisi güncellendi.");
      await reloadAfterMutation();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Admin güncellemesi başarısız oldu.");
    } finally {
      setAdminUsersLoading(false);
    }
  }

  async function handleLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await logout();
      router.replace("/admin/login?next=%2Fadmin");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Çıkış yapılamadı.");
      setLogoutLoading(false);
    }
  }

  async function uploadBanner(slot: number, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setBannerError("Dosya boyutu 5 MB'dan büyük olamaz.");
      return;
    }
    setBannerUploading(slot);
    setBannerError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `slot-${slot}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("app-banners")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("app-banners").getPublicUrl(path);
      const imageUrl = urlData.publicUrl;
      const { error: dbError } = await supabase
        .from("app_banners")
        .upsert({ slot, image_url: imageUrl, updated_at: new Date().toISOString() }, { onConflict: "slot" });
      if (dbError) throw dbError;
      setBanners(prev => prev.map(b => b.slot === slot ? { ...b, image_url: imageUrl } : b));
      setSuccessMessage(`Banner ${slot} başarıyla yüklendi.`);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as Record<string, unknown>)?.message as string | undefined ??
            JSON.stringify(err);
      setBannerError(msg || "Yükleme başarısız.");
    } finally {
      setBannerUploading(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl py-4">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[0_20px_55px_-40px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Admin Console
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Platform Yönetimi</h1>
            <p className="mt-1 text-sm text-slate-600">
              Rolün: <span className="font-semibold">{currentRole}</span> • Oturum: {currentUserId}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void reloadAfterMutation()}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Veriyi Yenile
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={logoutLoading}
              className="rounded-xl border border-black/10 bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {logoutLoading ? "Çıkış..." : "Çıkış Yap"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-black/10 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {errorMessage ? (
        <section className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      {successMessage ? (
        <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </section>
      ) : null}

      {activeTab === "overview" ? (
        <section className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Toplam Kullanıcı</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{overviewLoading ? "..." : metrics?.users ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Yayındaki Blog</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {overviewLoading ? "..." : metrics?.publishedBlogPosts ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Forum Post</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{overviewLoading ? "..." : metrics?.forumPosts ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Yayındaki İlan</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {overviewLoading ? "..." : metrics?.publishedListings ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aktif Ban</p>
              <p className="mt-2 text-2xl font-bold text-rose-700">{overviewLoading ? "..." : metrics?.bannedUsers ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pasif Hesap</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">{overviewLoading ? "..." : metrics?.deletedUsers ?? 0}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">Son Admin İşlemleri</h2>
              <button
                type="button"
                onClick={() => void loadOverview()}
                className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Yenile
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Zaman</th>
                    <th className="py-2 pr-3">Admin</th>
                    <th className="py-2 pr-3">Aksiyon</th>
                    <th className="py-2 pr-3">Hedef</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-black/5">
                      <td className="py-2 pr-3 text-slate-600">{formatDate(log.createdAt)}</td>
                      <td className="py-2 pr-3 text-slate-700">
                        {log.actorName} <span className="text-xs text-slate-500">({log.actorRole})</span>
                      </td>
                      <td className="py-2 pr-3 font-medium text-slate-800">{log.action}</td>
                      <td className="py-2 pr-3 text-slate-600">
                        {log.targetType}:{log.targetId}
                      </td>
                    </tr>
                  ))}
                  {recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-sm text-slate-500">
                        Henüz işlem kaydı yok.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "users" ? (
        <section className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Ad, mail, şehir..."
              className="min-w-[240px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-slate-400"
            />
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ara
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Kullanıcı</th>
                  <th className="py-2 pr-3">Rol</th>
                  <th className="py-2 pr-3">Durum</th>
                  <th className="py-2 pr-3">Kayıt</th>
                  <th className="py-2 pr-3">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const adminPromotionAction = canManageAdmins ? getUserAdminPromotionAction(user) : null;
                  return (
                    <tr key={user.id} className="border-b border-black/5 align-top">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-900">{displayUserName(user)}</div>
                        <div className="text-xs text-slate-500">{user.email || user.id}</div>
                        {user.city ? <div className="text-xs text-slate-500">{user.city}</div> : null}
                      </td>
                      <td className="py-2 pr-3 text-slate-700">
                        {user.role}
                        {user.adminRole ? (
                          <div className="mt-1 text-xs font-semibold text-sky-700">admin: {user.adminRole}</div>
                        ) : null}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-col gap-1 text-xs">
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-1 font-semibold ${
                              user.moderation.isBanned ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {user.moderation.isBanned ? "Banned" : "Aktif"}
                          </span>
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-1 font-semibold ${
                              user.moderation.isDeleted ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {user.moderation.isDeleted ? "Pasif" : "Normal"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-xs text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            disabled={busyUserId === user.id}
                            onClick={() => void runUserAction(user, "ban")}
                            className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Banla
                          </button>
                          <button
                            type="button"
                            disabled={busyUserId === user.id}
                            onClick={() => void runUserAction(user, "unban")}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            Banı Kaldır
                          </button>
                          <button
                            type="button"
                            disabled={busyUserId === user.id}
                            onClick={() => void runUserAction(user, "soft_delete")}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                          >
                            Pasifleştir
                          </button>
                          <button
                            type="button"
                            disabled={busyUserId === user.id}
                            onClick={() => void runUserAction(user, "restore")}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                          >
                            Geri Aç
                          </button>
                          <button
                            type="button"
                            disabled={busyUserId === user.id || user.id === currentUserId}
                            onClick={() => void runUserAction(user, "hard_delete")}
                            className="rounded-lg border border-rose-400 bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-200 disabled:opacity-60"
                          >
                            Komple Sil
                          </button>

                          {canManageAdmins && adminPromotionAction ? (
                            <button
                              type="button"
                              disabled={adminUsersLoading || busyUserId === user.id}
                              onClick={() =>
                                void upsertAdminUser({
                                  userId: user.id,
                                  role: adminPromotionAction.role,
                                  isActive: true,
                                })
                              }
                              className="rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                            >
                              {adminPromotionAction.label}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!userLoading && users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-sm text-slate-500">
                      Kullanıcı bulunamadı.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "content" ? (
        <section className="mt-4 space-y-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={contentSearch}
                onChange={(event) => setContentSearch(event.target.value)}
                placeholder="Başlık, slug, yorum, içerik..."
                className="min-w-[240px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-slate-400"
              />
              <button
                type="button"
                onClick={() => void loadContent()}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ara
              </button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Blog Yazıları</h3>
              <div className="mt-3 space-y-2">
                {blogPosts.map((item) => (
                  <article key={item.id} className="rounded-xl border border-black/10 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{shortText(item.title, 80)}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {item.authorName} • {item.status} • {formatDate(item.createdAt)}
                    </p>
                    <button
                      type="button"
                      disabled={busyContentId === item.id}
                      onClick={() => void removeContent("blog_post", item.id)}
                      className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      Sil
                    </button>
                  </article>
                ))}
                {!contentLoading && blogPosts.length === 0 ? (
                  <p className="text-xs text-slate-500">Blog içeriği bulunamadı.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Forum Postları</h3>
              <div className="mt-3 space-y-2">
                {forumPosts.map((item) => (
                  <article key={item.id} className="rounded-xl border border-black/10 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{shortText(item.topicTitle || "Başlıksız", 70)}</p>
                    <p className="mt-1 text-xs text-slate-600">{shortText(item.body, 90)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.authorName} • {formatDate(item.createdAt)}
                    </p>
                    <button
                      type="button"
                      disabled={busyContentId === item.id}
                      onClick={() => void removeContent("forum_post", item.id)}
                      className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      Sil
                    </button>
                  </article>
                ))}
                {!contentLoading && forumPosts.length === 0 ? (
                  <p className="text-xs text-slate-500">Forum içeriği bulunamadı.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Forum Yanıtları</h3>
              <div className="mt-3 space-y-2">
                {forumReplies.map((item) => (
                  <article key={item.id} className="rounded-xl border border-black/10 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{shortText(item.topicTitle || "Başlıksız", 70)}</p>
                    <p className="mt-1 text-xs text-slate-600">{shortText(item.body, 90)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.authorName} • {formatDate(item.createdAt)}
                    </p>
                    <button
                      type="button"
                      disabled={busyContentId === item.id}
                      onClick={() => void removeContent("forum_reply", item.id)}
                      className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      Sil
                    </button>
                  </article>
                ))}
                {!contentLoading && forumReplies.length === 0 ? (
                  <p className="text-xs text-slate-500">Forum yanıtı bulunamadı.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">İlanlar</h3>
              <div className="mt-3 space-y-2">
                {listings.map((item) => (
                  <article key={item.id} className="rounded-xl border border-black/10 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{shortText(item.title, 80)}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {item.ownerName} • {item.city} • {item.status}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                    <button
                      type="button"
                      disabled={busyContentId === item.id}
                      onClick={() => void removeContent("listing", item.id)}
                      className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      Sil
                    </button>
                  </article>
                ))}
                {!contentLoading && listings.length === 0 ? (
                  <p className="text-xs text-slate-500">İlan bulunamadı.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Projeler</h3>
              <div className="mt-3 space-y-2">
                {designerProjects.map((item) => (
                  <article key={item.id} className="rounded-xl border border-black/10 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{shortText(item.title || "Başlıksız Proje", 80)}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {item.designerName} • {item.isPublished ? "Yayında" : "Taslak"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={busyContentId === item.id || !item.isPublished}
                        onClick={() => void sendProjectToDraft(item.id)}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                      >
                        Taslağa Gönder
                      </button>
                      <button
                        type="button"
                        disabled={busyContentId === item.id}
                        onClick={() => void removeContent("designer_project", item.id)}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      >
                        Kaldır
                      </button>
                    </div>
                  </article>
                ))}
                {!contentLoading && designerProjects.length === 0 ? (
                  <p className="text-xs text-slate-500">Proje bulunamadı.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Blog Yorumları</h3>
              <div className="mt-3 space-y-2">
                {blogComments.map((item) => (
                  <article key={item.id} className="rounded-xl border border-black/10 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{shortText(item.postTitle || "Blog Yorumu", 80)}</p>
                    <p className="mt-1 text-xs text-slate-600">{shortText(item.body, 90)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.userName} • {formatDate(item.createdAt)}
                    </p>
                    <button
                      type="button"
                      disabled={busyContentId === item.id}
                      onClick={() => void removeContent("blog_comment", item.id)}
                      className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      Sil
                    </button>
                  </article>
                ))}
                {!contentLoading && blogComments.length === 0 ? (
                  <p className="text-xs text-slate-500">Blog yorumu bulunamadı.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Proje Yorumları</h3>
              <div className="mt-3 space-y-2">
                {projectReviews.map((item) => (
                  <article key={item.id} className="rounded-xl border border-black/10 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{shortText(item.projectTitle || "Proje Yorumu", 80)}</p>
                    <p className="mt-1 text-xs text-slate-600">{shortText(item.reviewText, 90)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.homeownerName} → {item.designerName} • Puan: {item.rating ?? "-"} • {formatDate(item.createdAt)}
                    </p>
                    <button
                      type="button"
                      disabled={busyContentId === item.id}
                      onClick={() => void removeContent("project_review", item.id)}
                      className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      Sil
                    </button>
                  </article>
                ))}
                {!contentLoading && projectReviews.length === 0 ? (
                  <p className="text-xs text-slate-500">Proje yorumu bulunamadı.</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "admins" && canManageAdmins ? (
        <section className="mt-4 space-y-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">Yeni Admin Ata</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={newAdminUserId}
                onChange={(event) => setNewAdminUserId(event.target.value)}
                placeholder="Kullanıcı UUID"
                className="min-w-[280px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-slate-400"
              />
              <select
                value={newAdminRole}
                onChange={(event) => setNewAdminRole(event.target.value as AdminRole)}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-slate-400"
              >
                <option value="admin">admin</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  void upsertAdminUser({
                    userId: newAdminUserId.trim(),
                    role: newAdminRole,
                    isActive: true,
                  })
                }
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kaydet
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Super admin ataması için kullanıcı önce aktif admin olmalı.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">Mevcut Adminler</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Kullanıcı</th>
                    <th className="py-2 pr-3">Rol</th>
                    <th className="py-2 pr-3">Durum</th>
                    <th className="py-2 pr-3">Atayan</th>
                    <th className="py-2 pr-3">Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((adminUser) => (
                    <tr key={adminUser.userId} className="border-b border-black/5">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-900">{adminUser.userName}</div>
                        <div className="text-xs text-slate-500">{adminUser.userId}</div>
                      </td>
                      <td className="py-2 pr-3 text-slate-700">{adminUser.role}</td>
                      <td className="py-2 pr-3 text-slate-700">{adminUser.isActive ? "Aktif" : "Pasif"}</td>
                      <td className="py-2 pr-3 text-xs text-slate-500">{adminUser.createdByName}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            disabled={adminUsersLoading}
                            onClick={() =>
                              void upsertAdminUser({
                                userId: adminUser.userId,
                                role: adminUser.role === "super_admin" ? "admin" : "super_admin",
                                isActive: adminUser.isActive,
                              })
                            }
                            className="rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                          >
                            {adminUser.role === "admin" ? "Super Admin Yap" : "Admin Yap"}
                          </button>
                          <button
                            type="button"
                            disabled={adminUsersLoading}
                            onClick={() =>
                              void upsertAdminUser({
                                userId: adminUser.userId,
                                role: adminUser.role,
                                isActive: !adminUser.isActive,
                              })
                            }
                            className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                          >
                            {adminUser.isActive ? "Pasifleştir" : "Aktifleştir"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!adminUsersLoading && adminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-sm text-slate-500">
                        Kayıtlı admin bulunamadı.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "banners" ? (
        <section className="mt-4 space-y-6">
          {bannerError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{bannerError}</div>
          ) : null}
          {([1, 2] as const).map((slot) => {
            const banner = banners.find((b) => b.slot === slot);
            const slotLabel = slot === 1
              ? "Banner 1 — Kategorilerden Sonra"
              : "Banner 2 — Profesyonellerden Sonra";
            const dimInfo = "Önerilen boyut: 1080 × 400px (yatay, 2.7:1 oran). Maks. 5 MB.";
            return (
              <div key={slot} className="rounded-2xl border border-black/10 bg-white p-4">
                <h2 className="text-base font-semibold text-slate-900">{slotLabel}</h2>
                <p className="mt-1 text-xs text-slate-500">{dimInfo}</p>
                {banner?.image_url ? (
                  <div className="mt-3">
                    <img
                      src={banner.image_url}
                      alt={`Banner ${slot}`}
                      className="w-full rounded-xl object-cover"
                      style={{ aspectRatio: "2.7 / 1" }}
                    />
                  </div>
                ) : (
                  <div className="mt-3 flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-black/10 bg-slate-50 text-sm text-slate-400">
                    Henüz banner yüklenmedi
                  </div>
                )}
                <div className="mt-3">
                  <label className="block">
                    <span className="sr-only">Banner seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={bannerUploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadBanner(slot, file);
                        e.target.value = "";
                      }}
                      className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-xl file:border file:border-black/10 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-50 disabled:opacity-60"
                    />
                  </label>
                  {bannerUploading === slot ? (
                    <p className="mt-2 text-xs text-slate-500">Yükleniyor...</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}
