import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GripVertical, Sparkles, X } from "lucide-react";
import { AppShell, StatusPill } from "@/components/app-shell";
import { etapas, leadsIniciales, type Lead, type LeadEtapa } from "@/lib/crm-data";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Pipeline de Leads — ZOLMYRA AI OS" },
      {
        name: "description",
        content:
          "Pipeline Kanban de leads: arrastra tarjetas entre etapas, asigna responsables y revisa el scoring IA.",
      },
      { property: "og:title", content: "Pipeline de Leads — ZOLMYRA AI OS" },
      {
        property: "og:description",
        content: "Kanban comercial con scoring de Inteligencia Artificial.",
      },
    ],
  }),
  component: Leads,
});

const responsables = ["Ana Vargas", "Luis Peña", "Diego Ruiz"];

function Leads() {
  const [leads, setLeads] = useState<Lead[]>(leadsIniciales);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<LeadEtapa | null>(null);
  const [detalle, setDetalle] = useState<Lead | null>(null);

  const mover = (etapa: LeadEtapa) => {
    if (!dragId) return;
    setLeads((prev) => prev.map((l) => (l.id === dragId ? { ...l, etapa } : l)));
    setDragId(null);
    setOver(null);
  };

  const asignar = (id: string, responsable: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, responsable } : l)));
    setDetalle((d) => (d && d.id === id ? { ...d, responsable } : d));
  };

  return (
    <AppShell
      title="Pipeline de Leads"
      subtitle="Arrastra las tarjetas para mover un lead entre etapas"
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {etapas.map((etapa) => {
          const items = leads.filter((l) => l.etapa === etapa);
          const total = items.reduce((s, l) => s + l.valor, 0);
          return (
            <div
              key={etapa}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(etapa);
              }}
              onDragLeave={() => setOver((o) => (o === etapa ? null : o))}
              onDrop={() => mover(etapa)}
              className={`flex w-[290px] shrink-0 flex-col rounded-xl border bg-surface/70 transition ${
                over === etapa ? "border-primary/60 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{etapa}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {items.length} leads · ${total.toLocaleString("es-BO")}
                  </p>
                </div>
                <StatusPill value={etapa} />
              </div>

              <div className="flex-1 space-y-3 p-3">
                {items.map((l) => (
                  <article
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setDetalle(l)}
                    className={`cursor-grab rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-soft)] transition hover:border-primary/40 active:cursor-grabbing ${
                      dragId === l.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{l.nombre}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{l.empresa}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        ${l.valor.toLocaleString("es-BO")}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-ai/15 px-2 py-0.5 text-[10px] font-semibold text-ai">
                        <Sparkles className="size-3" /> {l.score}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2">
                      <span className="text-[11px] text-muted-foreground">{l.canal}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                        {l.responsable}
                      </span>
                    </div>
                  </article>
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                    Suelta un lead aquí
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detalle && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm">
          <button className="flex-1" aria-label="Cerrar" onClick={() => setDetalle(null)} />
          <aside className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{detalle.nombre}</h2>
                <p className="text-sm text-muted-foreground">{detalle.empresa}</p>
              </div>
              <button onClick={() => setDetalle(null)} aria-label="Cerrar panel">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Valor estimado</p>
                <p className="mt-1 font-semibold">${detalle.valor.toLocaleString("es-BO")}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Lead Score IA</p>
                <p className="mt-1 font-semibold text-ai">{detalle.score}/100</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Etapa</p>
                <div className="mt-1.5">
                  <StatusPill value={detalle.etapa} />
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Canal</p>
                <p className="mt-1 font-semibold">{detalle.canal}</p>
              </div>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Asignar responsable
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {responsables.map((r) => (
                <button
                  key={r}
                  onClick={() => asignar(detalle.id, r)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    detalle.responsable === r
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-ai/25 bg-ai/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ai">
                <Sparkles className="size-4" /> Nota del agente IA
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Este cliente tiene una probabilidad de cierre del {detalle.score}%. Recomendamos
                contactar en las próximas 24 horas con una propuesta personalizada.
              </p>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
