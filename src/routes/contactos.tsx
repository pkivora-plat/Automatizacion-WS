import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Filter, Pencil, Plus, Search } from "lucide-react";
import { AppShell, StatusPill } from "@/components/app-shell";
import { contactos, type Estado } from "@/lib/crm-data";

export const Route = createFileRoute("/contactos")({
  head: () => ({
    meta: [
      { title: "Contactos — ZOLMYRA AI OS" },
      {
        name: "description",
        content: "Base de contactos con búsqueda, filtros por estado y fuente, edición y creación.",
      },
      { property: "og:title", content: "Contactos — ZOLMYRA AI OS" },
      { property: "og:description", content: "Gestiona toda tu base comercial en un solo lugar." },
    ],
  }),
  component: Contactos,
});

const estados: (Estado | "Todos")[] = ["Todos", "Activo", "Nuevo", "En seguimiento", "Inactivo"];

function Contactos() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<Estado | "Todos">("Todos");

  const filtrados = useMemo(
    () =>
      contactos.filter((c) => {
        const match = `${c.nombre} ${c.empresa} ${c.correo} ${c.telefono}`
          .toLowerCase()
          .includes(q.toLowerCase());
        return match && (estado === "Todos" || c.estado === estado);
      }),
    [q, estado],
  );

  return (
    <AppShell
      title="Contactos"
      subtitle={`${contactos.length} contactos registrados · ${filtrados.length} visibles`}
      actions={
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Crear contacto</span>
        </button>
      }
    >
      <div className="panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, empresa o correo…"
              className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/25"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-1 size-4 text-muted-foreground" />
            {estados.map((e) => (
              <button
                key={e}
                onClick={() => setEstado(e)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  estado === e
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground">
            <Download className="size-4" /> Exportar
          </button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Fuente</th>
                <th className="px-4 py-3 font-semibold">Creación</th>
                <th className="px-4 py-3 font-semibold">Última actividad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} className="border-b border-border/60 transition hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold">
                        {c.nombre
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <div>
                        <p className="font-medium">{c.nombre}</p>
                        <p className="text-[11px] text-muted-foreground">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.empresa}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.telefono}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.correo}</td>
                  <td className="px-4 py-3">
                    <StatusPill value={c.estado} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.fuente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.creado}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.ultimaActividad}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded-md border border-border p-1.5 text-muted-foreground transition hover:text-primary"
                      aria-label={`Editar ${c.nombre}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No se encontraron contactos con esos criterios.
          </p>
        )}
      </div>
    </AppShell>
  );
}
