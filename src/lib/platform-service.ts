import { getSupabaseBrowserClient } from "./supabase/client";
import { toAppError } from "./supabase/errors";
import type { Json, OrganizationRow, PlanTier } from "./supabase/database.types";

export type PlatformOrganization = {
  id: string;
  name: string;
  slug: string;
  status: "onboarding" | "active" | "suspended";
  plan: PlanTier;
  memberCount: number;
  contactCount: number;
  leadCount: number;
  orderCount: number;
  createdAt: string;
};

function client() {
  const value = getSupabaseBrowserClient();
  if (!value) throw new Error("Supabase no está configurado.");
  return value;
}

export async function listPlatformOrganizations(): Promise<PlatformOrganization[]> {
  const result = await client().rpc("admin_list_organizations");
  if (result.error)
    throw toAppError(result.error, "No fue posible cargar las empresas de la plataforma.");
  return result.data.map((organization) => ({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    status: organization.status,
    plan: organization.plan,
    memberCount: Number(organization.member_count),
    contactCount: Number(organization.contact_count),
    leadCount: Number(organization.lead_count),
    orderCount: Number(organization.order_count),
    createdAt: organization.created_at,
  }));
}

export async function createPlatformOrganization(values: {
  name: string;
  slug: string;
  timezone: string;
  ownerEmail?: string | undefined;
}) {
  const result = await client().rpc("admin_create_organization", {
    p_name: values.name.trim(),
    p_slug: values.slug.trim().toLowerCase(),
    p_timezone: values.timezone,
    p_owner_email: values.ownerEmail?.trim() || null,
  });
  if (result.error) throw toAppError(result.error, "No fue posible crear la empresa.");
  if (!result.data || typeof result.data !== "object" || Array.isArray(result.data))
    throw new Error("Supabase devolvió una respuesta inválida.");
  const organization = result.data["organization"];
  const token = result.data["invitation_token"];
  if (!organization || typeof organization !== "object" || Array.isArray(organization))
    throw new Error("No se recibió la organización creada.");
  return {
    organization: organization as unknown as OrganizationRow,
    invitationToken: typeof token === "string" ? token : null,
  };
}

export async function createDoraditoExample() {
  const result = await client().rpc("admin_create_doradito_example");
  if (result.error) throw toAppError(result.error, "No fue posible crear DORADITO.");
  return result.data;
}

export async function updatePlatformOrganization(
  id: string,
  values: { status: PlatformOrganization["status"]; plan: PlanTier; limits?: Json },
) {
  const result = await client().rpc("admin_update_organization", {
    p_organization_id: id,
    p_status: values.status,
    p_plan: values.plan,
    p_plan_limits: values.limits ?? null,
  });
  if (result.error) throw toAppError(result.error, "No fue posible actualizar la empresa.");
  return result.data;
}
