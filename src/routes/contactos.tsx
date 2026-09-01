import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Archive, Download, FileUp, Pencil, Plus, Search, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell, StatusPill } from "@/components/app-shell";
import {
  EmptyState,
  Field,
  FormModal,
  LoadingState,
  inputClass,
  submitClass,
  textareaClass,
} from "@/components/form-modal";
import {
  addNote,
  archiveContact,
  listContacts,
  listNotes,
  saveContact,
  type ContactRow,
} from "@/lib/data-service";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/contactos")({
  head: () => ({ meta: [{ title: "Contactos — ZOLMYRA AI OS" }] }),
  component: Contactos,
});
const schema = z.object({
  fullName: z.string().trim().min(2, "Escribe el nombre."),
  company: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("Correo inválido.")]).optional(),
  phone: z.string().optional(),
  status: z.enum(["active", "new", "follow_up", "inactive"]),
  source: z.string().optional(),
});
type Values = z.infer<typeof schema>;
const statusLabels: Record<string, string> = {
  active: "Activo",
  new: "Nuevo",
  follow_up: "En seguimiento",
  inactive: "Inactivo",
};

function Contactos() {
  const { user } = useAuth();
  const { current } = useOrganization();
  const [items, setItems] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ContactRow | null>(null);
  const [notes, setNotes] = useState<Awaited<ReturnType<typeof listNotes>>>([]);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", company: "", email: "", phone: "", status: "new", source: "" },
  });
  const load = async () => {
    if (!current.id) return;
    setLoading(true);
    try {
      setItems(await listContacts(current.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar contactos.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [current.id]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("create") === "contact") startCreate();
  }, []);
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          `${item.full_name} ${item.company ?? ""} ${item.email ?? ""} ${item.phone ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === "all" || item.status === status),
      ),
    [items, query, status],
  );
  function startCreate() {
    setEditing(null);
    form.reset({ fullName: "", company: "", email: "", phone: "", status: "new", source: "" });
    setOpen(true);
  }
  function startEdit(item: ContactRow) {
    setEditing(item);
    form.reset({
      fullName: item.full_name,
      company: item.company ?? "",
      email: item.email ?? "",
      phone: item.phone ?? "",
      status: item.status as Values["status"],
      source: item.source ?? "",
    });
    setOpen(true);
  }
  async function submit(values: Values) {
    if (!user || !current.id) return;
    try {
      await saveContact(current.id, user.id, { id: editing?.id, ...values });
      toast.success(editing ? "Contacto actualizado." : "Contacto creado.");
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar.");
    }
  }
  async function openDetail(item: ContactRow) {
    setDetail(item);
    try {
      setNotes(await listNotes(current.id, "contact", item.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar las notas.");
    }
  }
  async function createNote() {
    if (!user || !detail || !note.trim()) return;
    try {
      await addNote(current.id, user.id, "contact", detail.id, note);
      setNote("");
      setNotes(await listNotes(current.id, "contact", detail.id));
      toast.success("Nota guardada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar la nota.");
    }
  }
  function exportCsv() {
    const header = "nombre,empresa,correo,telefono,estado,fuente";
    const rows = filtered.map((item) =>
      [item.full_name, item.company, item.email, item.phone, item.status, item.source]
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    );
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${[header, ...rows].join("\n")}`], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "contactos.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  async function importCsv(file: File) {
    if (!user) return;
    try {
      const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
      const headers =
        lines
          .shift()
          ?.split(",")
          .map((value) => value.trim().toLowerCase()) ?? [];
      let count = 0;
      for (const line of lines) {
        const cells = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
        const value = (key: string) => cells[headers.indexOf(key)] ?? "";
        if (!value("nombre")) continue;
        await saveContact(current.id, user.id, {
          fullName: value("nombre"),
          company: value("empresa"),
          email: value("correo"),
          phone: value("telefono"),
          status: value("estado") || "new",
          source: value("fuente"),
        });
        count++;
      }
      toast.success(`${count} contactos importados.`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible importar el CSV.");
    }
  }
  return (
    <AppShell
      title="Contactos"
      subtitle={`${items.length} contactos en ${current.name}`}
      actions={
        <button onClick={startCreate} className={submitClass}>
          <Plus className="mr-2 size-4" />
          Crear contacto
        </button>
      }
    >
      <div className="panel p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar contactos…"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={`${inputClass} w-auto`}
          >
            <option value="all">Todos los estados</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => event.target.files?.[0] && void importCsv(event.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-border px-3 text-xs"
          >
            <FileUp className="mr-2 inline size-4" />
            Importar
          </button>
          <button onClick={exportCsv} className="rounded-lg border border-border px-3 text-xs">
            <Download className="mr-2 inline size-4" />
            Exportar
          </button>
        </div>
      </div>
      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No hay contactos"
          detail="Crea el primer contacto de esta empresa. Los datos se guardarán en Supabase."
          action={
            <button onClick={startCreate} className={submitClass}>
              Crear contacto
            </button>
          }
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-xs text-muted-foreground">
                {[
                  "Nombre",
                  "Empresa",
                  "Teléfono",
                  "Correo",
                  "Estado",
                  "Fuente",
                  "Creación",
                  "Acciones",
                ].map((label) => (
                  <th className="px-4 py-3" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr className="border-b border-border/60" key={item.id}>
                  <td className="px-4 py-3">
                    <button
                      className="font-medium hover:text-primary"
                      onClick={() => void openDetail(item)}
                    >
                      {item.full_name}
                    </button>
                  </td>
                  <td className="px-4 text-muted-foreground">{item.company || "—"}</td>
                  <td className="px-4 text-muted-foreground">{item.phone || "—"}</td>
                  <td className="px-4 text-muted-foreground">{item.email || "—"}</td>
                  <td className="px-4">
                    <StatusPill value={statusLabels[item.status] ?? item.status} />
                  </td>
                  <td className="px-4 text-muted-foreground">{item.source || "—"}</td>
                  <td className="px-4 text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("es-DO")}
                  </td>
                  <td className="px-4">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)} aria-label="Editar">
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`¿Archivar a ${item.full_name}?`)) {
                            await archiveContact(current.id, item.id);
                            toast.success("Contacto archivado.");
                            await load();
                          }
                        }}
                        aria-label="Archivar"
                      >
                        <Archive className="size-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FormModal
        open={open}
        title={editing ? "Editar contacto" : "Nuevo contacto"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" error={form.formState.errors.fullName?.message}>
            <input {...form.register("fullName")} className={inputClass} />
          </Field>
          <Field label="Empresa">
            <input {...form.register("company")} className={inputClass} />
          </Field>
          <Field label="Correo" error={form.formState.errors.email?.message}>
            <input {...form.register("email")} type="email" className={inputClass} />
          </Field>
          <Field label="Teléfono">
            <input {...form.register("phone")} className={inputClass} />
          </Field>
          <Field label="Estado">
            <select {...form.register("status")} className={inputClass}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fuente">
            <input
              {...form.register("source")}
              className={inputClass}
              placeholder="Web, referido…"
            />
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={form.formState.isSubmitting} className={submitClass}>
              Guardar contacto
            </button>
          </div>
        </form>
      </FormModal>
      <FormModal
        open={Boolean(detail)}
        title={detail?.full_name ?? "Contacto"}
        description="Notas internas del contacto"
        onClose={() => setDetail(null)}
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={textareaClass}
              placeholder="Escribe una nota…"
            />
            <button onClick={() => void createNote()} className={submitClass}>
              <StickyNote className="mr-2 size-4" />
              Guardar
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay notas.</p>
          ) : (
            notes.map((item) => (
              <article className="rounded-lg border border-border p-3" key={item.id}>
                <p className="text-sm">{item.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString("es-DO")}
                </p>
              </article>
            ))
          )}
        </div>
      </FormModal>
    </AppShell>
  );
}
