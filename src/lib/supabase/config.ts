type SupabasePublicConfig = { url: string; publishableKey: string };

export function getBrowserSupabaseConfig(): SupabasePublicConfig | null {
  const url = import.meta.env["VITE_SUPABASE_URL"]?.trim();
  const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim();
  return url && publishableKey ? { url, publishableKey } : null;
}

export function getServerSupabaseConfig(): SupabasePublicConfig {
  const url = process.env["VITE_SUPABASE_URL"]?.trim();
  const publishableKey = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim();
  if (!url || !publishableKey) {
    throw new Error("Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en el servidor.");
  }
  return { url, publishableKey };
}
