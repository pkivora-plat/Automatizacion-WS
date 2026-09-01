import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserSupabaseConfig } from "./config";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null | undefined;

export function isSupabaseConfigured() {
  return getBrowserSupabaseConfig() !== null;
}

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (browserClient !== undefined) return browserClient;
  const config = getBrowserSupabaseConfig();
  browserClient = config
    ? createBrowserClient<Database>(config.url, config.publishableKey, {
        cookieOptions: { sameSite: "lax" },
      })
    : null;
  return browserClient;
}
