import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Flame, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusPill } from "@/components/app-shell";
import {
  EmptyState,
  FormModal,
  LoadingState,
  submitClass,
  textareaClass,
} from "@/components/form-modal";
import {
  assignOrderCloser,
  claimOrder,
  listClosers,
  listContacts,
  listOrders,
  updateOrderNotes,
  updateOrderStatus,
  type CloserRow,
  type ContactRow,
  type OrderRow,
  type OrderStatus,
} from "@/lib/data-service";
import { useOrganization } from "@/lib/organization";
import type { LucideIcon } from "lucide-react";
export const Route = createFileRoute("/closers")({
  head: () => ({ meta: [{ title: "Panel de Closers — ZOLMYRA AI OS" }] }),
  component: Closers,
});
const statusLabels: Record<OrderStatus, string> = {
  new: "Nuevo",
  incomplete: "Datos incompletos",
  quoted: "Cotizado",
  awaiting_payment: "Esperando pago",
  payment_review: "Pago por verificar",
  confirmed: "Confirmado",
  in_production: "En producción",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};
function Closers() {
  const { current, listMembers } = useOrganization();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [closers, setClosers] = useState<CloserRow[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [notes, setNotes] = useState("");
  const manager = current.roleCode === "admin" || current.roleCode === "supervisor";
  const load = async () => {
    if (!current.id) return;
    setLoading(true);
    try {
      const [orderData, people, closerData, members] = await Promise.all([
        listOrders(current.id),
        listContacts(current.id),
        listClosers(current.id),
        listMembers(),
      ]);
      setOrders(orderData);
      setContacts(people);
      setClosers(closerData);
      setMemberNames(Object.fromEntries(members.map((member) => [member.userId, member.fullName])));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar el panel.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [current.id]);
  const queue = orders.filter(
    (order) =>
      !order.closer_id && !(["delivered", "cancelled"] as OrderStatus[]).includes(order.status),
  );
  const assigned = orders.filter((order) => Boolean(order.closer_id));
  const completed = orders.filter((order) => order.status === "delivered");
  async function accept(order: OrderRow) {
    try {
      await claimOrder(order.id);
      toast.success("Cliente asignado correctamente.");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Otro closer tomó este cliente primero.",
      );
    }
  }
  function open(order: OrderRow) {
    setSelected(order);
    setNotes(order.internal_notes ?? "");
  }
  return (
    <AppShell title="Panel de Closers" subtitle={`Cola comercial de ${current.name}`}>
      <section className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["Esperando asistencia", queue.length, Flame],
            ["Asignados", assigned.length, UserCheck],
            ["Entregados", completed.length, CheckCircle2],
          ] satisfies ReadonlyArray<readonly [string, number, LucideIcon]>
        ).map(([label, value, Icon]) => (
          <article className="panel p-5" key={String(label)}>
            <Icon className="size-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">{String(label)}</p>
            <p className="mt-1 text-2xl font-bold">{String(value)}</p>
          </article>
        ))}
      </section>
      {loading ? (
        <LoadingState />
      ) : queue.length === 0 ? (
        <EmptyState
          title="Cola al día"
          detail="No hay pedidos pendientes de asignación en esta organización."
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {queue.map((order) => (
            <article className="panel p-5" key={order.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{order.id.slice(0, 8)}</p>
                  <h2 className="mt-1 font-semibold">
                    {contacts.find((contact) => contact.id === order.contact_id)?.full_name ??
                      "Cliente"}
                  </h2>
                </div>
                <StatusPill value={statusLabels[order.status]} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <p>
                  <span className="block text-xs text-muted-foreground">Provincia</span>
                  {order.province || "Pendiente"}
                </p>
                <p>
                  <span className="block text-xs text-muted-foreground">Valor</span>RD$
                  {Number(order.final_price ?? order.indicative_price ?? 0).toLocaleString("es-DO")}
                </p>
              </div>
              <div className="mt-5 flex gap-2">
                <button onClick={() => void accept(order)} className={submitClass}>
                  <UserCheck className="mr-2 size-4" />
                  Aceptar cliente
                </button>
                <button
                  onClick={() => open(order)}
                  className="rounded-lg border border-border px-4 text-xs font-semibold"
                >
                  Ver datos
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      {assigned.length > 0 && (
        <section className="panel overflow-x-auto">
          <header className="border-b border-border p-5">
            <h2 className="font-semibold">Operaciones asignadas</h2>
          </header>
          <table className="w-full min-w-[800px] text-sm">
            <tbody>
              {assigned.map((order) => (
                <tr className="border-b border-border/60" key={order.id}>
                  <td className="px-4 py-4 font-medium">
                    {contacts.find((contact) => contact.id === order.contact_id)?.full_name ??
                      "Cliente"}
                  </td>
                  <td className="px-4">
                    <StatusPill value={statusLabels[order.status]} />
                  </td>
                  <td className="px-4">
                    {memberNames[
                      closers.find((closer) => closer.id === order.closer_id)?.user_id ?? ""
                    ] ?? "Closer"}
                  </td>
                  <td className="px-4">
                    {manager && (
                      <select
                        value={order.closer_id ?? ""}
                        onChange={(event) =>
                          void (async () => {
                            try {
                              await assignOrderCloser(
                                current.id,
                                order.id,
                                event.target.value || null,
                              );
                              await load();
                              toast.success("Pedido reasignado.");
                            } catch (error) {
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "No fue posible reasignar.",
                              );
                            }
                          })()
                        }
                        className="rounded-lg border border-border bg-surface-2 p-2 text-xs"
                      >
                        {closers.map((closer) => (
                          <option value={closer.id} key={closer.id}>
                            {memberNames[closer.user_id] ?? closer.user_id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4">
                    <button
                      onClick={() => open(order)}
                      className="text-xs font-semibold text-primary"
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <FormModal
        open={Boolean(selected)}
        title={`Gestionar pedido ${selected?.id.slice(0, 8) ?? ""}`}
        onClose={() => setSelected(null)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Universidad</p>
              <p className="mt-1 text-sm">{selected?.university || "Pendiente"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Provincia</p>
              <p className="mt-1 text-sm">{selected?.province || "Pendiente"}</p>
            </div>
          </div>
          <label className="block text-sm font-medium">
            Notas internas
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={`${textareaClass} mt-2`}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                void (async () => {
                  if (!selected) return;
                  try {
                    await updateOrderNotes(current.id, selected.id, notes);
                    toast.success("Notas guardadas.");
                    await load();
                    setSelected(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "No fue posible guardar.");
                  }
                })()
              }
              className={submitClass}
            >
              Guardar notas
            </button>
            {selected && selected.status !== "confirmed" && (
              <button
                onClick={() =>
                  void (async () => {
                    await updateOrderStatus(current.id, selected.id, "confirmed");
                    toast.success("Pedido confirmado.");
                    await load();
                    setSelected(null);
                  })()
                }
                className="rounded-lg border border-success/40 px-4 text-sm font-semibold text-success"
              >
                <CheckCircle2 className="mr-2 inline size-4" />
                Confirmar
              </button>
            )}
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-4" />
            Los cambios de estado quedan registrados en el historial.
          </p>
        </div>
      </FormModal>
    </AppShell>
  );
}
