import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Braces, CheckCircle2, Clock3, Power, Workflow } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusPill } from "@/components/app-shell";
import { EmptyState, LoadingState } from "@/components/form-modal";
import {
  listAutomationDefinitions,
  setAutomationActive,
  type AutomationDefinitionRow,
  type WorkflowTemplateRow,
} from "@/lib/data-service";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/automatizaciones")({
  head: () => ({ meta: [{ title: "Automatizaciones — ZOLMYRA AI OS" }] }),
  component: Automatizaciones,
});
function Automatizaciones() {
  const { current } = useOrganization();
  const [definitions, setDefinitions] = useState<AutomationDefinitionRow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const canManage = current.roleCode === "admin" || current.roleCode === "supervisor";
  const load = async () => {
    if (!current.id) return;
    setLoading(true);
    try {
      const data = await listAutomationDefinitions(current.id);
      setDefinitions(data.definitions);
      setTemplates(data.templates);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No fue posible cargar automatizaciones.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [current.id]);
  return (
    <AppShell
      title="Automatizaciones"
      subtitle={`Definiciones propias de ${current.name} · N8N aún no conectado`}
    >
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
        <Clock3 className="mr-2 inline size-4" />
        Las definiciones se guardan en Supabase, pero las ejecuciones externas permanecerán
        desactivadas hasta configurar N8N.
      </div>
      {loading ? (
        <LoadingState />
      ) : definitions.length === 0 ? (
        <EmptyState
          title="Sin automatizaciones instaladas"
          detail="Las plantillas son reutilizables, pero cada empresa conserva una copia y configuración independientes."
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {definitions.map((item) => (
            <article className="panel p-5" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10">
                  <Workflow className="size-5 text-primary" />
                </span>
                <StatusPill value={item.active ? "Activa" : "Borrador"} />
              </div>
              <h2 className="mt-4 font-semibold">{item.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Disparador: {item.trigger_type} · Versión {item.version}
              </p>
              <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
                <Braces className="mr-2 inline size-4" />
                {summarizeDefinition(item.definition)}
              </div>
              {canManage && (
                <button
                  onClick={() =>
                    void (async () => {
                      try {
                        await setAutomationActive(current.id, item.id, !item.active);
                        toast.success(
                          item.active
                            ? "Automatización pausada."
                            : "Definición activada localmente.",
                        );
                        await load();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "No fue posible actualizar.",
                        );
                      }
                    })()
                  }
                  className="mt-4 rounded-lg border border-border px-4 py-2 text-xs font-semibold"
                >
                  <Power className="mr-2 inline size-4" />
                  {item.active ? "Pausar" : "Activar definición"}
                </button>
              )}
            </article>
          ))}
        </section>
      )}
      <section className="panel p-5">
        <h2 className="font-semibold">Plantillas disponibles</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Una plantilla no comparte datos entre empresas; solamente describe una estructura
          reutilizable.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {templates.map((template) => (
            <article className="rounded-xl border border-border p-4" key={template.id}>
              <CheckCircle2 className="size-5 text-success" />
              <h3 className="mt-2 font-semibold">{template.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {template.description || "Sin descripción"}
              </p>
            </article>
          ))}
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aún no hay plantillas globales publicadas.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
function summarizeDefinition(definition: unknown) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition))
    return "Definición configurable";
  const states = (definition as Record<string, unknown>)["states"];
  return Array.isArray(states)
    ? `${states.length} estados deterministas configurados`
    : "Definición configurable";
}
