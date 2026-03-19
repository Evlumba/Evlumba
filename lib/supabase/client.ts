"use client";

import { createBrowserClient } from "@supabase/ssr";
import { processLock, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabasePublicEnv();
  // processLock disables the Web Locks API (which causes "steal" AbortErrors
  // when multiple initializations race in Next.js). processLock is a no-op
  // passthrough — no actual lock, no deadlock risk.
  browserClient = createBrowserClient(url, anonKey, {
    auth: { lock: processLock },
  });
  return browserClient;
}
