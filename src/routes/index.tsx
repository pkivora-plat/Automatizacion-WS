import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { embudo, kpis, tendencia, ventasMensuales, insightsIA } from "@/lib/crm-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Ejecutivo — ZOLMYRA AI OS" },
      {
        name: "description",
        content:
          "Convierte conversaciones en oportunidades mediante Inteligencia Artificial. KPIs, embudo comercial y tendencias en una sola pantalla.",
      },
      { property: "og:title", content: "Dashboard Ejecutivo — ZOLMYRA AI OS" },
      {
        property: "og:description",
        content: "Panel ejecutivo de CRM con IA, WhatsApp Business y automatizaciones.",
      },
    ],
  }),
  component: Dashboard,
});

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

function Dashboard() {
  const maxEmbudo = embudo[0].valor;

  return (
    <AppShell
      title="Dashboard Ejecutivo"
      subtitle="Convierte conversaciones en oportunidades mediante Inteligencia Artificial."
    >
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {k.label}
            </p>
            <p className="mt-2 font-display text-xl font-bold sm:text-2xl">{k.value}</p>
            <p
              className={`mt-1 inline-flex items-center gap-1 text-xs ${
                k.trend === "up" ? "text-success" : "text-destructive"
              }`}
            >
              {k.trend === "up" ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {k.delta} vs. semana anterior
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Ventas vs. meta</h2>
              <p className="text-xs text-muted-foreground">Últimos 8 meses (USD)</p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground">
              2026
            </span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasMensuales} barGap={6}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  width={54}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Bar dataKey="meta" fill="var(--chart-5)" radius={[6, 6, 0, 0]} opacity={0.45} />
                <Bar dataKey="ventas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-base font-semibold">Embudo comercial</h2>
          <p className="text-xs text-muted-foreground">Conversión por etapa</p>
          <div className="mt-5 space-y-3">
            {embudo.map((e) => (
              <div key={e.etapa}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{e.etapa}</span>
                  <span className="font-semibold">{e.valor.toLocaleString("es-BO")}</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(e.valor / maxEmbudo) * 100}%`,
                      background: e.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-5 xl:col-span-2">
          <h2 className="text-base font-semibold">Tendencia semanal</h2>
          <p className="text-xs text-muted-foreground">Conversaciones y leads generados</p>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendencia}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="dia"
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  width={36}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="conversaciones"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="var(--chart-2)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-glow p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-ai" />
            <h2 className="text-base font-semibold">Próximas acciones IA</h2>
          </div>
          <div className="mt-4 space-y-3">
            {insightsIA.slice(0, 3).map((i) => (
              <div key={i.cliente} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{i.cliente}</p>
                  <span className="text-xs font-semibold text-ai">{i.probabilidad}%</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.accion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
