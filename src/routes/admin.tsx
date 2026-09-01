import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Building2,
  CheckCircle2,
  Copy,
  Crown,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import {
  EmptyState,
  Field,
  FormModal,
  LoadingState,
  inputClass,
  submitClass,
} from "@/components/form-modal";
import { useAuth } from "@/lib/auth";
import {
  createDoraditoExample,
  createPlatformOrganization,
  listPlatformOrganizations,
  updatePlatformOrganization,
  type PlatformOrganization,
} from "@/lib/platform-service";
import type { PlanTier } from "@/lib/supabase/database.types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administración global — ZOLMYRA AI OS" }] }),
  component: PlatformAdmin,
});
const schema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre de la empresa."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones."),
  timezone: z.string().trim().min(3),
  ownerEmail: z.union([z.literal(""), z.string().email("Correo inválido.")]).optional(),
});
type Values = z.infer<typeof schema>;
const statusLabels: Record<PlatformOrganization["status"], string> = {
  onboarding: "Incorporación",
  active: "Activa",
  suspended: "Suspendida",
};
const planLabels: Record<PlanTier, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

function PlatformAdmin() {
  const { ready, platformAdmin } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [invitation, setInvitation] = useState("");
  const [creatingDoradito, setCreatingDoradito] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", timezone: "America/Santo_Domingo", ownerEmail: "" },
  });
  useEffect(() => {
    if (ready && !platformAdmin) void navigate({ to: "/" });
  }, [ready, platformAdmin, navigate]);
  const load = async () => {
    if (!platformAdmin) return;
    setLoading(true);
    try {
      setItems(await listPlatformOrganizations());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar las empresas.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [platformAdmin]);
  const summary = useMemo(
    () => ({
      active: items.filter((item) => item.status === "active").length,
      suspended: items.filter((item) => item.status === "suspended").length,
      members: items.reduce((sum, item) => sum + item.memberCount, 0),
      orders: items.reduce((sum, item) => sum + item.orderCount, 0),
    }),
    [items],
  );
  async function submit(values: Values) {
    try {
      const result = await createPlatformOrganization(values);
      if (result.invitationToken)
        setInvitation(`${window.location.origin}/login?invite=${result.invitationToken}`);
      else setOpen(false);
      toast.success("Empresa creada.");
      await load();
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible crear la empresa.");
    }
  }
  async function update(
    item: PlatformOrganization,
    values: { status: PlatformOrganization["status"]; plan: PlanTier },
  ) {
    try {
      await updatePlatformOrganization(item.id, values);
      toast.success("Empresa actualizada.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar la empresa.");
    }
  }
  if (!ready || !platformAdmin)
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  return (
    <AppShell
      title="Administración global"
      subtitle="Control de la plataforma ZOLMYRA · acceso restringido"
    >
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
        <ShieldAlert className="mr-2 inline size-4" />
        Este panel administra organizaciones, pero no desactiva el aislamiento RLS ni expone sus
        registros directamente.
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["Empresas activas", summary.active, Building2],
            ["Suspendidas", summary.suspended, ShieldAlert],
            ["Miembros", summary.members, Users],
            ["Pedidos", summary.orders, ShoppingBag],
          ] satisfies ReadonlyArray<readonly [string, number, LucideIcon]>
        ).map(([label, value, Icon]) => (
          <article className="panel p-5" key={String(label)}>
            <Icon className="size-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </section>
      <section className="panel overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="font-semibold">Organizaciones de la plataforma</h2>
            <p className="text-xs text-muted-foreground">
              Planes, límites, incorporación y suspensión.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!items.some((item) => item.slug === "doradito") && (
              <button
                disabled={creatingDoradito}
                onClick={() =>
                  void (async () => {
                    setCreatingDoradito(true);
                    try {
                      await createDoraditoExample();
                      toast.success("DORADITO fue creado como empresa independiente.");
                      await load();
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "No fue posible crear DORADITO.",
                      );
                    } finally {
                      setCreatingDoradito(false);
                    }
                  })()
                }
                className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary"
              >
                <Crown className="mr-2 inline size-4" />
                Crear ejemplo DORADITO
              </button>
            )}
            <button
              onClick={() => {
                setInvitation("");
                setOpen(true);
              }}
              className={submitClass}
            >
              <Plus className="mr-2 size-4" />
              Nueva empresa
            </button>
          </div>
        </header>
        {loading ? (
          <div className="p-5">
            <LoadingState />
          </div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No hay organizaciones"
              detail="Crea la primera empresa administrada por ZOLMYRA."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-xs text-muted-foreground">
                  {[
                    "Empresa",
                    "Estado",
                    "Plan",
                    "Miembros",
                    "Contactos",
                    "Leads",
                    "Pedidos",
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
                  <AdminRow item={item} onSave={update} key={item.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <FormModal
        open={open}
        title="Crear empresa cliente"
        description="Si el propietario ya tiene cuenta será agregado; de lo contrario se generará una invitación."
        onClose={() => setOpen(false)}
      >
        {invitation ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Comparte este enlace únicamente con el administrador de la empresa:
            </p>
            <div className="break-all rounded-lg border border-border bg-muted p-3 text-xs">
              {invitation}
            </div>
            <button
              className={submitClass}
              onClick={() => {
                void navigator.clipboard.writeText(invitation);
                toast.success("Enlace copiado.");
              }}
            >
              <Copy className="mr-2 size-4" />
              Copiar invitación
            </button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" error={form.formState.errors.name?.message}>
              <input {...form.register("name")} className={inputClass} />
            </Field>
            <Field label="Slug" error={form.formState.errors.slug?.message}>
              <input {...form.register("slug")} className={inputClass} />
            </Field>
            <Field label="Zona horaria">
              <input {...form.register("timezone")} className={inputClass} />
            </Field>
            <Field label="Correo del propietario" error={form.formState.errors.ownerEmail?.message}>
              <input {...form.register("ownerEmail")} type="email" className={inputClass} />
            </Field>
            <div className="sm:col-span-2 flex justify-end">
              <button disabled={form.formState.isSubmitting} className={submitClass}>
                Crear empresa
              </button>
            </div>
          </form>
        )}
      </FormModal>
    </AppShell>
  );
}

function AdminRow({
  item,
  onSave,
}: {
  item: PlatformOrganization;
  onSave: (
    item: PlatformOrganization,
    values: { status: PlatformOrganization["status"]; plan: PlanTier },
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState(item.status);
  const [plan, setPlan] = useState(item.plan);
  useEffect(() => {
    setStatus(item.status);
    setPlan(item.plan);
  }, [item]);
  const changed = status !== item.status || plan !== item.plan;
  return (
    <tr className="border-b border-border/60">
      <td className="px-4 py-4">
        <p className="font-semibold">{item.name}</p>
        <p className="text-xs text-muted-foreground">/{item.slug}</p>
      </td>
      <td className="px-4">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as PlatformOrganization["status"])}
          className="rounded-lg border border-border bg-surface-2 p-2 text-xs"
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4">
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value as PlanTier)}
          className="rounded-lg border border-border bg-surface-2 p-2 text-xs"
        >
          {Object.entries(planLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4">{item.memberCount}</td>
      <td className="px-4">{item.contactCount}</td>
      <td className="px-4">{item.leadCount}</td>
      <td className="px-4">{item.orderCount}</td>
      <td className="px-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString("es-DO")}
          </span>
          {changed ? (
            <button
              onClick={() => void onSave(item, { status, plan })}
              className="text-xs font-semibold text-primary"
            >
              Guardar
            </button>
          ) : (
            <CheckCircle2 className="size-4 text-success" />
          )}
        </div>
      </td>
    </tr>
  );
}
