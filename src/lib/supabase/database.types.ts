export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "admin" | "supervisor" | "agent" | "closer";
export type PlanTier = "starter" | "growth" | "enterprise";
export type LeadStage =
  "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type OrderStatus =
  | "new"
  | "incomplete"
  | "quoted"
  | "awaiting_payment"
  | "payment_review"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

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
  status: "onboarding" | "active" | "suspended";
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
export type PricingTierRow = {
  id: string;
  organization_id: string;
  name: string;
  min_weight: number;
  max_weight: number;
  indicative_price: number;
  currency: string;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type WorkflowTemplateRow = {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  definition: Json;
  active: boolean;
  created_at: string;
  updated_at: string;
};
export type AutomationDefinitionRow = {
  id: string;
  organization_id: string;
  name: string;
  trigger_type: string;
  definition: Json;
  version: number;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type InvitationRow = {
  id: string;
  organization_id: string;
  email: string;
  role: AppRole;
  token_hash: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};
export type ContactRow = {
  id: string;
  organization_id: string;
  full_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type LeadRow = {
  id: string;
  organization_id: string;
  contact_id: string | null;
  title: string;
  stage: LeadStage;
  value: number;
  source: string | null;
  assigned_to: string | null;
  loss_reason: string | null;
  follow_up_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type OpportunityRow = {
  id: string;
  organization_id: string;
  contact_id: string;
  lead_id: string | null;
  title: string;
  estimated_value: number;
  probability: number;
  status: "open" | "won" | "lost" | "cancelled";
  assigned_to: string | null;
  expected_close_date: string | null;
  loss_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type ActivityRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  activity_type: string;
  title: string;
  details: Json;
  due_at: string | null;
  completed_at: string | null;
  actor_user_id: string;
  created_at: string;
};
export type NoteRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  body: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type ProductRow = {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  category: string;
  description: string | null;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type ProductVariantRow = {
  id: string;
  organization_id: string;
  product_id: string;
  name: string;
  code: string;
  material: "gold" | "silver";
  size: number;
  min_weight: number;
  max_weight: number;
  base_price: number;
  indicative_price: number;
  currency: string;
  available: boolean;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type ProductImageRow = {
  id: string;
  organization_id: string;
  product_id: string;
  variant_id: string | null;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  created_by: string;
  created_at: string;
};
export type ShippingMethodRow = {
  id: string;
  organization_id: string;
  name: string;
  provinces: string[];
  fee: number;
  estimated_time: string | null;
  instructions: string | null;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type PaymentMethodRow = {
  id: string;
  organization_id: string;
  name: string;
  method_type: "cash" | "transfer" | "other";
  bank_name: string | null;
  account_holder: string | null;
  account_type: string | null;
  account_last4: string | null;
  account_ciphertext: string | null;
  currency: string;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type CloserRow = {
  id: string;
  organization_id: string;
  user_id: string;
  active: boolean;
  capacity: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type OrderRow = {
  id: string;
  organization_id: string;
  contact_id: string;
  opportunity_id: string | null;
  shipping_method_id: string | null;
  payment_method_id: string | null;
  closer_id: string | null;
  status: OrderStatus;
  university: string | null;
  province: string | null;
  estimated_weight: number | null;
  indicative_price: number | null;
  final_price: number | null;
  currency: string;
  payment_proof_path: string | null;
  internal_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type OrderItemRow = {
  id: string;
  organization_id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  attributes: Json;
  created_at: string;
};
export type OrderStatusHistoryRow = {
  id: string;
  organization_id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string;
  notes: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      organizations: Table<OrganizationRow>;
      organization_members: Table<OrganizationMemberRow>;
      invitations: Table<InvitationRow>;
      contacts: Table<ContactRow>;
      leads: Table<LeadRow>;
      opportunities: Table<OpportunityRow>;
      activities: Table<ActivityRow>;
      notes: Table<NoteRow>;
      products: Table<ProductRow>;
      product_variants: Table<ProductVariantRow>;
      product_images: Table<ProductImageRow>;
      pricing_tiers: Table<PricingTierRow>;
      workflow_templates: Table<WorkflowTemplateRow>;
      automation_definitions: Table<AutomationDefinitionRow>;
      shipping_methods: Table<ShippingMethodRow>;
      payment_methods: Table<PaymentMethodRow>;
      closers: Table<CloserRow>;
      orders: Table<OrderRow>;
      order_items: Table<OrderItemRow>;
      order_status_history: Table<OrderStatusHistoryRow>;
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { p_name: string; p_slug: string; p_timezone?: string };
        Returns: OrganizationRow;
      };
      ensure_user_workspace: { Args: { p_default_name?: string }; Returns: OrganizationRow };
      create_invitation: {
        Args: { p_organization_id: string; p_email: string; p_role: AppRole };
        Returns: string;
      };
      accept_invitation: { Args: { p_token: string }; Returns: string };
      get_organization_members: {
        Args: { p_organization_id: string };
        Returns: {
          user_id: string;
          full_name: string;
          email: string;
          role: AppRole;
          active: boolean;
        }[];
      };
      set_member_access: {
        Args: { p_organization_id: string; p_user_id: string; p_role: AppRole; p_active: boolean };
        Returns: undefined;
      };
      create_order_with_item: {
        Args: {
          p_organization_id: string;
          p_contact_id: string;
          p_opportunity_id: string | null;
          p_shipping_method_id: string | null;
          p_payment_method_id: string | null;
          p_product_id: string | null;
          p_variant_id: string | null;
          p_quantity: number;
          p_unit_price: number;
          p_attributes: Json;
          p_university: string;
          p_province: string;
          p_estimated_weight: number | null;
          p_indicative_price: number | null;
          p_final_price: number | null;
          p_internal_notes: string;
        };
        Returns: OrderRow;
      };
      claim_order: { Args: { p_order_id: string }; Returns: OrderRow };
      is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      admin_list_organizations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          name: string;
          slug: string;
          status: "onboarding" | "active" | "suspended";
          plan: PlanTier;
          member_count: number;
          contact_count: number;
          lead_count: number;
          order_count: number;
          created_at: string;
        }[];
      };
      admin_create_organization: {
        Args: {
          p_name: string;
          p_slug: string;
          p_timezone?: string;
          p_owner_email?: string | null;
        };
        Returns: Json;
      };
      admin_update_organization: {
        Args: {
          p_organization_id: string;
          p_status: string;
          p_plan: PlanTier;
          p_plan_limits?: Json;
        };
        Returns: OrganizationRow;
      };
      admin_create_doradito_example: {
        Args: Record<PropertyKey, never>;
        Returns: OrganizationRow;
      };
    };
    Enums: {
      app_role: AppRole;
      plan_tier: PlanTier;
      lead_stage: LeadStage;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
