import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Search, Send, Sparkles, Paperclip, Video } from "lucide-react";
import { AppShell, StatusPill } from "@/components/app-shell";
import { conversaciones } from "@/lib/crm-data";

export const Route = createFileRoute("/conversaciones")({
  head: () => ({
    meta: [
      { title: "Conversaciones WhatsApp — ZOLMYRA AI OS" },
      {
        name: "description",
        content:
          "Bandeja unificada de WhatsApp Business con ficha del cliente, estado del lead, historial y notas IA.",
      },
      { property: "og:title", content: "Conversaciones WhatsApp — ZOLMYRA AI OS" },
      {
        property: "og:description",
        content: "Inbox omnicanal estilo WhatsApp Web con asistencia IA.",
      },
    ],
  }),
  component: Conversaciones,
});

function Conversaciones() {
  const [activa, setActiva] = useState(conversaciones[0]!.id);
  const chat = conversaciones.find((c) => c.id === activa)!;

  return (
    <AppShell title="Conversaciones" subtitle="WhatsApp Business · Bandeja unificada" flush>
      <div className="grid h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_320px]">
        <aside className="hidden flex-col border-r border-border bg-surface lg:flex">
          <div className="p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Buscar conversación…"
                className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversaciones.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiva(c.id)}
                className={`flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition ${
                  activa === c.id ? "bg-primary/10" : "hover:bg-surface-2/60"
                }`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                  {c.nombre
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{c.nombre}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{c.hora}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="truncate text-xs text-muted-foreground">{c.preview}</span>
                    {c.noLeidos > 0 && (
                      <span className="ml-auto grid size-4 shrink-0 place-items-center rounded-full bg-success text-[10px] font-bold text-success-foreground">
                        {c.noLeidos}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-background">
          <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
            <span className="grid size-10 place-items-center rounded-full bg-secondary text-xs font-semibold">
              {chat.nombre
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{chat.nombre}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {chat.empresa} · en línea
              </p>
            </div>
            <button
              className="rounded-lg border border-border p-2 text-muted-foreground"
              aria-label="Llamar"
            >
              <Phone className="size-4" />
            </button>
            <button
              className="rounded-lg border border-border p-2 text-muted-foreground"
              aria-label="Videollamada"
            >
              <Video className="size-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {chat.mensajes.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.de === "agente" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-[var(--shadow-soft)] ${
                    m.de === "agente"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-surface-2 text-foreground"
                  }`}
                >
                  <p className="leading-relaxed">{m.texto}</p>
                  <p className="mt-1 text-right text-[10px] opacity-70">{m.hora}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border bg-surface p-3">
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-border p-2.5 text-muted-foreground"
                aria-label="Adjuntar"
              >
                <Paperclip className="size-4" />
              </button>
              <input
                placeholder="Escribe un mensaje…"
                className="h-11 flex-1 rounded-xl border border-border bg-surface-2 px-4 text-sm outline-none focus:border-primary/60"
              />
              <button
                className="grid size-11 place-items-center rounded-xl bg-brand-gradient text-primary-foreground"
                aria-label="Enviar"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-ai">
              <Sparkles className="size-3" /> Sugerencia IA: "Te comparto la propuesta con el plan
              recomendado para tu operación."
            </p>
          </div>
        </section>

        <aside className="hidden flex-col gap-4 overflow-y-auto border-l border-border bg-surface p-4 xl:flex">
          <div className="text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-gradient text-lg font-semibold text-primary-foreground">
              {chat.nombre
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </span>
            <p className="mt-3 text-sm font-semibold">{chat.nombre}</p>
            <p className="text-xs text-muted-foreground">{chat.empresa}</p>
            <p className="text-xs text-muted-foreground">{chat.telefono}</p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Estado del lead
            </p>
            <div className="mt-2 flex items-center justify-between">
              <StatusPill value={chat.estado} />
              <span className="text-xs font-semibold text-ai">Score {chat.score}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-gradient"
                style={{ width: `${chat.score}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-ai/25 bg-ai/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ai">
              <Sparkles className="size-4" /> Notas IA
            </p>
            <ul className="mt-2 space-y-2">
              {chat.notasIA.map((n) => (
                <li key={n} className="text-xs leading-relaxed text-muted-foreground">
                  • {n}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Historial
            </p>
            <ol className="mt-3 space-y-3 border-l border-border pl-4">
              {[
                "Lead creado desde WhatsApp",
                "Calificado por el agente IA",
                "Propuesta comercial enviada",
                "Seguimiento programado 24h",
              ].map((h, i) => (
                <li key={h} className="relative text-xs text-muted-foreground">
                  <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-primary" />
                  {h}
                  <span className="block text-[10px] opacity-70">Hace {(i + 1) * 3} h</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
