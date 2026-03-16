"use client";

import { createBrowserClient } from "@supabase/ssr";
import { processLock, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabasePublicEnv();
  browserClient = createBrowserClient(url, anonKey, {
    auth: {
      // Avoid Web Locks API "steal" recovery path that can throw
      // "lock broken by another request..." in some browsers/dev flows.
      lock: processLock,
    },
  });
  return browserClient;
}
