import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FileUp, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell, StatusPill } from "@/components/app-shell";
import {
  EmptyState,
  Field,
  FormModal,
  LoadingState,
  inputClass,
  submitClass,
  textareaClass,
} from "@/components/form-modal";
import {
  listCommerceSettings,
  listContacts,
  listOpportunities,
  listOrders,
  listProducts,
  saveOrder,
  updateOrderStatus,
  uploadPaymentProof,
  type ContactRow,
  type OpportunityRow,
  type OrderRow,
  type OrderStatus,
  type PaymentMethodRow,
  type ProductRow,
  type ProductVariantRow,
  type ShippingMethodRow,
} from "@/lib/data-service";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/lib/organization";
export const Route = createFileRoute("/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — ZOLMYRA AI OS" }] }),
  component: Pedidos,
});
const statuses: OrderStatus[] = [
  "new",
  "incomplete",
  "quoted",
  "awaiting_payment",
  "payment_review",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
];
const labels: Record<OrderStatus, string> = {
  new: "Nuevo",
  incomplete: "Datos incompletos",
  quoted: "Cotizado",
  awaiting_payment: "Esperando pago",
  payment_review: "Pago por verificar",
  confirmed: "Confirmado",
  in_production: "En producción",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};
const schema = z.object({
  contactId: z.string().uuid("Selecciona un cliente."),
  opportunityId: z.string().optional(),
  productId: z.string().optional(),
  variantId: z.string().optional(),
  shippingMethodId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  university: z.string().optional(),
  province: z.string().optional(),
  estimatedWeight: z.coerce.number().min(0).optional(),
  indicativePrice: z.coerce.number().min(0).optional(),
  finalPrice: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});
type Values = z.infer<typeof schema>;
function Pedidos() {
  const { user } = useAuth();
  const { current } = useOrganization();
  const [items, setItems] = useState<OrderRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [variants, setVariants] = useState<ProductVariantRow[]>([]);
  const [shipping, setShipping] = useState<ShippingMethodRow[]>([]);
  const [payments, setPayments] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      contactId: "",
      opportunityId: "",
      productId: "",
      variantId: "",
      shippingMethodId: "",
      paymentMethodId: "",
      university: "",
      province: "",
      estimatedWeight: 0,
      indicativePrice: 0,
      finalPrice: 0,
      notes: "",
    },
  });
  const productId = form.watch("productId");
  const load = async () => {
    if (!current.id) return;
    setLoading(true);
    try {
      const [orders, people, deals, catalog, commerce] = await Promise.all([
        listOrders(current.id),
        listContacts(current.id),
        listOpportunities(current.id),
        listProducts(current.id),
        listCommerceSettings(current.id),
      ]);
      setItems(orders);
      setContacts(people);
      setOpportunities(deals);
      setProducts(catalog.products);
      setVariants(catalog.variants);
      setShipping(commerce.shipping);
      setPayments(commerce.payment);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [current.id]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "order") {
      form.reset({
        ...form.getValues(),
        contactId: params.get("contact") ?? "",
        opportunityId: params.get("opportunity") ?? "",
      });
      setOpen(true);
    }
  }, []);
  async function submit(values: Values) {
    if (!user) return;
    try {
      const variant = variants.find((item) => item.id === values.variantId);
      const product = products.find((item) => item.id === values.productId);
      const created = await saveOrder(current.id, user.id, {
        ...values,
        unitPrice: values.finalPrice || values.indicativePrice || 0,
        attributes: {
          product: product?.name ?? "",
          category: product?.category ?? "",
          model: variant?.name ?? "",
          material: variant?.material ?? "",
          size: variant?.size ?? "",
        },
      });
      toast.success(`Pedido ${created.id.slice(0, 8)} creado.`);
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible crear el pedido.");
    }
  }
  function start() {
    form.reset({
      contactId: "",
      opportunityId: "",
      productId: "",
      variantId: "",
      shippingMethodId: "",
      paymentMethodId: "",
      university: "",
      province: "",
      estimatedWeight: 0,
      indicativePrice: 0,
      finalPrice: 0,
      notes: "",
    });
    setOpen(true);
  }
  function chooseVariant(id: string) {
    form.setValue("variantId", id);
    const variant = variants.find((item) => item.id === id);
    if (variant) {
      form.setValue("estimatedWeight", Number(variant.min_weight));
      form.setValue("indicativePrice", Number(variant.indicative_price));
    }
  }
  return (
    <AppShell
      title="Pedidos"
      subtitle={`Operación comercial de ${current.name}`}
      actions={
        <button onClick={start} className={submitClass}>
          <Plus className="mr-2 size-4" />
          Nuevo pedido
        </button>
      }
    >
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="No hay pedidos"
          detail="Crea un pedido con cliente, producto, transporte y método de pago."
          action={
            <button onClick={start} className={submitClass}>
              Crear pedido
            </button>
          }
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-xs text-muted-foreground">
                {[
                  "Pedido",
                  "Cliente",
                  "Estado",
                  "Provincia",
                  "Precio",
                  "Closer",
                  "Comprobante",
                  "Creación",
                ].map((label) => (
                  <th className="px-4 py-3" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-b border-border/60" key={item.id}>
                  <td className="px-4 py-4 font-mono text-xs">{item.id.slice(0, 8)}</td>
                  <td className="px-4">
                    {contacts.find((contact) => contact.id === item.contact_id)?.full_name ??
                      "Cliente"}
                  </td>
                  <td className="px-4">
                    <select
                      value={item.status}
                      onChange={(event) =>
                        void (async () => {
                          try {
                            await updateOrderStatus(
                              current.id,
                              item.id,
                              event.target.value as OrderStatus,
                            );
                            toast.success("Estado actualizado.");
                            await load();
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "No fue posible actualizar.",
                            );
                          }
                        })()
                      }
                      className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs"
                    >
                      {statuses.map((status) => (
                        <option value={status} key={status}>
                          {labels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 text-muted-foreground">{item.province || "—"}</td>
                  <td className="px-4 font-semibold">
                    RD$
                    {Number(item.final_price ?? item.indicative_price ?? 0).toLocaleString("es-DO")}
                  </td>
                  <td className="px-4">{item.closer_id ? "Asignado" : "Sin asignar"}</td>
                  <td className="px-4">
                    {item.payment_proof_path ? (
                      <StatusPill value="Recibido" />
                    ) : (
                      <label className="cursor-pointer text-xs font-semibold text-primary">
                        <FileUp className="mr-1 inline size-4" />
                        Subir
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file)
                              void (async () => {
                                try {
                                  await uploadPaymentProof(current.id, item.id, file);
                                  toast.success("Comprobante enviado a revisión.");
                                  await load();
                                } catch (error) {
                                  toast.error(
                                    error instanceof Error
                                      ? error.message
                                      : "No fue posible subir.",
                                  );
                                }
                              })();
                          }}
                        />
                      </label>
                    )}
                  </td>
                  <td className="px-4 text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("es-DO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FormModal
        open={open}
        title="Nuevo pedido"
        description="El precio orientativo se toma de la variante, pero puede ajustarse antes de confirmar."
        onClose={() => setOpen(false)}
      >
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente" error={form.formState.errors.contactId?.message}>
            <select {...form.register("contactId")} className={inputClass}>
              <option value="">Selecciona…</option>
              {contacts.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Oportunidad">
            <select {...form.register("opportunityId")} className={inputClass}>
              <option value="">Sin oportunidad</option>
              {opportunities.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Producto">
            <select {...form.register("productId")} className={inputClass}>
              <option value="">Sin producto</option>
              {products.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Modelo / talla">
            <select
              value={form.watch("variantId")}
              onChange={(event) => chooseVariant(event.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona…</option>
              {variants
                .filter((item) => !productId || item.product_id === productId)
                .map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · {item.material === "gold" ? "Oro" : "Plata"} · Talla {item.size}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Universidad">
            <input {...form.register("university")} className={inputClass} />
          </Field>
          <Field label="Provincia">
            <input {...form.register("province")} className={inputClass} />
          </Field>
          <Field label="Transportista">
            <select {...form.register("shippingMethodId")} className={inputClass}>
              <option value="">Por definir</option>
              {shipping
                .filter((item) => item.active)
                .map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · RD${item.fee}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Método de pago">
            <select {...form.register("paymentMethodId")} className={inputClass}>
              <option value="">Por definir</option>
              {payments
                .filter((item) => item.active)
                .map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Peso estimado">
            <input
              {...form.register("estimatedWeight")}
              type="number"
              min="0"
              step="0.1"
              className={inputClass}
            />
          </Field>
          <Field label="Precio orientativo">
            <input
              {...form.register("indicativePrice")}
              type="number"
              min="0"
              className={inputClass}
            />
          </Field>
          <Field label="Precio final">
            <input {...form.register("finalPrice")} type="number" min="0" className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notas">
              <textarea {...form.register("notes")} className={textareaClass} />
            </Field>
          </div>
          <p className="sm:col-span-2 text-xs text-warning">
            El precio final puede variar según los gramos reales correspondientes a la medida del
            anillo.
          </p>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={form.formState.isSubmitting} className={submitClass}>
              <ShoppingBag className="mr-2 size-4" />
              Crear pedido
            </button>
          </div>
        </form>
      </FormModal>
    </AppShell>
  );
}
