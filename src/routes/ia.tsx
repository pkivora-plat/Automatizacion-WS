import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, CheckCircle2, Sparkles, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { insightsIA } from "@/lib/crm-data";

export const Route = createFileRoute("/ia")({
  head: () => ({ meta: [{ title: "Inteligencia IA — ZOLMYRA AI OS" }] }),
  component: InteligenciaIA,
});

function InteligenciaIA() {
  return (
    <AppShell
      title="Inteligencia Artificial"
      subtitle="Prioriza oportunidades y convierte señales en acciones"
    >
      <section className="grid gap-4 md:grid-cols-3">
        {(
          [
            ["Leads analizados", "1.284", BrainCircuit],
            ["Score promedio", "79/100", Target],
            ["Acciones sugeridas", "18", Sparkles],
          ] satisfies ReadonlyArray<readonly [string, string, LucideIcon]>
        ).map(([label, value, Icon]) => (
          <div className="panel p-5" key={String(label)}>
            <Icon className="size-5 text-ai" />
            <p className="mt-4 text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        {insightsIA.map((item) => (
          <article className="panel p-5" key={item.cliente}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{item.cliente}</h2>
                <p className="mt-1 text-xs text-ai">{item.intencion}</p>
              </div>
              <span className="rounded-full bg-ai/15 px-3 py-1 text-sm font-bold text-ai">
                {item.probabilidad}%
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.resumen}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-gradient"
                style={{ width: `${item.score}%` }}
              />
            </div>
            <p className="mt-4 flex gap-2 rounded-lg border border-success/25 bg-success/5 p-3 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              {item.accion}
            </p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
