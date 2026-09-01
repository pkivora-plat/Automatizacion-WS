import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  MessageCircle,
  Sparkles,
  Workflow,
  Target,
  BarChart3,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  Plus,
  Bot,
  LogOut,
  Building2,
  ChevronDown,
  UserPlus,
  BriefcaseBusiness,
  UserRoundPlus,
  Gem,
  ShoppingBag,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/lib/organization";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contactos", label: "Contactos", icon: Users },
  { to: "/leads", label: "Leads", icon: KanbanSquare },
  { to: "/conversaciones", label: "Conversaciones", icon: MessageCircle },
  { to: "/ia", label: "IA (pendiente)", icon: Sparkles },
  { to: "/chatbot", label: "Constructor de bot", icon: Bot },
  { to: "/automatizaciones", label: "Automatizaciones (pendiente)", icon: Workflow },
  { to: "/oportunidades", label: "Oportunidades", icon: Target },
  { to: "/productos", label: "Catálogo", icon: Gem },
  { to: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/closers", label: "Closers", icon: Headphones },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/configuracion", label: "Configuración", icon: Settings },
] as const;

const quickActions = [
  {
    href: "/contactos?create=contact",
    label: "Nuevo contacto",
    description: "Añadir una persona o empresa",
    icon: UserRoundPlus,
  },
  {
    href: "/leads?create=lead",
    label: "Nuevo lead",
    description: "Registrar una oportunidad inicial",
    icon: KanbanSquare,
  },
  {
    href: "/oportunidades?create=opportunity",
    label: "Nueva oportunidad",
    description: "Crear una negociación comercial",
    icon: BriefcaseBusiness,
  },
  {
    href: "/pedidos?create=order",
    label: "Nuevo pedido",
    description: "Registrar una orden comercial",
    icon: ShoppingBag,
  },
  {
    href: "/productos?create=product",
    label: "Nuevo producto",
    description: "Agregar un artículo al catálogo",
    icon: Gem,
  },
  {
    href: "/configuracion?create=organization",
    label: "Nueva empresa",
    description: "Crear otro espacio de trabajo",
    icon: Building2,
  },
  {
    href: "/configuracion?create=invite",
    label: "Invitar usuario",
    description: "Agregar una persona al equipo",
    icon: UserPlus,
  },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
  flush,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, ready, signOut } = useAuth();
  const { current, organizations, switchOrganization } = useOrganization();
  const [orgMenu, setOrgMenu] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) void navigate({ to: "/login" });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {open && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="grid size-10 place-items-center rounded-xl bg-brand-gradient shadow-[var(--shadow-glow)]">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold tracking-tight">ZOLMYRA AI OS</p>
            <p className="truncate text-[11px] text-muted-foreground">Revenue Intelligence</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto rounded-md p-1 text-muted-foreground lg:hidden"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="relative mx-3 mb-2">
          <button
            onClick={() => setOrgMenu((value) => !value)}
            className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-left"
          >
            <Building2 className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{current.name}</span>
              <span className="block text-[10px] text-muted-foreground">
                {current.plan} · {current.role}
              </span>
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          {orgMenu && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-1 shadow-xl">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrganization(org.id);
                    setOrgMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs ${org.id === current.id ? "bg-primary/15 text-primary" : "hover:bg-muted"}`}
                >
                  <span className="grid size-6 place-items-center rounded bg-secondary font-bold">
                    {org.name.slice(0, 1)}
                  </span>
                  <span className="truncate">{org.name}</span>
                  {org.id === current.id && (
                    <span className="ml-auto size-1.5 rounded-full bg-success" />
                  )}
                </button>
              ))}
              <Link
                to="/configuracion"
                onClick={() => setOrgMenu(false)}
                className="mt-1 block border-t border-border px-3 py-2 text-xs font-semibold text-primary"
              >
                Administrar empresas
              </Link>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Operación
          </p>
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--primary)]"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className={cn("size-[18px]", active && "text-primary")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-xl border border-border bg-[var(--gradient-surface)] p-4">
          <p className="text-xs font-semibold">Supabase conectado</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Datos persistentes por organización. N8N, Meta e IA siguen pendientes.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold uppercase">
            {user.name.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="truncate capitalize text-sm font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{current.role}</p>
          </div>
          <button
            onClick={signOut}
            className="ml-auto rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-border p-2 text-muted-foreground lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              )}
            </div>
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Buscar clientes, leads, conversaciones…"
                className="h-10 w-64 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-ring/25 xl:w-80"
              />
            </div>
            <button
              className="relative rounded-lg border border-border bg-surface p-2.5 text-muted-foreground transition hover:text-foreground"
              aria-label="Notificaciones"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
            </button>
            {actions ?? (
              <div className="relative">
                <button
                  onClick={() => setQuickOpen((value) => !value)}
                  aria-expanded={quickOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Nuevo</span>
                  <ChevronDown className="size-3.5" />
                </button>
                {quickOpen && (
                  <>
                    <button
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => setQuickOpen(false)}
                      aria-label="Cerrar menú de creación"
                    />
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-40 mt-2 w-[310px] overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-2xl"
                    >
                      <div className="px-3 py-2">
                        <p className="text-xs font-bold">Creación rápida</p>
                        <p className="text-[11px] text-muted-foreground">
                          Empresa activa: {current.name}
                        </p>
                      </div>
                      <div className="max-h-[420px] overflow-y-auto">
                        {quickActions.map((action, index) => {
                          const Icon = action.icon;
                          return (
                            <a
                              key={`${action.label}-${index}`}
                              href={action.href}
                              onClick={() => setQuickOpen(false)}
                              role="menuitem"
                              className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-muted"
                            >
                              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10">
                                <Icon className="size-4 text-primary" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold">{action.label}</span>
                                <span className="block truncate text-[11px] text-muted-foreground">
                                  {action.description}
                                </span>
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        <main className={flush ? "" : "space-y-6 p-4 sm:p-6"}>{children}</main>
      </div>
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    Activo: "bg-success/15 text-success border-success/25",
    Ganado: "bg-success/15 text-success border-success/25",
    Nuevo: "bg-primary/15 text-primary border-primary/25",
    Contactado: "bg-info/15 text-info border-info/25",
    Calificado: "bg-ai/15 text-ai border-ai/25",
    Propuesta: "bg-warning/15 text-warning border-warning/25",
    Negociación: "bg-warning/15 text-warning border-warning/25",
    "En seguimiento": "bg-warning/15 text-warning border-warning/25",
    Perdido: "bg-destructive/15 text-destructive border-destructive/25",
    Inactivo: "bg-muted text-muted-foreground border-border",
    Pausado: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        map[value] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {value}
    </span>
  );
}
