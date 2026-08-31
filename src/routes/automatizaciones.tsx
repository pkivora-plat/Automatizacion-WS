import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleAlert,
  Image,
  MapPin,
  Play,
  Plus,
  ShoppingBag,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { AppShell, StatusPill } from "@/components/app-shell";
import { flujos } from "@/lib/crm-data";
import { doraditoFlow, doraditoPending, doraditoPrices } from "@/lib/doradito-data";

export const Route = createFileRoute("/automatizaciones")({
  head: () => ({ meta: [{ title: "Automatizaciones — ZOLMYRA AI OS" }] }),
  component: Automatizaciones,
});

function Automatizaciones() {
  const [view, setView] = useState<"doradito" | "general">("doradito");
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
      <div className="flex gap-2 rounded-xl border border-border bg-surface p-2">
        <button
          onClick={() => setView("doradito")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "doradito" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
        >
          DORADITO
        </button>
        <button
          onClick={() => setView("general")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "general" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
        >
          Otros flujos
        </button>
      </div>
      {view === "doradito" && <DoraditoAutomation />}
      {view === "general" && (
        <>
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
                      <span className="text-[10px] font-bold uppercase text-primary">
                        {nodo.tipo}
                      </span>
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
        </>
      )}
    </AppShell>
  );
}

function DoraditoAutomation() {
  return (
    <div className="space-y-5">
      <section className="panel-glow p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-warning/15">
            <Bot className="size-7 text-warning" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">DORADITO</h2>
              <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold text-warning">
                Borrador · esperando contenido
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Asistente de ventas para anillos de graduación y matrimoniales.
            </p>
          </div>
          <button className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold">
            <Play className="mr-2 inline size-4" />
            Probar flujo
          </button>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <ShoppingBag className="size-4 text-primary" />
            Precios orientativos
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {doraditoPrices.map((item) => (
              <div className="rounded-xl border border-border bg-surface-2 p-4" key={item.category}>
                <p className="text-xs text-muted-foreground">{item.category}</p>
                <p className="mt-1 text-xs">{item.grams}</p>
                <p className="mt-3 text-xl font-bold">RD$ {item.price.toLocaleString("es-DO")}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-warning">
            El precio final puede variar según los gramos reales correspondientes a la medida del
            anillo.
          </p>
        </div>
        <div className="panel p-5">
          <h3 className="font-semibold">Datos admitidos</h3>
          <div className="mt-4 space-y-3">
            {[
              "Tallas 4 a 13",
              "Medias tallas: 4.5, 5.5…",
              "Material: oro o plata",
              "Graduación o matrimonial",
            ].map((item) => (
              <p className="flex items-center gap-2 text-xs text-muted-foreground" key={item}>
                <CheckCircle2 className="size-4 text-success" />
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>
      <section className="panel overflow-hidden">
        <header className="border-b border-border p-5">
          <h3 className="font-semibold">Flujo conversacional</h3>
          <p className="text-xs text-muted-foreground">
            Secuencia que Zolmyra enviará a N8N cuando el canal esté conectado.
          </p>
        </header>
        <div className="flex gap-3 overflow-x-auto p-5">
          {doraditoFlow.map((node, index) => (
            <div className="flex shrink-0 items-center gap-3" key={node.title}>
              <article className="w-60 rounded-xl border border-primary/25 bg-surface-2 p-4">
                <span className="text-[10px] font-bold uppercase text-primary">
                  {index + 1}. {node.type}
                </span>
                <h4 className="mt-2 text-sm font-semibold">{node.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{node.detail}</p>
              </article>
              {index < doraditoFlow.length - 1 && (
                <ArrowRight className="size-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Image className="size-4 text-ai" />
            Contenido multimedia
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="grid h-28 place-items-center rounded-xl border border-dashed border-border bg-surface-2 text-xs text-muted-foreground">
              Fotos de modelos
            </div>
            <div className="grid h-28 place-items-center rounded-xl border border-dashed border-border bg-surface-2 text-xs text-muted-foreground">
              <MapPin className="mb-1 size-5" />
              Ubicación y local
            </div>
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <CircleAlert className="size-4 text-warning" />
            Necesario antes de activar
          </h3>
          <ul className="mt-4 space-y-2">
            {doraditoPending.map((item) => (
              <li className="flex gap-2 text-xs leading-relaxed text-muted-foreground" key={item}>
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-warning" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
