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
import type { AppRole, Json, PlanTier } from "./supabase/database.types";

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  agent: "Agente",
  closer: "Closer",
};
const planLabels: Record<PlanTier, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  businessData: Json;
  plan: string;
  planCode: PlanTier;
  status: "onboarding" | "active" | "suspended";
  role: string;
  roleCode: AppRole;
};
export type OrganizationMember = {
  userId: string;
  fullName: string;
  email: string;
  role: AppRole;
  active: boolean;
};

const empty: Organization = {
  id: "",
  name: "",
  slug: "",
  timezone: "America/Santo_Domingo",
  businessData: {},
  plan: "Starter",
  planCode: "starter",
  status: "active",
  role: "Agente",
  roleCode: "agent",
};
type Value = {
  organizations: Organization[];
  current: Organization;
  ready: boolean;
  switchOrganization: (id: string) => void;
  refresh: () => Promise<void>;
  createOrganization: (name: string, timezone?: string) => Promise<Organization>;
  updateOrganization: (values: {
    name: string;
    slug: string;
    timezone: string;
    businessData?: Json;
  }) => Promise<void>;
  listMembers: () => Promise<OrganizationMember[]>;
  inviteMember: (email: string, role: AppRole) => Promise<string>;
  setMemberAccess: (userId: string, role: AppRole, active: boolean) => Promise<void>;
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
      setCurrentId("");
      setReady(true);
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) {
      setReady(true);
      return;
    }
    setReady(false);
    let memberships = await client
      .from("organization_members")
      .select("organization_id,role")
      .eq("user_id", user.id)
      .eq("active", true);
    if (memberships.error)
      throw toAppError(memberships.error, "No fue posible cargar tus empresas.");
    if (memberships.data.length === 0) {
      const provision = await client.rpc("ensure_user_workspace", { p_default_name: "Mi empresa" });
      if (provision.error)
        throw toAppError(provision.error, "Falta aplicar la migración de aprovisionamiento.");
      memberships = await client
        .from("organization_members")
        .select("organization_id,role")
        .eq("user_id", user.id)
        .eq("active", true);
      if (memberships.error)
        throw toAppError(memberships.error, "No fue posible cargar tu empresa inicial.");
    }
    const ids = memberships.data.map((member) => member.organization_id);
    const result = await client
      .from("organizations")
      .select("id,name,slug,timezone,business_data,plan,status")
      .in("id", ids)
      .is("deleted_at", null);
    if (result.error) throw toAppError(result.error, "No fue posible cargar las empresas.");
    const next = result.data.map((organization) => {
      const membership = memberships.data.find((item) => item.organization_id === organization.id)!;
      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        timezone: organization.timezone,
        businessData: organization.business_data,
        plan: planLabels[organization.plan],
        planCode: organization.plan,
        status: organization.status,
        role: roleLabels[membership.role],
        roleCode: membership.role,
      };
    });
    setOrganizations(next);
    const saved = localStorage.getItem(KEY);
    setCurrentId(next.some((item) => item.id === saved) ? saved! : (next[0]?.id ?? ""));
    setReady(true);
  }, [user]);

  useEffect(() => {
    if (authReady)
      void load().catch((error) => {
        console.error(error);
        setReady(true);
      });
  }, [authReady, load]);
  const current =
    organizations.find((organization) => organization.id === currentId) ??
    organizations[0] ??
    empty;

  const value = useMemo<Value>(
    () => ({
      organizations,
      current,
      ready,
      refresh: load,
      switchOrganization(id) {
        if (!organizations.some((organization) => organization.id === id)) return;
        setCurrentId(id);
        localStorage.setItem(KEY, id);
      },
      async createOrganization(name, timezone = "America/Santo_Domingo") {
        const client = getSupabaseBrowserClient();
        if (!client) throw new Error("Supabase no está configurado.");
        const base = name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const { data, error } = await client.rpc("create_organization", {
          p_name: name.trim(),
          p_slug: `${base}-${crypto.randomUUID().slice(0, 8)}`,
          p_timezone: timezone,
        });
        if (error) throw toAppError(error, "No fue posible crear la empresa.");
        await load();
        localStorage.setItem(KEY, data.id);
        setCurrentId(data.id);
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          timezone: data.timezone,
          businessData: data.business_data,
          plan: planLabels[data.plan],
          planCode: data.plan,
          status: data.status,
          role: "Administrador",
          roleCode: "admin",
        };
      },
      async updateOrganization(values) {
        const client = getSupabaseBrowserClient();
        if (!client || !current.id) throw new Error("No hay empresa activa.");
        const { error } = await client
          .from("organizations")
          .update({
            name: values.name.trim(),
            slug: values.slug.trim().toLowerCase(),
            timezone: values.timezone,
            ...(values.businessData ? { business_data: values.businessData } : {}),
          })
          .eq("id", current.id);
        if (error) throw toAppError(error, "No fue posible actualizar la empresa.");
        await load();
      },
      async listMembers() {
        const client = getSupabaseBrowserClient();
        if (!client || !current.id) return [];
        const { data, error } = await client.rpc("get_organization_members", {
          p_organization_id: current.id,
        });
        if (error) throw toAppError(error, "No fue posible cargar el equipo.");
        return data.map((member) => ({
          userId: member.user_id,
          fullName: member.full_name,
          email: member.email,
          role: member.role,
          active: member.active,
        }));
      },
      async inviteMember(email, role) {
        const client = getSupabaseBrowserClient();
        if (!client || !current.id) throw new Error("No hay empresa activa.");
        const { data, error } = await client.rpc("create_invitation", {
          p_organization_id: current.id,
          p_email: email.trim(),
          p_role: role,
        });
        if (error) throw toAppError(error, "No fue posible crear la invitación.");
        return `${window.location.origin}/login?invite=${data}`;
      },
      async setMemberAccess(userId, role, active) {
        const client = getSupabaseBrowserClient();
        if (!client || !current.id) throw new Error("No hay empresa activa.");
        const { error } = await client.rpc("set_member_access", {
          p_organization_id: current.id,
          p_user_id: userId,
          p_role: role,
          p_active: active,
        });
        if (error) throw toAppError(error, "No fue posible actualizar el miembro.");
      },
    }),
    [organizations, current, ready, load],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useOrganization() {
  const value = useContext(Context);
  if (!value) throw new Error("useOrganization debe utilizarse dentro de OrganizationProvider");
  return value;
}
