import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Play, Plus, Workflow } from "lucide-react";
import { AppShell, StatusPill } from "@/components/app-shell";
import { flujos } from "@/lib/crm-data";

export const Route = createFileRoute("/automatizaciones")({
  head: () => ({ meta: [{ title: "Automatizaciones — ZOLMYRA AI OS" }] }),
  component: Automatizaciones,
});

function Automatizaciones() {
  return (
    <AppShell
      title="Automatizaciones"
      subtitle="Webhooks, APIs y seguimiento automático"
      actions={
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold">
          <Plus className="size-4" />
          Nuevo flujo
        </button>
      }
    >
      {flujos.map((flujo) => (
        <section className="panel overflow-hidden" key={flujo.nombre}>
          <header className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <Workflow className="size-5 text-primary" />
            <div className="flex-1">
              <h2 className="text-sm font-semibold">{flujo.nombre}</h2>
              <p className="text-xs text-muted-foreground">
                {flujo.ejecuciones.toLocaleString("es-BO")} ejecuciones
              </p>
            </div>
            <StatusPill value={flujo.estado} />
            <button aria-label="Ejecutar flujo" className="rounded-lg border border-border p-2">
              <Play className="size-4" />
            </button>
          </header>
          <div className="flex gap-3 overflow-x-auto p-5">
            {flujo.nodos.map((nodo, index) => (
              <div className="flex shrink-0 items-center gap-3" key={nodo.titulo}>
                <div className="w-56 rounded-xl border border-primary/25 bg-surface-2 p-4">
                  <span className="text-[10px] font-bold uppercase text-primary">{nodo.tipo}</span>
                  <h3 className="mt-2 text-sm font-semibold">{nodo.titulo}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{nodo.detalle}</p>
                </div>
                {index < flujo.nodos.length - 1 && (
                  <ArrowRight className="size-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
