import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, Plus, Target, TrendingUp } from "lucide-react";
import { AppShell, StatusPill } from "@/components/app-shell";
import { oportunidades } from "@/lib/crm-data";

export const Route = createFileRoute("/oportunidades")({
  head: () => ({ meta: [{ title: "Oportunidades — ZOLMYRA AI OS" }] }),
  component: Oportunidades,
});

function Oportunidades() {
  const pipeline = oportunidades.reduce((sum, o) => sum + o.valor, 0);
  return (
    <AppShell
      title="Oportunidades"
      subtitle="Pipeline comercial y previsión de cierre"
      actions={
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold">
          <Plus className="size-4" />
          Nueva oportunidad
        </button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Pipeline total", `$${pipeline.toLocaleString("es-BO")}`, DollarSign],
          [
            "Probabilidad media",
            `${Math.round(oportunidades.reduce((s, o) => s + o.probabilidad, 0) / oportunidades.length)}%`,
            TrendingUp,
          ],
          ["Oportunidades", String(oportunidades.length), Target],
        ].map(([l, v, Icon]) => (
          <div className="panel p-5" key={String(l)}>
            <Icon className="size-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">{l}</p>
            <p className="mt-1 text-xl font-bold">{v}</p>
          </div>
        ))}
      </section>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-left text-xs text-muted-foreground">
              {["Cliente", "Producto", "Valor", "Probabilidad", "Estado", "Cierre"].map((h) => (
                <th className="px-4 py-3" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {oportunidades.map((o) => (
              <tr className="border-b border-border/60" key={o.id}>
                <td className="px-4 py-4 font-medium">
                  {o.cliente}
                  <span className="block text-[10px] text-muted-foreground">{o.id}</span>
                </td>
                <td className="px-4 text-muted-foreground">{o.producto}</td>
                <td className="px-4 font-semibold">${o.valor.toLocaleString("es-BO")}</td>
                <td className="px-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${o.probabilidad}%` }}
                      />
                    </div>
                    {o.probabilidad}%
                  </div>
                </td>
                <td className="px-4">
                  <StatusPill value={o.estado} />
                </td>
                <td className="px-4 text-muted-foreground">{o.cierre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
