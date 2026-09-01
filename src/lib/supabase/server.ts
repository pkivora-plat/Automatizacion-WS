import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie, setResponseHeader } from "@tanstack/react-start/server";
import { getServerSupabaseConfig } from "./config";
import type { Database } from "./database.types";

export function getSupabaseServerClient() {
  const config = getServerSupabaseConfig();
  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies, headers) {
        for (const { name, value, options } of cookies) setCookie(name, value, options);
        for (const [name, value] of Object.entries(headers)) setResponseHeader(name, value);
      },
    },
  });
}
