import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { embudo, ventasMensuales } from "@/lib/crm-data";

export const Route = createFileRoute("/reportes")({
  head: () => ({ meta: [{ title: "Reportes — ZOLMYRA AI OS" }] }),
  component: Reportes,
});
const origenes = [
  { origen: "WhatsApp", leads: 124 },
  { origen: "Meta Ads", leads: 86 },
  { origen: "Web", leads: 64 },
  { origen: "Referidos", leads: 42 },
];
function Reportes() {
  return (
    <AppShell title="Reportes" subtitle="Conversión, rendimiento y ventas por período">
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-semibold">Ventas por período</h2>
          <p className="text-xs text-muted-foreground">Ventas mensuales vs meta</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasMensuales}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ventas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="meta" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="font-semibold">Leads por origen</h2>
          <p className="text-xs text-muted-foreground">Adquisición del período actual</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={origenes} layout="vertical">
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="origen" width={80} />
                <Tooltip />
                <Bar dataKey="leads" fill="var(--chart-3)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      <section className="panel p-5">
        <h2 className="font-semibold">Conversión por etapa</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {embudo.map((e, i) => (
            <div className="rounded-xl border border-border bg-surface-2 p-4" key={e.etapa}>
              <p className="text-xs text-muted-foreground">{e.etapa}</p>
              <p className="mt-2 text-xl font-bold">{e.valor.toLocaleString("es-BO")}</p>
              {i > 0 && (
                <p className="text-xs text-success">
                  {Math.round((e.valor / embudo[i - 1]!.valor) * 100)}% conversión
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
