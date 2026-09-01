import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { GripVertical, Plus } from "lucide-react";
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
  listLeads,
  moveLead,
  saveLead,
  type ContactRow,
  type LeadRow,
  type LeadStage,
} from "@/lib/data-service";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [{ title: "Pipeline de Leads — ZOLMYRA AI OS" }] }),
  component: Leads,
});
const stages: LeadStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];
const labels: Record<LeadStage, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  proposal: "Propuesta",
  negotiation: "Negociación",
  won: "Ganado",
  lost: "Perdido",
};
const schema = z.object({
  title: z.string().trim().min(2, "Escribe un título."),
  contactId: z.string().optional(),
  stage: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]),
  value: z.coerce.number().min(0),
  source: z.string().optional(),
  followUpAt: z.string().optional(),
});
type Values = z.infer<typeof schema>;

function Leads() {
  const { user } = useAuth();
  const { current } = useOrganization();
  const [items, setItems] = useState<LeadRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeadRow | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", contactId: "", stage: "new", value: 0, source: "", followUpAt: "" },
  });
  const load = async () => {
    if (!current.id) return;
    setLoading(true);
    try {
      const [leads, people] = await Promise.all([listLeads(current.id), listContacts(current.id)]);
      setItems(leads);
      setContacts(people);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar el pipeline.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [current.id]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("create") === "lead") startCreate();
  }, []);
  function startCreate() {
    setEditing(null);
    form.reset({ title: "", contactId: "", stage: "new", value: 0, source: "", followUpAt: "" });
    setOpen(true);
  }
  function startEdit(item: LeadRow) {
    setEditing(item);
    form.reset({
      title: item.title,
      contactId: item.contact_id ?? "",
      stage: item.stage,
      value: Number(item.value),
      source: item.source ?? "",
      followUpAt: item.follow_up_at?.slice(0, 16) ?? "",
    });
    setOpen(true);
  }
  async function submit(values: Values) {
    if (!user) return;
    try {
      await saveLead(current.id, user.id, {
        id: editing?.id,
        ...values,
        followUpAt: values.followUpAt ? new Date(values.followUpAt).toISOString() : undefined,
      });
      toast.success(editing ? "Lead actualizado." : "Lead creado.");
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar el lead.");
    }
  }
  async function drop(stage: LeadStage) {
    const lead = items.find((item) => item.id === dragId);
    if (!lead || lead.stage === stage) return setDragId(null);
    let reason: string | undefined;
    if (stage === "lost") {
      reason = prompt("Indica el motivo de pérdida:")?.trim();
      if (!reason) {
        setDragId(null);
        return;
      }
    }
    const previous = items;
    setItems((value) =>
      value.map((item) =>
        item.id === lead.id ? { ...item, stage, loss_reason: reason ?? null } : item,
      ),
    );
    setDragId(null);
    try {
      await moveLead(current.id, user!.id, lead, stage, reason);
      toast.success(`Lead movido a ${labels[stage]}.`);
    } catch (error) {
      setItems(previous);
      toast.error(error instanceof Error ? error.message : "No fue posible mover el lead.");
    }
  }
  return (
    <AppShell
      title="Pipeline de Leads"
      subtitle={`Datos reales de ${current.name}`}
      actions={
        <button onClick={startCreate} className={submitClass}>
          <Plus className="mr-2 size-4" />
          Nuevo lead
        </button>
      }
    >
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="Pipeline vacío"
          detail="Crea el primer lead. Cada movimiento quedará registrado como actividad."
          action={
            <button onClick={startCreate} className={submitClass}>
              Crear lead
            </button>
          }
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageItems = items.filter((item) => item.stage === stage);
            return (
              <section
                key={stage}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => void drop(stage)}
                className="flex w-[290px] shrink-0 flex-col rounded-xl border border-border bg-surface/70"
              >
                <header className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{labels[stage]}</p>
                    <p className="text-xs text-muted-foreground">
                      {stageItems.length} · RD$
                      {stageItems
                        .reduce((sum, item) => sum + Number(item.value), 0)
                        .toLocaleString("es-DO")}
                    </p>
                  </div>
                  <StatusPill value={labels[stage]} />
                </header>
                <div className="min-h-28 flex-1 space-y-3 p-3">
                  {stageItems.map((item) => (
                    <article
                      key={item.id}
                      draggable
                      onDragStart={() => setDragId(item.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => startEdit(item)}
                      className={`cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm hover:border-primary/40 ${dragId === item.id ? "opacity-40" : ""}`}
                    >
                      <div className="flex gap-2">
                        <GripVertical className="mt-1 size-3.5 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {contacts.find((contact) => contact.id === item.contact_id)
                              ?.full_name ?? "Sin contacto"}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 font-semibold">
                        RD${Number(item.value).toLocaleString("es-DO")}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {item.source || "Sin fuente"}
                      </p>
                    </article>
                  ))}
                  {stageItems.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                      Suelta un lead aquí
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <FormModal
        open={open}
        title={editing ? "Editar lead" : "Nuevo lead"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" error={form.formState.errors.title?.message}>
            <input {...form.register("title")} className={inputClass} />
          </Field>
          <Field label="Contacto">
            <select {...form.register("contactId")} className={inputClass}>
              <option value="">Sin contacto</option>
              {contacts.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Etapa">
            <select {...form.register("stage")} className={inputClass}>
              {stages.map((stage) => (
                <option value={stage} key={stage}>
                  {labels[stage]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valor estimado">
            <input {...form.register("value")} type="number" min="0" className={inputClass} />
          </Field>
          <Field label="Fuente">
            <input {...form.register("source")} className={inputClass} />
          </Field>
          <Field label="Seguimiento">
            <input {...form.register("followUpAt")} type="datetime-local" className={inputClass} />
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={form.formState.isSubmitting} className={submitClass}>
              Guardar lead
            </button>
          </div>
        </form>
      </FormModal>
    </AppShell>
  );
}
