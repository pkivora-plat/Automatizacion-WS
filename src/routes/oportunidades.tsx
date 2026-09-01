import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, ShoppingBag, Target } from "lucide-react";
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
} from "@/components/form-modal";
import {
  listContacts,
  listOpportunities,
  saveOpportunity,
  type ContactRow,
  type OpportunityRow,
} from "@/lib/data-service";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/lib/organization";
import { calculateWeightedForecast } from "@/lib/business-rules";

export const Route = createFileRoute("/oportunidades")({
  head: () => ({ meta: [{ title: "Oportunidades — ZOLMYRA AI OS" }] }),
  component: Oportunidades,
});
const schema = z.object({
  contactId: z.string().uuid("Selecciona un contacto."),
  title: z.string().trim().min(2),
  estimatedValue: z.coerce.number().min(0),
  probability: z.coerce.number().int().min(0).max(100),
  status: z.enum(["open", "won", "lost", "cancelled"]),
  expectedCloseDate: z.string().optional(),
});
type Values = z.infer<typeof schema>;
const labels: Record<OpportunityRow["status"], string> = {
  open: "Abierta",
  won: "Ganada",
  lost: "Perdida",
  cancelled: "Cancelada",
};
function Oportunidades() {
  const { user } = useAuth();
  const { current } = useOrganization();
  const [items, setItems] = useState<OpportunityRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OpportunityRow | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      contactId: "",
      title: "",
      estimatedValue: 0,
      probability: 25,
      status: "open",
      expectedCloseDate: "",
    },
  });
  const load = async () => {
    if (!current.id) return;
    setLoading(true);
    try {
      const [opportunities, people] = await Promise.all([
        listOpportunities(current.id),
        listContacts(current.id),
      ]);
      setItems(opportunities);
      setContacts(people);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar oportunidades.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [current.id]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("create") === "opportunity") startCreate();
  }, []);
  function startCreate() {
    setEditing(null);
    form.reset({
      contactId: "",
      title: "",
      estimatedValue: 0,
      probability: 25,
      status: "open",
      expectedCloseDate: "",
    });
    setOpen(true);
  }
  function edit(item: OpportunityRow) {
    setEditing(item);
    form.reset({
      contactId: item.contact_id,
      title: item.title,
      estimatedValue: Number(item.estimated_value),
      probability: item.probability,
      status: item.status,
      expectedCloseDate: item.expected_close_date ?? "",
    });
    setOpen(true);
  }
  async function submit(values: Values) {
    if (!user) return;
    try {
      await saveOpportunity(current.id, user.id, { id: editing?.id, ...values });
      toast.success(editing ? "Oportunidad actualizada." : "Oportunidad creada.");
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar.");
    }
  }
  const pipeline = items
    .filter((item) => item.status === "open")
    .reduce((sum, item) => sum + Number(item.estimated_value), 0);
  const forecast = calculateWeightedForecast(
    items
      .filter((item) => item.status === "open")
      .map((item) => ({ value: Number(item.estimated_value), probability: item.probability })),
  );
  return (
    <AppShell
      title="Oportunidades"
      subtitle={`Pronóstico comercial de ${current.name}`}
      actions={
        <button onClick={startCreate} className={submitClass}>
          <Plus className="mr-2 size-4" />
          Nueva oportunidad
        </button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Pipeline", pipeline],
          ["Pronóstico", forecast],
          ["Oportunidades", items.length],
        ].map(([label, value]) => (
          <article className="panel p-5" key={label}>
            <Target className="size-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold">
              {label === "Oportunidades" ? value : `RD$${Number(value).toLocaleString("es-DO")}`}
            </p>
          </article>
        ))}
      </section>
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin oportunidades"
          detail="Crea una oportunidad vinculada a un contacto."
          action={
            <button className={submitClass} onClick={startCreate}>
              Crear oportunidad
            </button>
          }
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-xs text-muted-foreground">
                {[
                  "Cliente",
                  "Oportunidad",
                  "Valor",
                  "Probabilidad",
                  "Estado",
                  "Cierre",
                  "Acciones",
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
                  <td className="px-4">
                    {contacts.find((contact) => contact.id === item.contact_id)?.full_name ??
                      "Contacto"}
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => edit(item)} className="font-medium hover:text-primary">
                      {item.title}
                    </button>
                  </td>
                  <td className="px-4 font-semibold">
                    RD${Number(item.estimated_value).toLocaleString("es-DO")}
                  </td>
                  <td className="px-4">{item.probability}%</td>
                  <td className="px-4">
                    <StatusPill value={labels[item.status]} />
                  </td>
                  <td className="px-4 text-muted-foreground">
                    {item.expected_close_date
                      ? new Date(`${item.expected_close_date}T00:00:00`).toLocaleDateString("es-DO")
                      : "—"}
                  </td>
                  <td className="px-4">
                    <a
                      href={`/pedidos?create=order&opportunity=${item.id}&contact=${item.contact_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      <ShoppingBag className="size-4" />
                      Crear pedido
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FormModal
        open={open}
        title={editing ? "Editar oportunidad" : "Nueva oportunidad"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Contacto" error={form.formState.errors.contactId?.message}>
            <select {...form.register("contactId")} className={inputClass}>
              <option value="">Selecciona…</option>
              {contacts.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Título">
            <input {...form.register("title")} className={inputClass} />
          </Field>
          <Field label="Valor estimado">
            <input
              {...form.register("estimatedValue")}
              type="number"
              min="0"
              className={inputClass}
            />
          </Field>
          <Field label="Probabilidad">
            <input
              {...form.register("probability")}
              type="number"
              min="0"
              max="100"
              className={inputClass}
            />
          </Field>
          <Field label="Estado">
            <select {...form.register("status")} className={inputClass}>
              {Object.entries(labels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha estimada de cierre">
            <input {...form.register("expectedCloseDate")} type="date" className={inputClass} />
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={form.formState.isSubmitting} className={submitClass}>
              Guardar oportunidad
            </button>
          </div>
        </form>
      </FormModal>
    </AppShell>
  );
}
