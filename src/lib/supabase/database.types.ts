export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "admin" | "supervisor" | "agent" | "closer";
export type PlanTier = "starter" | "growth" | "enterprise";

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  business_data: Json;
  plan: PlanTier;
  plan_limits: Json;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type OrganizationMemberRow = {
  organization_id: string;
  user_id: string;
  role: AppRole;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<
        ProfileRow,
        {
          id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<ProfileRow, "id" | "created_at">>
      >;
      organizations: TableDefinition<
        OrganizationRow,
        {
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          business_data?: Json;
          plan?: PlanTier;
          plan_limits?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        },
        Partial<Omit<OrganizationRow, "id" | "created_by" | "created_at">>
      >;
      organization_members: TableDefinition<
        OrganizationMemberRow,
        {
          organization_id: string;
          user_id: string;
          role?: AppRole;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<OrganizationMemberRow, "organization_id" | "user_id" | "created_at">>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { p_name: string; p_slug: string; p_timezone?: string };
        Returns: OrganizationRow;
      };
    };
    Enums: {
      app_role: AppRole;
      plan_tier: PlanTier;
    };
    CompositeTypes: Record<string, never>;
  };
};
