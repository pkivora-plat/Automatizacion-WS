import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Bot,
  Check,
  MessageSquareText,
  Plus,
  Save,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/chatbot")({
  head: () => ({ meta: [{ title: "Constructor de chatbot — ZOLMYRA AI OS" }] }),
  component: ChatbotBuilder,
});
type BotConfig = {
  name: string;
  tone: string;
  welcome: string;
  away: string;
  objective: string;
  handoff: string;
  instructions: string;
  knowledge: { id: number; title: string; content: string }[];
};
const initial: BotConfig = {
  name: "Zoe",
  tone: "Amigable y profesional",
  welcome: "¡Hola! Soy Zoe, asistente virtual. ¿En qué puedo ayudarte hoy?",
  away: "En este momento nuestro equipo está fuera de horario, pero puedo ayudarte con información general.",
  objective: "Calificar al cliente, resolver dudas y crear oportunidades comerciales.",
  handoff: "El cliente solicita una persona, está molesto o necesita una negociación especial.",
  instructions:
    "Responde únicamente con información autorizada. No inventes precios ni condiciones. Solicita nombre y empresa antes de crear un lead.",
  knowledge: [
    {
      id: 1,
      title: "Servicios",
      content: "Implementación de CRM, automatización comercial y agentes de IA.",
    },
    { id: 2, title: "Horario", content: "Lunes a viernes de 08:30 a 18:00, hora de Bolivia." },
  ],
};
const tabs = [
  ["personalidad", "Personalidad", Bot],
  ["mensajes", "Mensajes", MessageSquareText],
  ["conocimiento", "Conocimiento", BookOpen],
  ["reglas", "Reglas", ShieldCheck],
  ["simulador", "Simulador", Sparkles],
] as const;

function ChatbotBuilder() {
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("personalidad");
  const [config, setConfig] = useState<BotConfig>(initial);
  const [saved, setSaved] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ from: "bot", text: initial.welcome }]);
  const { current } = useOrganization();
  const storageKey = `zolmyra.bot-config.${current.id}`;
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setConfig(stored ? (JSON.parse(stored) as BotConfig) : initial);
    setMessages([
      { from: "bot", text: stored ? (JSON.parse(stored) as BotConfig).welcome : initial.welcome },
    ]);
  }, [storageKey]);
  function save() {
    localStorage.setItem(storageKey, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }
  function send() {
    if (!input.trim()) return;
    const question = input;
    setMessages((m) => [
      ...m,
      { from: "user", text: question },
      {
        from: "bot",
        text: `Gracias por tu consulta. Según la información configurada, puedo ayudarte con ${config.knowledge.map((k) => k.title.toLowerCase()).join(" y ")}. ¿Deseas que te comunique con un asesor?`,
      },
    ]);
    setInput("");
  }
  const field =
    "mt-2 h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-primary";
  const area =
    "mt-2 min-h-28 w-full rounded-lg border border-border bg-surface-2 p-3 text-sm leading-relaxed outline-none focus:border-primary";
  return (
    <AppShell
      title="Constructor de chatbot"
      subtitle="Configura cómo conversa, qué sabe y cuándo transfiere a una persona"
      actions={
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold"
        >
          {saved ? <Check className="size-4" /> : <Save className="size-4" />}
          {saved ? "Guardado" : "Guardar y publicar"}
        </button>
      }
    >
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-surface p-2">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${tab === id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
      {tab === "personalidad" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-5">
            <h2 className="font-semibold">Identidad del asistente</h2>
            <div className="mt-5 space-y-4">
              <label className="text-xs text-muted-foreground">
                Nombre
                <input
                  className={field}
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Tono
                <select
                  className={field}
                  value={config.tone}
                  onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                >
                  <option>Amigable y profesional</option>
                  <option>Formal y ejecutivo</option>
                  <option>Cercano y casual</option>
                  <option>Consultivo y comercial</option>
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Objetivo
                <textarea
                  className={area}
                  value={config.objective}
                  onChange={(e) => setConfig({ ...config, objective: e.target.value })}
                />
              </label>
            </div>
          </div>
          <div className="panel-glow p-5">
            <Sparkles className="size-5 text-ai" />
            <h2 className="mt-4 font-semibold">Vista previa de personalidad</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Soy <strong className="text-foreground">{config.name}</strong>. Mi comunicación será{" "}
              <strong className="text-foreground">{config.tone.toLowerCase()}</strong>.
            </p>
            <p className="mt-4 rounded-xl bg-surface p-4 text-sm">{config.welcome}</p>
          </div>
        </section>
      )}
      {tab === "mensajes" && (
        <section className="panel space-y-5 p-5">
          <h2 className="font-semibold">Mensajes principales</h2>
          <label className="block text-xs text-muted-foreground">
            Bienvenida
            <textarea
              className={area}
              value={config.welcome}
              onChange={(e) => setConfig({ ...config, welcome: e.target.value })}
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Fuera de horario
            <textarea
              className={area}
              value={config.away}
              onChange={(e) => setConfig({ ...config, away: e.target.value })}
            />
          </label>
          <p className="rounded-lg border border-info/25 bg-info/5 p-3 text-xs text-muted-foreground">
            Los seguimientos iniciados por la empresa se gestionarán como plantillas de Meta y
            tendrán un proceso de aprobación separado.
          </p>
        </section>
      )}
      {tab === "conocimiento" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Biblioteca autorizada</h2>
              <p className="text-xs text-muted-foreground">
                La IA responderá únicamente con esta información.
              </p>
            </div>
            <button
              onClick={() =>
                setConfig({
                  ...config,
                  knowledge: [
                    ...config.knowledge,
                    { id: Date.now(), title: "Nueva fuente", content: "" },
                  ],
                })
              }
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs"
            >
              <Plus className="size-4" />
              Agregar
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {config.knowledge.map((item) => (
              <article className="panel p-4" key={item.id}>
                <div className="flex gap-2">
                  <input
                    value={item.title}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        knowledge: config.knowledge.map((k) =>
                          k.id === item.id ? { ...k, title: e.target.value } : k,
                        ),
                      })
                    }
                    className="h-10 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-sm font-semibold"
                  />
                  <button
                    onClick={() =>
                      setConfig({
                        ...config,
                        knowledge: config.knowledge.filter((k) => k.id !== item.id),
                      })
                    }
                    aria-label="Eliminar fuente"
                    className="p-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <textarea
                  value={item.content}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      knowledge: config.knowledge.map((k) =>
                        k.id === item.id ? { ...k, content: e.target.value } : k,
                      ),
                    })
                  }
                  className={area}
                />
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === "reglas" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-5">
            <SlidersHorizontal className="size-5 text-primary" />
            <h2 className="mt-3 font-semibold">Instrucciones y límites</h2>
            <textarea
              className={`${area} min-h-52`}
              value={config.instructions}
              onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
            />
          </div>
          <div className="panel p-5">
            <ShieldCheck className="size-5 text-success" />
            <h2 className="mt-3 font-semibold">Transferencia a humano</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Describe cuándo el bot debe detenerse y asignar un agente.
            </p>
            <textarea
              className={`${area} min-h-40`}
              value={config.handoff}
              onChange={(e) => setConfig({ ...config, handoff: e.target.value })}
            />
            <label className="mt-4 flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              Transferencia automática
              <input type="checkbox" defaultChecked className="accent-primary" />
            </label>
          </div>
        </section>
      )}
      {tab === "simulador" && (
        <section className="mx-auto max-w-3xl panel overflow-hidden">
          <header className="flex items-center gap-3 border-b border-border p-4">
            <span className="grid size-10 place-items-center rounded-full bg-brand-gradient">
              <Bot className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">{config.name}</h2>
              <p className="text-xs text-success">Simulador activo · no envía mensajes reales</p>
            </div>
          </header>
          <div className="min-h-96 space-y-3 p-5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${m.from === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2"}`}
                >
                  {m.text}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Prueba una pregunta…"
              className="h-11 flex-1 rounded-xl border border-border bg-surface-2 px-4 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={send}
              className="grid size-11 place-items-center rounded-xl bg-brand-gradient"
              aria-label="Enviar"
            >
              <Send className="size-4" />
            </button>
          </div>
        </section>
      )}
    </AppShell>
  );
}
