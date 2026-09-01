import { getSupabaseBrowserClient } from "./supabase/client";
import { toAppError } from "./supabase/errors";
import type {
  AppRole,
  AutomationDefinitionRow,
  ContactRow,
  LeadRow,
  LeadStage,
  NoteRow,
  OpportunityRow,
  OrderRow,
  OrderStatus,
  PaymentMethodRow,
  PricingTierRow,
  ProductImageRow,
  ProductRow,
  ProductVariantRow,
  ShippingMethodRow,
  WorkflowTemplateRow,
  CloserRow,
} from "./supabase/database.types";

function client() {
  const value = getSupabaseBrowserClient();
  if (!value) throw new Error("Supabase no está configurado.");
  return value;
}
function clean(value?: string | null) {
  const result = value?.trim();
  return result ? result : null;
}

export async function listContacts(organizationId: string) {
  const result = await client()
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (result.error) throw toAppError(result.error, "No fue posible cargar los contactos.");
  return result.data;
}
export async function saveContact(
  organizationId: string,
  userId: string,
  values: {
    id?: string | undefined;
    fullName: string;
    company?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    status: string;
    source?: string | undefined;
  },
) {
  const payload: Partial<ContactRow> = {
    organization_id: organizationId,
    full_name: values.fullName.trim(),
    company: clean(values.company),
    email: clean(values.email)?.toLowerCase() ?? null,
    phone: clean(values.phone),
    status: values.status,
    source: clean(values.source),
    ...(values.id ? {} : { created_by: userId }),
  };
  const query = values.id
    ? client()
        .from("contacts")
        .update(payload)
        .eq("id", values.id)
        .eq("organization_id", organizationId)
    : client().from("contacts").insert(payload);
  const result = await query.select().single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar el contacto.");
  return result.data;
}
export async function archiveContact(organizationId: string, id: string) {
  const result = await client()
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (result.error) throw toAppError(result.error, "No fue posible archivar el contacto.");
}
export async function listNotes(organizationId: string, entityType: string, entityId: string) {
  const result = await client()
    .from("notes")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (result.error) throw toAppError(result.error, "No fue posible cargar las notas.");
  return result.data;
}
export async function addNote(
  organizationId: string,
  userId: string,
  entityType: string,
  entityId: string,
  body: string,
) {
  const payload: Partial<NoteRow> = {
    organization_id: organizationId,
    entity_type: entityType,
    entity_id: entityId,
    body: body.trim(),
    created_by: userId,
  };
  const result = await client().from("notes").insert(payload).select().single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar la nota.");
  return result.data;
}

export async function listLeads(organizationId: string) {
  const result = await client()
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (result.error) throw toAppError(result.error, "No fue posible cargar los leads.");
  return result.data;
}
export async function saveLead(
  organizationId: string,
  userId: string,
  values: {
    id?: string | undefined;
    contactId?: string | undefined;
    title: string;
    stage: LeadStage;
    value: number;
    source?: string | undefined;
    followUpAt?: string | undefined;
    lossReason?: string | undefined;
  },
) {
  const payload: Partial<LeadRow> = {
    organization_id: organizationId,
    contact_id: clean(values.contactId),
    title: values.title.trim(),
    stage: values.stage,
    value: values.value,
    source: clean(values.source),
    follow_up_at: clean(values.followUpAt),
    loss_reason: clean(values.lossReason),
    ...(values.id ? {} : { assigned_to: userId, created_by: userId }),
  };
  const query = values.id
    ? client()
        .from("leads")
        .update(payload)
        .eq("id", values.id)
        .eq("organization_id", organizationId)
    : client().from("leads").insert(payload);
  const result = await query.select().single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar el lead.");
  return result.data;
}
export async function moveLead(
  organizationId: string,
  userId: string,
  lead: LeadRow,
  stage: LeadStage,
  lossReason?: string,
) {
  const result = await client()
    .from("leads")
    .update({ stage, loss_reason: stage === "lost" ? clean(lossReason) : null })
    .eq("id", lead.id)
    .eq("organization_id", organizationId)
    .select()
    .single();
  if (result.error) throw toAppError(result.error, "No fue posible mover el lead.");
  await client()
    .from("activities")
    .insert({
      organization_id: organizationId,
      entity_type: "lead",
      entity_id: lead.id,
      activity_type: "stage_changed",
      title: `Etapa: ${lead.stage} → ${stage}`,
      details: { previous_stage: lead.stage, new_stage: stage },
      actor_user_id: userId,
    });
  return result.data;
}

export async function listOpportunities(organizationId: string) {
  const result = await client()
    .from("opportunities")
    .select("*")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (result.error) throw toAppError(result.error, "No fue posible cargar las oportunidades.");
  return result.data;
}
export async function saveOpportunity(
  organizationId: string,
  userId: string,
  values: {
    id?: string | undefined;
    contactId: string;
    leadId?: string | undefined;
    title: string;
    estimatedValue: number;
    probability: number;
    status: OpportunityRow["status"];
    expectedCloseDate?: string | undefined;
  },
) {
  const payload: Partial<OpportunityRow> = {
    organization_id: organizationId,
    contact_id: values.contactId,
    lead_id: clean(values.leadId),
    title: values.title.trim(),
    estimated_value: values.estimatedValue,
    probability: values.probability,
    status: values.status,
    expected_close_date: clean(values.expectedCloseDate),
    ...(values.id ? {} : { assigned_to: userId, created_by: userId }),
  };
  const query = values.id
    ? client()
        .from("opportunities")
        .update(payload)
        .eq("id", values.id)
        .eq("organization_id", organizationId)
    : client().from("opportunities").insert(payload);
  const result = await query.select().single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar la oportunidad.");
  return result.data;
}

export async function listProducts(organizationId: string) {
  const [products, variants, images] = await Promise.all([
    client()
      .from("products")
      .select("*")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    client()
      .from("product_variants")
      .select("*")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("created_at"),
    client()
      .from("product_images")
      .select("*")
      .eq("organization_id", organizationId)
      .order("sort_order"),
  ]);
  if (products.error || variants.error || images.error)
    throw toAppError(
      products.error ?? variants.error ?? images.error!,
      "No fue posible cargar el catálogo.",
    );
  return { products: products.data, variants: variants.data, images: images.data };
}
export async function listPricingTiers(organizationId: string) {
  const result = await client()
    .from("pricing_tiers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("active", true)
    .order("min_weight");
  if (result.error)
    throw toAppError(result.error, "No fue posible cargar los precios configurados.");
  return result.data;
}
export async function listAutomationDefinitions(organizationId: string) {
  const [definitions, templates] = await Promise.all([
    client()
      .from("automation_definitions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    client().from("workflow_templates").select("*").eq("active", true).order("name"),
  ]);
  if (definitions.error || templates.error)
    throw toAppError(
      definitions.error ?? templates.error!,
      "No fue posible cargar las automatizaciones.",
    );
  return { definitions: definitions.data, templates: templates.data };
}
export async function setAutomationActive(organizationId: string, id: string, active: boolean) {
  const result = await client()
    .from("automation_definitions")
    .update({ active })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();
  if (result.error) throw toAppError(result.error, "No fue posible actualizar la automatización.");
  return result.data;
}
export async function savePricingTier(
  organizationId: string,
  userId: string,
  values: {
    id?: string | undefined;
    name: string;
    minWeight: number;
    maxWeight: number;
    indicativePrice: number;
  },
) {
  const payload: Partial<PricingTierRow> = {
    organization_id: organizationId,
    name: values.name.trim(),
    min_weight: values.minWeight,
    max_weight: values.maxWeight,
    indicative_price: values.indicativePrice,
    currency: "DOP",
    active: true,
    ...(values.id ? {} : { created_by: userId }),
  };
  const query = values.id
    ? client()
        .from("pricing_tiers")
        .update(payload)
        .eq("id", values.id)
        .eq("organization_id", organizationId)
    : client().from("pricing_tiers").insert(payload);
  const result = await query.select().single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar el rango de precio.");
  return result.data;
}
export async function saveProduct(
  organizationId: string,
  userId: string,
  values: {
    id?: string | undefined;
    name: string;
    code: string;
    category: string;
    description?: string | undefined;
    active: boolean;
  },
) {
  const payload: Partial<ProductRow> = {
    organization_id: organizationId,
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    category: values.category,
    description: clean(values.description),
    active: values.active,
    ...(values.id ? {} : { created_by: userId }),
  };
  const query = values.id
    ? client()
        .from("products")
        .update(payload)
        .eq("id", values.id)
        .eq("organization_id", organizationId)
    : client().from("products").insert(payload);
  const result = await query.select().single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar el producto.");
  return result.data;
}
export async function saveVariant(
  organizationId: string,
  userId: string,
  values: {
    productId: string;
    name: string;
    code: string;
    material: "gold" | "silver";
    size: number;
    minWeight: number;
    maxWeight: number;
    basePrice: number;
    indicativePrice: number;
  },
) {
  const payload: Partial<ProductVariantRow> = {
    organization_id: organizationId,
    product_id: values.productId,
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    material: values.material,
    size: values.size,
    min_weight: values.minWeight,
    max_weight: values.maxWeight,
    base_price: values.basePrice,
    indicative_price: values.indicativePrice,
    currency: "DOP",
    available: true,
    active: true,
    created_by: userId,
  };
  const result = await client().from("product_variants").insert(payload).select().single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar la variante.");
  return result.data;
}
export async function uploadProductImages(
  organizationId: string,
  userId: string,
  productId: string,
  files: File[],
) {
  const uploaded: ProductImageRow[] = [];
  for (const [index, file] of files.entries()) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 10 * 1024 * 1024)
      throw new Error("Cada imagen debe ser JPG, PNG o WEBP y pesar menos de 10 MB.");
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${organizationId}/products/${productId}/${crypto.randomUUID()}.${extension}`;
    const storage = await client()
      .storage.from("product-images")
      .upload(path, file, { upsert: false });
    if (storage.error) throw toAppError(storage.error, "No fue posible subir una imagen.");
    const record = await client()
      .from("product_images")
      .insert({
        organization_id: organizationId,
        product_id: productId,
        storage_path: path,
        sort_order: index,
        created_by: userId,
      })
      .select()
      .single();
    if (record.error) {
      await client().storage.from("product-images").remove([path]);
      throw toAppError(record.error, "No fue posible registrar la imagen.");
    }
    uploaded.push(record.data);
  }
  return uploaded;
}
export async function getProductImageUrl(path: string) {
  const result = await client().storage.from("product-images").createSignedUrl(path, 3600);
  if (result.error) return null;
  return result.data.signedUrl;
}
export async function deleteProductImage(image: ProductImageRow) {
  const storage = await client().storage.from("product-images").remove([image.storage_path]);
  if (storage.error) throw toAppError(storage.error, "No fue posible eliminar la imagen.");
  const record = await client()
    .from("product_images")
    .delete()
    .eq("id", image.id)
    .eq("organization_id", image.organization_id);
  if (record.error)
    throw toAppError(record.error, "No fue posible eliminar el registro de imagen.");
}

export async function listCommerceSettings(organizationId: string) {
  const [shipping, payment] = await Promise.all([
    client()
      .from("shipping_methods")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name"),
    client()
      .from("payment_methods")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name"),
  ]);
  if (shipping.error || payment.error)
    throw toAppError(shipping.error ?? payment.error!, "No fue posible cargar envíos y pagos.");
  return { shipping: shipping.data, payment: payment.data };
}
export async function saveShippingMethod(
  organizationId: string,
  userId: string,
  values: {
    name: string;
    provinces: string;
    fee: number;
    estimatedTime?: string;
    instructions?: string;
  },
) {
  const payload: Partial<ShippingMethodRow> = {
    organization_id: organizationId,
    name: values.name.trim(),
    provinces: values.provinces
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    fee: values.fee,
    estimated_time: clean(values.estimatedTime),
    instructions: clean(values.instructions),
    active: true,
    created_by: userId,
  };
  const result = await client().from("shipping_methods").insert(payload).select().single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar el transporte.");
  return result.data;
}
export async function savePaymentMethod(
  organizationId: string,
  userId: string,
  values: {
    name: string;
    methodType: PaymentMethodRow["method_type"];
    bankName?: string;
    accountHolder?: string;
    accountType?: string;
    accountLast4?: string;
  },
) {
  const payload: Partial<PaymentMethodRow> = {
    organization_id: organizationId,
    name: values.name.trim(),
    method_type: values.methodType,
    bank_name: clean(values.bankName),
    account_holder: clean(values.accountHolder),
    account_type: clean(values.accountType),
    account_last4: clean(values.accountLast4),
    account_ciphertext: null,
    currency: "DOP",
    active: true,
    created_by: userId,
  };
  const result = await client().from("payment_methods").insert(payload).select().single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar el método de pago.");
  return result.data;
}

export async function listOrders(organizationId: string) {
  const result = await client()
    .from("orders")
    .select("*")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (result.error) throw toAppError(result.error, "No fue posible cargar los pedidos.");
  return result.data;
}
export async function saveOrder(
  organizationId: string,
  _userId: string,
  values: {
    contactId: string;
    opportunityId?: string | undefined;
    shippingMethodId?: string | undefined;
    paymentMethodId?: string | undefined;
    productId?: string | undefined;
    variantId?: string | undefined;
    quantity?: number | undefined;
    unitPrice?: number | undefined;
    attributes?: Record<string, string | number> | undefined;
    university?: string | undefined;
    province?: string | undefined;
    estimatedWeight?: number | undefined;
    indicativePrice?: number | undefined;
    finalPrice?: number | undefined;
    notes?: string | undefined;
  },
) {
  const result = await client().rpc("create_order_with_item", {
    p_organization_id: organizationId,
    p_contact_id: values.contactId,
    p_opportunity_id: clean(values.opportunityId),
    p_shipping_method_id: clean(values.shippingMethodId),
    p_payment_method_id: clean(values.paymentMethodId),
    p_product_id: clean(values.productId),
    p_variant_id: clean(values.variantId),
    p_quantity: values.quantity ?? 1,
    p_unit_price: values.unitPrice ?? 0,
    p_attributes: values.attributes ?? {},
    p_university: values.university ?? "",
    p_province: values.province ?? "",
    p_estimated_weight: values.estimatedWeight ?? null,
    p_indicative_price: values.indicativePrice ?? null,
    p_final_price: values.finalPrice ?? null,
    p_internal_notes: values.notes ?? "",
  });
  if (result.error) throw toAppError(result.error, "No fue posible crear el pedido.");
  return result.data;
}
export async function updateOrderStatus(
  organizationId: string,
  orderId: string,
  status: OrderStatus,
) {
  const result = await client()
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("organization_id", organizationId)
    .select()
    .single();
  if (result.error) throw toAppError(result.error, "No fue posible actualizar el pedido.");
  return result.data;
}
export async function uploadPaymentProof(organizationId: string, orderId: string, file: File) {
  if (
    !file.type.match(/^(image\/(jpeg|png|webp)|application\/pdf)$/) ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("El comprobante debe ser imagen o PDF y pesar menos de 10 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${organizationId}/orders/${orderId}/${crypto.randomUUID()}.${extension}`;
  const storage = await client().storage.from("payment-proofs").upload(path, file);
  if (storage.error) throw toAppError(storage.error, "No fue posible subir el comprobante.");
  const record = await client()
    .from("orders")
    .update({ payment_proof_path: path, status: "payment_review" })
    .eq("id", orderId)
    .eq("organization_id", organizationId);
  if (record.error) throw toAppError(record.error, "No fue posible asociar el comprobante.");
  return path;
}
export async function listClosers(organizationId: string) {
  const result = await client()
    .from("closers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("active", true)
    .order("created_at");
  if (result.error) throw toAppError(result.error, "No fue posible cargar los closers.");
  return result.data;
}
export async function claimOrder(orderId: string) {
  const result = await client().rpc("claim_order", { p_order_id: orderId });
  if (result.error) throw toAppError(result.error, "Otro closer pudo tomar este cliente primero.");
  return result.data;
}
export async function assignOrderCloser(
  organizationId: string,
  orderId: string,
  closerId: string | null,
) {
  const result = await client()
    .from("orders")
    .update({ closer_id: closerId })
    .eq("id", orderId)
    .eq("organization_id", organizationId)
    .select()
    .single();
  if (result.error) throw toAppError(result.error, "No fue posible reasignar el pedido.");
  return result.data;
}
export async function updateOrderNotes(organizationId: string, orderId: string, notes: string) {
  const result = await client()
    .from("orders")
    .update({ internal_notes: clean(notes) })
    .eq("id", orderId)
    .eq("organization_id", organizationId)
    .select()
    .single();
  if (result.error) throw toAppError(result.error, "No fue posible guardar las notas.");
  return result.data;
}

export type {
  AppRole,
  AutomationDefinitionRow,
  ContactRow,
  LeadRow,
  LeadStage,
  OpportunityRow,
  ProductRow,
  ProductVariantRow,
  ProductImageRow,
  PricingTierRow,
  ShippingMethodRow,
  WorkflowTemplateRow,
  PaymentMethodRow,
  OrderRow,
  OrderStatus,
  CloserRow,
};
