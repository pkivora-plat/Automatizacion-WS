import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth";
import { getSupabaseBrowserClient } from "./supabase/client";
import { toAppError } from "./supabase/errors";
import type { AppRole, PlanTier } from "./supabase/database.types";
const roles = {
  admin: "Administrador",
  supervisor: "Supervisor",
  agent: "Agente",
  closer: "Closer",
} as const;
const plans = { starter: "Starter", growth: "Growth", enterprise: "Enterprise" } as const;
export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: (typeof plans)[PlanTier];
  role: (typeof roles)[AppRole];
};
const empty: Organization = { id: "", name: "", slug: "", plan: "Starter", role: "Agente" };
type Value = {
  organizations: Organization[];
  current: Organization;
  ready: boolean;
  switchOrganization: (id: string) => void;
  createOrganization: (name: string) => Promise<Organization>;
};
const Context = createContext<Value | null>(null);
const KEY = "zolmyra.current-organization";
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [ready, setReady] = useState(false);
  const load = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setReady(true);
      return;
    }
    const c = getSupabaseBrowserClient();
    if (!c) {
      setReady(true);
      return;
    }
    const { data: m, error } = await c
      .from("organization_members")
      .select("organization_id,role")
      .eq("user_id", user.id)
      .eq("active", true);
    if (error) {
      console.error(error);
      setReady(true);
      return;
    }
    const ids = m.map((x) => x.organization_id);
    const result = ids.length
      ? await c
          .from("organizations")
          .select("id,name,slug,plan")
          .in("id", ids)
          .is("deleted_at", null)
      : { data: [], error: null };
    if (result.error) {
      console.error(result.error);
      setReady(true);
      return;
    }
    const next = result.data.map((o) => {
      const member = m.find((x) => x.organization_id === o.id)!;
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        plan: plans[o.plan],
        role: roles[member.role],
      };
    });
    setOrganizations(next);
    const saved = localStorage.getItem(KEY);
    setCurrentId(next.some((o) => o.id === saved) ? saved! : (next[0]?.id ?? ""));
    setReady(true);
  }, [user]);
  useEffect(() => {
    if (authReady) void load();
  }, [authReady, load]);
  const current = organizations.find((o) => o.id === currentId) ?? organizations[0] ?? empty;
  const value = useMemo<Value>(
    () => ({
      organizations,
      current,
      ready,
      switchOrganization(id) {
        if (organizations.some((o) => o.id === id)) {
          setCurrentId(id);
          localStorage.setItem(KEY, id);
        }
      },
      async createOrganization(name) {
        const c = getSupabaseBrowserClient();
        if (!c) throw new Error("Supabase no está configurado.");
        const base = name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const { data, error } = await c.rpc("create_organization", {
          p_name: name.trim(),
          p_slug: `${base}-${crypto.randomUUID().slice(0, 8)}`,
        });
        if (error) throw toAppError(error, "No fue posible crear la empresa.");
        await load();
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          plan: plans[data.plan],
          role: "Administrador",
        };
      },
    }),
    [organizations, current, ready, load],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useOrganization() {
  const v = useContext(Context);
  if (!v) throw new Error("useOrganization debe utilizarse dentro de OrganizationProvider");
  return v;
}
