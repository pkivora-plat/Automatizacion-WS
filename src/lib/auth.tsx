import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./supabase/client";
import { AppError, toAppError } from "./supabase/errors";
export type SessionUser = { id: string; name: string; email: string };
type Value = {
  user: SessionUser | null;
  ready: boolean;
  configured: boolean;
  platformAdmin: boolean;
  signIn: (e: string, p: string) => Promise<void>;
  signUp: (n: string, o: string, e: string, p: string) => Promise<boolean>;
  requestPasswordReset: (e: string) => Promise<void>;
  updatePassword: (p: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<Value | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const configured = isSupabaseConfigured();
  useEffect(() => {
    const c = getSupabaseBrowserClient();
    if (!c) {
      setReady(true);
      return;
    }
    const sync = async () => {
      const { data } = await c.auth.getUser();
      const u = data.user;
      if (!u) {
        setUser(null);
        setPlatformAdmin(false);
        setReady(true);
        return;
      }
      const { data: p } = await c.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
      setUser({
        id: u.id,
        email: u.email ?? "",
        name: p?.full_name ?? u.user_metadata["full_name"] ?? u.email?.split("@")[0] ?? "Usuario",
      });
      const adminResult = await c.rpc("is_platform_admin");
      setPlatformAdmin(adminResult.error ? false : Boolean(adminResult.data));
      setReady(true);
    };
    void sync();
    const { data } = c.auth.onAuthStateChange(() => window.setTimeout(() => void sync(), 0));
    return () => data.subscription.unsubscribe();
  }, []);
  const client = () => {
    const c = getSupabaseBrowserClient();
    if (!c) throw new AppError("Supabase no está configurado.", "not_configured");
    return c;
  };
  const value = useMemo<Value>(
    () => ({
      user,
      ready,
      configured,
      platformAdmin,
      async signIn(email, password) {
        const { error } = await client().auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw toAppError(error, "No fue posible iniciar sesión.");
      },
      async signUp(name, organization, email, password) {
        const { data, error } = await client().auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: { full_name: name.trim(), organization_name: organization.trim() },
          },
        });
        if (error) throw toAppError(error, "No fue posible crear la cuenta.");
        return data.session === null;
      },
      async requestPasswordReset(email) {
        const { error } = await client().auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login?mode=update-password`,
        });
        if (error) throw toAppError(error, "No fue posible enviar el correo.");
      },
      async updatePassword(password) {
        const { error } = await client().auth.updateUser({ password });
        if (error) throw toAppError(error, "No fue posible cambiar la contraseña.");
      },
      async acceptInvitation(token) {
        const { error } = await client().rpc("accept_invitation", { p_token: token });
        if (error) throw toAppError(error, "No fue posible aceptar la invitación.");
      },
      async signOut() {
        await client().auth.signOut();
        setUser(null);
        setPlatformAdmin(false);
        window.location.assign("/login");
      },
    }),
    [user, ready, configured, platformAdmin],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const v = useContext(Context);
  if (!v) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return v;
}
