import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Database,
  KeyRound,
  MessageCircle,
  Phone,
  Plug,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — ZOLMYRA AI OS" }] }),
  component: Configuracion,
});
const sections = [
  ["whatsapp", "WhatsApp Business", MessageCircle],
  ["equipo", "Equipo y permisos", Users],
  ["integraciones", "Integraciones", Plug],
  ["seguridad", "Seguridad", ShieldCheck],
] as const;

function Configuracion() {
  const [section, setSection] = useState<(typeof sections)[number][0]>("whatsapp");
  const [wizard, setWizard] = useState(false);
  const metaReady = Boolean(
    import.meta.env.VITE_META_APP_ID && import.meta.env.VITE_META_CONFIG_ID,
  );
  return (
    <AppShell
      title="Configuración"
      subtitle="Administra canales, equipo y seguridad de tu organización"
    >
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="panel h-fit p-2">
          {sections.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${section === id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}
            >
              <Icon className="size-4" />
              {label}
              <ChevronRight className="ml-auto size-4" />
            </button>
          ))}
        </aside>
        <div className="space-y-5">
          {section === "whatsapp" && (
            <>
              <section className="panel-glow overflow-hidden p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-success/15">
                    <MessageCircle className="size-7 text-success" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">Conecta tu WhatsApp Business</h2>
                      <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
                        Pendiente
                      </span>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      Vincula tu cuenta mediante el proceso oficial de Meta. Zolmyra nunca
                      solicitará tu contraseña de Facebook.
                    </p>
                  </div>
                  <button
                    onClick={() => setWizard(true)}
                    className="rounded-xl bg-success px-5 py-3 text-sm font-bold text-success-foreground transition hover:opacity-90"
                  >
                    Conectar WhatsApp
                  </button>
                </div>
              </section>
              <section className="grid gap-4 md:grid-cols-3">
                {[
                  [Building2, "Empresa de Meta", "Sin conectar"],
                  [MessageCircle, "Cuenta de WhatsApp", "Sin conectar"],
                  [Phone, "Número comercial", "Sin registrar"],
                ].map(([Icon, title, status]) => (
                  <article className="panel p-5" key={String(title)}>
                    <Icon className="size-5 text-muted-foreground" />
                    <p className="mt-4 text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{status}</p>
                  </article>
                ))}
              </section>
              <section className="panel p-5">
                <h2 className="font-semibold">Antes de conectar</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "Acceso administrativo al negocio de Meta",
                    "Número disponible y acceso para verificarlo",
                    "Autenticación de dos factores activa",
                    "Datos legales y perfil comercial actualizados",
                  ].map((item) => (
                    <p
                      className="flex gap-2 rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground"
                      key={item}
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                      {item}
                    </p>
                  ))}
                </div>
              </section>
            </>
          )}
          {section === "equipo" && (
            <section className="panel overflow-hidden">
              <header className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h2 className="font-semibold">Miembros del equipo</h2>
                  <p className="text-xs text-muted-foreground">
                    Controla el acceso por rol y organización.
                  </p>
                </div>
                <button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold">
                  Invitar usuario
                </button>
              </header>
              {[
                ["Ricky E.", "rickit60-ctrl@users.noreply.github.com", "Administrador"],
                ["Ana Vargas", "ana@zolmyra.ai", "Supervisor"],
                ["Luis Peña", "luis@zolmyra.ai", "Agente"],
              ].map(([name, email, role]) => (
                <div className="flex items-center gap-3 border-b border-border/60 p-4" key={email}>
                  <span className="grid size-9 place-items-center rounded-full bg-secondary text-xs">
                    {name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs">
                    {role}
                  </span>
                </div>
              ))}
            </section>
          )}
          {section === "integraciones" && (
            <section className="grid gap-4 sm:grid-cols-2">
              {[
                [Bot, "OpenAI", "Respuestas, resumen y clasificación"],
                [Database, "Base de datos", "Persistencia multiempresa"],
                [Plug, "N8N", "Automatizaciones y webhooks"],
                [KeyRound, "Meta for Developers", "Embedded Signup y Cloud API"],
              ].map(([Icon, title, detail]) => (
                <article className="panel p-5" key={String(title)}>
                  <Icon className="size-5 text-primary" />
                  <h2 className="mt-4 font-semibold">{title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                  <button className="mt-5 w-full rounded-lg border border-border py-2 text-xs font-semibold">
                    Configurar
                  </button>
                </article>
              ))}
            </section>
          )}
          {section === "seguridad" && (
            <section className="panel p-5">
              <ShieldCheck className="size-6 text-success" />
              <h2 className="mt-4 font-semibold">Protección de la cuenta</h2>
              <div className="mt-5 space-y-3">
                {[
                  "Autenticación de dos factores",
                  "Registro de sesiones y actividad",
                  "Cifrado de credenciales de integraciones",
                  "Aislamiento de datos por organización",
                ].map((item, i) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-border p-4 text-sm"
                    key={item}
                  >
                    <span>{item}</span>
                    <span className={`text-xs ${i < 2 ? "text-warning" : "text-success"}`}>
                      {i < 2 ? "Por configurar" : "Preparado"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      {wizard && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <button
              onClick={() => setWizard(false)}
              className="absolute right-4 top-4 text-muted-foreground"
            >
              <X className="size-5" />
            </button>
            <span className="grid size-12 place-items-center rounded-xl bg-success/15">
              <MessageCircle className="size-6 text-success" />
            </span>
            <h2 className="mt-5 text-xl font-bold">Conectar con Meta</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              El proceso oficial abrirá una ventana segura de Meta para seleccionar tu empresa,
              cuenta y número de WhatsApp.
            </p>
            <div className="mt-5 space-y-3">
              {[
                "Inicia sesión directamente en Meta",
                "Selecciona o crea tu cuenta de WhatsApp",
                "Verifica el número comercial",
                "Autoriza a Zolmyra y envía una prueba",
              ].map((step, i) => (
                <div className="flex items-center gap-3 text-sm" key={step}>
                  <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
            {!metaReady && (
              <p className="mt-5 flex gap-2 rounded-lg border border-warning/25 bg-warning/5 p-3 text-xs leading-relaxed text-muted-foreground">
                <CircleAlert className="size-4 shrink-0 text-warning" />
                La interfaz está lista, pero faltan META_APP_ID y META_CONFIG_ID. Se activará cuando
                Meta apruebe la aplicación.
              </p>
            )}
            <button
              disabled={!metaReady}
              className="mt-5 w-full rounded-xl bg-success py-3 text-sm font-bold text-success-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar con Facebook
            </button>
            <Link
              to="/chatbot"
              onClick={() => setWizard(false)}
              className="mt-3 block text-center text-xs font-semibold text-primary"
            >
              Configurar mi chatbot mientras tanto
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
