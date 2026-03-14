 "use client";

import { getSupabaseBrowserClient } from "./supabase/client";

export type SessionRole = "homeowner" | "designer" | "designer_pending" | "admin" | string;

export type Role = "homeowner" | "designer";

export type Session = {
  id?: string;
  name?: string;
  email?: string;
  role?: SessionRole;
  approvedDesigner?: boolean;
  style_swipe_completed?: boolean;
  styleVector?: string[];
  [key: string]: unknown;
};

export type IntendedActionType =
  | "like"
  | "save"
  | "follow"
  | "comment"
  | "offer"
  | "toggleProjectSave";

export type IntendedAction = {
  type: IntendedActionType;
  targetId?: string;
  payload?: unknown;
  returnTo?: string;
  createdAt: number;
};

type AppState = {
  likes: Record<string, boolean>;
  follows: Record<string, boolean>;
};

type EmailLog = {
  id: string;
  type: string;
  to: string;
  subject: string;
  body: string;
  createdAt: number;
};

const SESSION_KEY = "evlumba_session_v1";
const APP_STATE_KEY = "evlumba_app_state_v1";
const INTENDED_KEY = "evlumba_intended_action_v1";
const COLLECTIONS_KEY = "evlumba_collections_v1";
const EMAIL_LOGS_KEY = "evlumba_email_logs_v1";
const SAVED_PROJECTS_KEY = "evlumba_saved_projects_v1";
let isHydratingSession = false;

function emitSessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("evlumba:session-changed"));
}

function uid(prefix = "x") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function defaultAppState(): AppState {
  return { likes: {}, follows: {} };
}

function _load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function _save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function _remove(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

/**
 * ✅ Backward compatible
 * loadState() -> AppState
 * loadState(key, fallback) -> generic
 */
export function loadState(): AppState;
export function loadState<T>(key: string, fallback: T): T;
export function loadState<T>(key?: string, fallback?: T): AppState | T {
  if (!key) return _load<AppState>(APP_STATE_KEY, defaultAppState());
  return _load<T>(key, fallback as T);
}

/**
 * ✅ Backward compatible
 * saveState(appState) OR saveState(key, value)
 */
export function saveState(value: AppState): void;
export function saveState<T>(key: string, value: T): void;
export function saveState<T>(keyOrValue: string | AppState, valueMaybe?: T) {
  if (typeof keyOrValue === "string") _save(keyOrValue, valueMaybe);
  else _save(APP_STATE_KEY, keyOrValue as AppState);
}

export function removeState(key: string) {
  _remove(key);
}

export const clearState = removeState;
export const loadJSON = loadState;
export const saveJSON = saveState;

function normalizeRole(raw: unknown): SessionRole {
  if (raw === "designer" || raw === "homeowner" || raw === "designer_pending" || raw === "admin") {
    return raw;
  }
  if (typeof raw === "string" && raw.trim()) return raw;
  return "homeowner";
}

async function buildSessionFromAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<Session> {
  const supabase = getSupabaseBrowserClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const metadata = user.user_metadata || {};
  const role = normalizeRole(profile?.role ?? metadata.role);
  const name = (profile?.full_name as string | null) ?? (metadata.full_name as string | undefined) ?? "Kullanıcı";

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    role,
    approvedDesigner: role === "designer",
  };
}

export async function syncSessionFromSupabase(): Promise<{
  ok: boolean;
  session?: Session;
  error?: string;
}> {
  let supabase;
  try {
    supabase = getSupabaseBrowserClient();
  } catch {
    return {
      ok: false,
      error: "Supabase ortam değişkenleri eksik. .env.local kontrol et ve dev server'ı yeniden başlat.",
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "Aktif kullanıcı bulunamadı." };

  const metadata = data.user.user_metadata || {};
  const fallbackName =
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    (data.user.email ? data.user.email.split("@")[0] : "Kullanıcı");
  const roleFromMetadata = normalizeRole(metadata.role);
  const fallbackRole =
    roleFromMetadata === "designer" || roleFromMetadata === "designer_pending"
      ? roleFromMetadata
      : "homeowner";

  // OAuth ile gelen ve profiles kaydı olmayan kullanıcılar için
  // minimum profil satırını açarak role/isim bağımlı akışları bozulmaktan korur.
  await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: fallbackName,
      role: fallbackRole,
    },
    {
      onConflict: "id",
      ignoreDuplicates: true,
    }
  );

  const session = await buildSessionFromAuthUser(data.user);
  setSession(session);
  return { ok: true, session };
}

function hydrateSessionInBackground() {
  if (typeof window === "undefined" || isHydratingSession) return;
  isHydratingSession = true;
  try {
    const supabase = getSupabaseBrowserClient();
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (data.session?.user) {
          const next = await buildSessionFromAuthUser(data.session.user);
          setSession(next);
        }
      })
      .finally(() => {
        isHydratingSession = false;
      });
  } catch (error) {
    console.warn("Supabase session hydration skipped:", error);
    isHydratingSession = false;
  }
}

/** Session helpers */
export function getSession(): Session | null {
  const cached = _load<Session | null>(SESSION_KEY, null);
  if (!cached) hydrateSessionInBackground();
  return cached;
}

export function setSession(session: Session) {
  _save(SESSION_KEY, session);
  emitSessionChanged();
}

export function logout() {
  _remove(SESSION_KEY);
  emitSessionChanged();
  if (typeof window !== "undefined") {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.signOut();
  }
}

/** Intended Action */
export function setIntendedAction(action: Omit<IntendedAction, "createdAt"> & { createdAt?: number }) {
  const payload: IntendedAction = {
    ...action,
    createdAt: action.createdAt ?? Date.now(),
  };
  _save(INTENDED_KEY, payload);
}

export function consumeIntendedAction(): IntendedAction | null {
  const a = _load<IntendedAction | null>(INTENDED_KEY, null);
  _remove(INTENDED_KEY);
  return a;
}

export function executeIntendedAction(action: IntendedAction | null): { ok: boolean; message?: string } {
  if (!action) return { ok: true };

  const st = _load<AppState>(APP_STATE_KEY, defaultAppState());

  if (action.type === "follow" && action.targetId) {
    st.follows[action.targetId] = true;
    _save(APP_STATE_KEY, st);
    return { ok: true, message: "Takip edildi ✅" };
  }

  if (action.type === "like" && action.targetId) {
    st.likes[action.targetId] = !st.likes[action.targetId];
    _save(APP_STATE_KEY, st);
    return { ok: true, message: st.likes[action.targetId] ? "Beğenildi ✅" : "Beğeni kaldırıldı" };
  }

  if (action.type === "save" && action.targetId) {
    type Col = {
      id: string;
      name: string;
      items: string[];
      shareable?: boolean;
      shareId?: string;
      createdAt: number;
    };
    const cols = _load<Col[]>(COLLECTIONS_KEY, []);
    let saved = cols.find((c) => c.name === "Kaydedilenler");
    if (!saved) {
      saved = { id: uid("col"), name: "Kaydedilenler", items: [], createdAt: Date.now(), shareable: false };
      cols.unshift(saved);
    }
    if (!saved.items.includes(action.targetId)) saved.items.unshift(action.targetId);
    _save(COLLECTIONS_KEY, cols);
    return { ok: true, message: "Kaydedildi ✅" };
  }

  return { ok: true, message: "İşlem tamam ✅" };
}

/** Auth (demo) */
export async function registerUser(input: {
  name: string;
  email: string;
  password?: string;
  role: Role;
}): Promise<{ ok: boolean; error?: string; message?: string; requiresEmailConfirmation?: boolean }> {
  let supabase;
  try {
    supabase = getSupabaseBrowserClient();
  } catch {
    return { ok: false, error: "Supabase ortam değişkenleri eksik. .env.local kontrol et ve dev server'ı yeniden başlat." };
  }
  const email = (input.email || "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Email gerekli" };
  const password = String(input.password || "").trim();
  if (password.length < 6) return { ok: false, error: "Şifre en az 6 karakter olmalı" };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: input.name || "Kullanıcı",
        role: input.role,
      },
    },
  });

  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "Kullanıcı oluşturulamadı" };
  if (!data.session && (data.user.identities?.length ?? 0) === 0) {
    return { ok: false, error: "Bu e-posta zaten kayıtlı. Giriş yapmayı dene." };
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    full_name: input.name || "Kullanıcı",
    role: input.role,
  });
  // Email doğrulama açık projelerde signUp sonrası session olmayabilir.
  // Bu durumda profile upsert RLS'e takılsa bile kayıt akışını bozmayalım.
  if (profileError) {
    console.warn("Profile upsert warning after signUp:", profileError.message);
  }

  if (data.session?.user) {
    const session = await buildSessionFromAuthUser(data.session.user);
    setSession(session);
  }
  if (!data.session) {
    return {
      ok: true,
      message: "Doğrulama e-postası gönderildi. E-postanı onaylayıp giriş yap.",
      requiresEmailConfirmation: true,
    };
  }

  return { ok: true, message: "Kayıt tamamlandı." };
}

export async function loginUser(
  emailOrInput: string | { email: string; password?: string },
  passwordMaybe?: string
): Promise<{ ok: boolean; session?: Session; error?: string }> {
  let supabase;
  try {
    supabase = getSupabaseBrowserClient();
  } catch {
    return { ok: false, error: "Supabase ortam değişkenleri eksik. .env.local kontrol et ve dev server'ı yeniden başlat." };
  }
  const email =
    typeof emailOrInput === "string"
      ? emailOrInput.trim().toLowerCase()
      : (emailOrInput.email || "").trim().toLowerCase();

  const password = typeof emailOrInput === "string" ? passwordMaybe || "" : emailOrInput.password || "";

  if (!email) return { ok: false, error: "Email gerekli" };
  if (!password) return { ok: false, error: "Şifre gerekli" };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "Kullanıcı bulunamadı" };

  const session = await buildSessionFromAuthUser(data.user);

  setSession(session);
  return { ok: true, session };
}

export function loginDemo(role: SessionRole): Session {
  const s: Session = {
    id: uid("user"),
    name:
      role === "admin"
        ? "Demo Admin"
        : role === "designer"
        ? "Demo Profesyonel"
        : role === "designer_pending"
        ? "Demo Profesyonel (Onay Bekliyor)"
        : "Demo Ev Sahibi",
    email: `${String(role)}@demo.evlumba`,
    role,
    approvedDesigner: role === "designer",
    style_swipe_completed: role !== "designer_pending",
    styleVector: role === "homeowner" ? ["Japandi", "Minimal", "Açık Ton"] : [],
  };
  setSession(s);
  return s;
}

/** Email logs */
/** Email logs (backward compatible) */
export function addEmailLog(to: string, subject: string): EmailLog;
export function addEmailLog(input: Omit<EmailLog, "id" | "createdAt">): EmailLog;
export function addEmailLog(arg1: string | Omit<EmailLog, "id" | "createdAt">, arg2?: string) {
  const logs = loadState<EmailLog[]>(EMAIL_LOGS_KEY, []);

  const entry: EmailLog = typeof arg1 === "string"
    ? {
        id: `mail_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: Date.now(),
        type: "password_reset",
        to: arg1,
        subject: String(arg2 ?? "Email"),
        body: "",
      }
    : {
        id: `mail_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: Date.now(),
        ...arg1,
      };

  saveState(EMAIL_LOGS_KEY, [entry, ...logs]);
  return entry;
}

export function listEmailLogs() {
  return loadState<EmailLog[]>(EMAIL_LOGS_KEY, []);
}

function projectSaveCompositeKey(designerId: string, pid: string) {
  return `${designerId}::${pid}`;
}

function loadSavedProjectsMap() {
  return _load<Record<string, boolean>>(SAVED_PROJECTS_KEY, {});
}

function saveSavedProjectsMap(map: Record<string, boolean>) {
  _save(SAVED_PROJECTS_KEY, map);
}

export function isProjectSaved(designerId: string, pid: string) {
  const key = projectSaveCompositeKey(designerId, pid);
  const map = loadSavedProjectsMap();
  return !!map[key];
}

export function toggleProjectSave(designerId: string, pid: string) {
  const key = projectSaveCompositeKey(designerId, pid);
  const map = loadSavedProjectsMap();
  const next = { ...map, [key]: !map[key] };
  saveSavedProjectsMap(next);
  return !!next[key];
}
