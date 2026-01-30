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
  [key: string]: any;
};

export type IntendedActionType = "like" | "save" | "follow" | "comment" | "offer";

export type IntendedAction = {
  type: IntendedActionType;
  targetId?: string;
  payload?: any;
  returnTo?: string;
  createdAt: number;
};

type AppState = {
  likes: Record<string, boolean>;
  follows: Record<string, boolean>;
};

type StoredUser = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
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
const USERS_KEY = "evlumba_users_v1";
const COLLECTIONS_KEY = "evlumba_collections_v1";
const EMAIL_LOGS_KEY = "evlumba_email_logs_v1";

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
export function loadState<T>(key?: string, fallback?: T): any {
  if (!key) return _load<AppState>(APP_STATE_KEY, defaultAppState());
  return _load<T>(key, fallback as T);
}

/**
 * ✅ Backward compatible
 * saveState(appState) OR saveState(key, value)
 */
export function saveState(value: AppState): void;
export function saveState<T>(key: string, value: T): void;
export function saveState<T>(keyOrValue: any, valueMaybe?: any) {
  if (typeof keyOrValue === "string") _save(keyOrValue, valueMaybe);
  else _save(APP_STATE_KEY, keyOrValue as AppState);
}

export function removeState(key: string) {
  _remove(key);
}

export const clearState = removeState;
export const loadJSON = loadState as any;
export const saveJSON = saveState as any;

/** Session helpers */
export function getSession(): Session | null {
  return _load<Session | null>(SESSION_KEY, null);
}

export function setSession(session: Session) {
  _save(SESSION_KEY, session);
}

export function logout() {
  _remove(SESSION_KEY);
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
}): Promise<{ ok: boolean; error?: string }> {
  const email = (input.email || "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Email gerekli" };

  const users = _load<StoredUser[]>(USERS_KEY, []);
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "Bu email zaten kayıtlı" };
  }

  users.unshift({
    id: uid("user"),
    name: input.name || "Kullanıcı",
    email,
    password: input.password || "",
    role: input.role,
  });
  _save(USERS_KEY, users);
  return { ok: true };
}

export async function loginUser(
  emailOrInput: string | { email: string; password?: string },
  passwordMaybe?: string
): Promise<{ ok: boolean; session?: Session; error?: string }> {
  const email =
    typeof emailOrInput === "string"
      ? emailOrInput.trim().toLowerCase()
      : (emailOrInput.email || "").trim().toLowerCase();

  const password = typeof emailOrInput === "string" ? passwordMaybe || "" : emailOrInput.password || "";

  if (!email) return { ok: false, error: "Email gerekli" };

  const users = _load<StoredUser[]>(USERS_KEY, []);
  const u = users.find((x) => x.email.toLowerCase() === email);

  const role: SessionRole = u?.role || "homeowner";

  if (u && u.password && password && u.password !== password) {
    return { ok: false, error: "Şifre hatalı" };
  }

  const session: Session = {
    id: u?.id || uid("user"),
    name: u?.name || "Kullanıcı",
    email,
    role,
    approvedDesigner: role === "designer",
  };

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
export function addEmailLog(arg1: any, arg2?: any) {
  const logs = loadState<EmailLog[]>(EMAIL_LOGS_KEY, []);

  const entry: EmailLog =
    typeof arg1 === "string"
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
