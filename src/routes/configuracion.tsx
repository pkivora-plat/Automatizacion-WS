import { createFileRoute } from "@tanstack/react-router";
import { Bot, CheckCircle2, Database, KeyRound, MessageCircle, Plug, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — ZOLMYRA AI OS" }] }),
  component: Configuracion,
});
const secciones = [
  ["WhatsApp Business", "Canal conectado y recibiendo mensajes", MessageCircle, true],
  ["OpenAI", "Configura el modelo y la clave de API", Bot, false],
  ["N8N", "Webhooks y automatizaciones externas", Plug, true],
  ["Base de datos", "Persistencia y copias de seguridad", Database, true],
  ["Usuarios", "Equipo, roles y permisos", Users, false],
  ["Seguridad", "Credenciales y control de acceso", KeyRound, false],
] as const;
function Configuracion() {
  return (
    <AppShell
      title="Configuración"
      subtitle="Integraciones, seguridad y administración del espacio"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {secciones.map(([titulo, detalle, Icon, conectado]) => (
          <article className="panel p-5" key={titulo}>
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10">
                <Icon className="size-5 text-primary" />
              </span>
              {conectado && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="size-3.5" />
                  Conectado
                </span>
              )}
            </div>
            <h2 className="mt-4 font-semibold">{titulo}</h2>
            <p className="mt-1 min-h-10 text-xs leading-relaxed text-muted-foreground">{detalle}</p>
            <button className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-primary/40 hover:text-primary">
              {conectado ? "Administrar" : "Configurar"}
            </button>
          </article>
        ))}
      </section>
      <section className="panel p-5">
        <h2 className="font-semibold">Preferencias generales</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Nombre de la organización
            <input
              defaultValue="Zolmyra AI"
              className="mt-2 h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Zona horaria
            <select
              defaultValue="America/La_Paz"
              className="mt-2 h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground"
            >
              <option value="America/La_Paz">America/La_Paz (GMT-4)</option>
            </select>
          </label>
        </div>
        <button className="mt-5 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold">
          Guardar cambios
        </button>
      </section>
    </AppShell>
  );
}
