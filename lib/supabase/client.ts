"use client";

import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env";

let browserClient: SupabaseClient | null = null;

async function passthroughLock<T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> {
  return await fn();
}

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabasePublicEnv();
  browserClient = createBrowserClient(url, anonKey, {
    // Disable Web Locks and process-level lock queue to avoid deadlocks that
    // can freeze auth calls (getSession/getUser) in some browser states.
    auth: { lock: passthroughLock },
  });
  return browserClient;
}
