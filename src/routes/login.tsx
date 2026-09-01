import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — ZOLMYRA AI OS" },
      { name: "description", content: "Accede a tu plataforma de inteligencia comercial." },
    ],
  }),
  component: Login,
});

function Login() {
  const { user, ready, configured, signIn, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) void navigate({ to: "/" });
  }, [ready, user, navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      await navigate({ to: "/" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-[var(--gradient-surface)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-40 top-10 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 right-0 size-96 rounded-full bg-ai/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-gradient shadow-[var(--shadow-glow)]">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-display font-bold">ZOLMYRA AI OS</p>
            <p className="text-xs text-muted-foreground">Revenue Intelligence Platform</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai/10 px-3 py-1 text-xs text-ai">
            <Bot className="size-3.5" />
            Inteligencia comercial en cada conversación
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight">
            Convierte conversaciones en <span className="text-gradient">oportunidades.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Centraliza clientes, automatiza seguimientos y permite que tu equipo cierre más ventas
            con asistencia de IA.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Bandeja omnicanal para todo tu equipo",
              "Chatbots configurables sin código",
              "Datos aislados y seguros por organización",
            ].map((item) => (
              <p className="flex items-center gap-3 text-sm" key={item}>
                <CheckCircle2 className="size-4 text-success" />
                {item}
              </p>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-muted-foreground">
          © 2026 Zolmyra AI. Plataforma empresarial segura.
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient">
              <Sparkles className="size-5" />
            </span>
            <p className="font-display font-bold">ZOLMYRA AI OS</p>
          </div>
          <p className="text-sm font-semibold text-primary">Bienvenido de nuevo</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Inicia sesión en tu cuenta</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Administra conversaciones, equipos y automatizaciones desde un solo lugar.
          </p>
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <label className="block text-sm font-medium">
              Correo electrónico
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </label>
            <label className="block text-sm font-medium">
              Contraseña
              <div className="relative mt-2">
                <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="current-password"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-12 w-full rounded-xl border border-border bg-surface px-10 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-primary"
                />
                Recordarme
              </label>
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={async () => {
                  setError("");
                  if (!email.includes("@")) {
                    setError("Escribe tu correo para recuperar la contraseña.");
                    return;
                  }
                  try {
                    await requestPasswordReset(email);
                    setError("Revisa tu correo para continuar con la recuperación.");
                  } catch (cause) {
                    setError(
                      cause instanceof Error ? cause.message : "No fue posible enviar el correo.",
                    );
                  }
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                {error}
              </p>
            )}
            <button
              disabled={loading || !configured}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient font-semibold shadow-[var(--shadow-glow)] transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                "Verificando…"
              ) : (
                <>
                  Iniciar sesión <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
          {!configured && (
            <div className="mt-6 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive">
              Supabase no está configurado. Define las variables públicas del proyecto.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
