import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  MessageCircle,
  PackageCheck,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Field, FormModal, inputClass, submitClass, textareaClass } from "@/components/form-modal";
import { useAuth } from "@/lib/auth";
import { useOrganization, type OrganizationMember } from "@/lib/organization";
import {
  listCommerceSettings,
  savePaymentMethod,
  saveShippingMethod,
  type AppRole,
  type PaymentMethodRow,
  type ShippingMethodRow,
} from "@/lib/data-service";

export const Route = createFileRoute("/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — ZOLMYRA AI OS" }] }),
  component: Configuracion,
});
type Section = "companies" | "team" | "commerce" | "integrations";
const roles: Record<AppRole, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  agent: "Agente",
  closer: "Closer",
};
function Configuracion() {
  const { user } = useAuth();
  const org = useOrganization();
  const { current } = org;
  const [section, setSection] = useState<Section>("companies");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [shipping, setShipping] = useState<ShippingMethodRow[]>([]);
  const [payments, setPayments] = useState<PaymentMethodRow[]>([]);
  const [modal, setModal] = useState<"company" | "invite" | "shipping" | "payment" | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [company, setCompany] = useState({
    name: "",
    slug: "",
    timezone: "America/Santo_Domingo",
    tradeName: "",
    address: "",
  });
  const [newCompany, setNewCompany] = useState({ name: "", timezone: "America/Santo_Domingo" });
  const [invite, setInvite] = useState({ email: "", role: "agent" as AppRole });
  const [ship, setShip] = useState({
    name: "",
    provinces: "",
    fee: 0,
    estimatedTime: "",
    instructions: "",
  });
  const [payment, setPayment] = useState({
    name: "",
    methodType: "cash" as PaymentMethodRow["method_type"],
    bankName: "",
    accountHolder: "",
    accountType: "",
    accountLast4: "",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const data =
      current.businessData &&
      typeof current.businessData === "object" &&
      !Array.isArray(current.businessData)
        ? current.businessData
        : {};
    setCompany({
      name: current.name,
      slug: current.slug,
      timezone: current.timezone,
      tradeName: String(data["trade_name"] ?? ""),
      address: String(data["address"] ?? ""),
    });
  }, [current]);
  async function loadTeam() {
    try {
      setMembers(await org.listMembers());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar el equipo.");
    }
  }
  async function loadCommerce() {
    try {
      const data = await listCommerceSettings(current.id);
      setShipping(data.shipping);
      setPayments(data.payment);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No fue posible cargar la configuración comercial.",
      );
    }
  }
  useEffect(() => {
    if (!current.id) return;
    if (section === "team") void loadTeam();
    if (section === "commerce") void loadCommerce();
  }, [section, current.id]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("create") === "organization") {
      setSection("companies");
      setModal("company");
    }
    if (query.get("create") === "invite") {
      setSection("team");
      setModal("invite");
    }
  }, []);
  async function run(action: () => Promise<void>) {
    setSaving(true);
    try {
      await action();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No fue posible completar la operación.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <AppShell title="Configuración" subtitle={`Administración segura de ${current.name}`}>
      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        <aside className="panel h-fit p-2">
          {(
            [
              ["companies", "Empresas", Building2],
              ["team", "Equipo y roles", Users],
              ["commerce", "Envíos y pagos", CreditCard],
              ["integrations", "Integraciones", ShieldCheck],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${section === id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </aside>
        <main className="space-y-5">
          {section === "companies" && (
            <>
              <section className="panel p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Empresa activa</h2>
                    <p className="text-xs text-muted-foreground">
                      Estos datos son independientes por organización.
                    </p>
                  </div>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs text-success">
                    <CheckCircle2 className="mr-1 inline size-4" />
                    Activa
                  </span>
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                      await org.updateOrganization({
                        name: company.name,
                        slug: company.slug,
                        timezone: company.timezone,
                        businessData: { trade_name: company.tradeName, address: company.address },
                      });
                      toast.success("Empresa actualizada.");
                    });
                  }}
                  className="mt-5 grid gap-4 sm:grid-cols-2"
                >
                  <Field label="Nombre">
                    <input
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </Field>
                  <Field label="Slug">
                    <input
                      value={company.slug}
                      onChange={(e) => setCompany({ ...company, slug: e.target.value })}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      className={inputClass}
                      required
                    />
                  </Field>
                  <Field label="Zona horaria">
                    <input
                      value={company.timezone}
                      onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </Field>
                  <Field label="Nombre comercial">
                    <input
                      value={company.tradeName}
                      onChange={(e) => setCompany({ ...company, tradeName: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Dirección">
                    <input
                      value={company.address}
                      onChange={(e) => setCompany({ ...company, address: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <div className="flex items-end justify-end">
                    <button
                      disabled={saving || current.roleCode !== "admin"}
                      className={submitClass}
                    >
                      Guardar empresa
                    </button>
                  </div>
                </form>
              </section>
              <section className="panel p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Espacios de trabajo</h2>
                    <p className="text-xs text-muted-foreground">
                      Cambiar de empresa recarga todos los módulos.
                    </p>
                  </div>
                  <button onClick={() => setModal("company")} className={submitClass}>
                    <Plus className="mr-2 size-4" />
                    Nueva empresa
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {org.organizations.map((item) => (
                    <button
                      onClick={() => org.switchOrganization(item.id)}
                      key={item.id}
                      className={`flex w-full items-center rounded-xl border p-4 text-left ${item.id === current.id ? "border-primary/40 bg-primary/5" : "border-border"}`}
                    >
                      <Building2 className="mr-3 size-5 text-primary" />
                      <span className="flex-1">
                        <strong className="block text-sm">{item.name}</strong>
                        <small className="text-muted-foreground">
                          /{item.slug} · {item.plan}
                        </small>
                      </span>
                      <span className="text-xs">{item.role}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          {section === "team" && (
            <section className="panel overflow-hidden">
              <header className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h2 className="font-semibold">Miembros del equipo</h2>
                  <p className="text-xs text-muted-foreground">
                    Los cambios de acceso quedan auditados.
                  </p>
                </div>
                {current.roleCode === "admin" && (
                  <button
                    onClick={() => {
                      setInviteLink("");
                      setModal("invite");
                    }}
                    className={submitClass}
                  >
                    <Plus className="mr-2 size-4" />
                    Invitar
                  </button>
                )}
              </header>
              {members.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  No hay miembros visibles.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    className="flex flex-wrap items-center gap-3 border-b border-border/60 p-4"
                    key={member.userId}
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-secondary text-xs">
                      {member.fullName.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-52 flex-1">
                      <p className="text-sm font-medium">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <select
                      value={member.role}
                      disabled={current.roleCode !== "admin"}
                      onChange={(event) =>
                        void run(async () => {
                          await org.setMemberAccess(
                            member.userId,
                            event.target.value as AppRole,
                            member.active,
                          );
                          await loadTeam();
                          toast.success("Rol actualizado.");
                        })
                      }
                      className={`${inputClass} w-44`}
                    >
                      {Object.entries(roles).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={current.roleCode !== "admin" || member.userId === user?.id}
                      onClick={() =>
                        void run(async () => {
                          await org.setMemberAccess(member.userId, member.role, !member.active);
                          await loadTeam();
                          toast.success("Acceso actualizado.");
                        })
                      }
                      className={`rounded-full px-3 py-2 text-xs ${member.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                    >
                      {member.active ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                ))
              )}
            </section>
          )}
          {section === "commerce" && (
            <>
              <section className="panel p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Transportistas</h2>
                    <p className="text-xs text-muted-foreground">
                      Provincias, tarifa y tiempo estimado.
                    </p>
                  </div>
                  <button onClick={() => setModal("shipping")} className={submitClass}>
                    <Plus className="mr-2 size-4" />
                    Agregar
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {shipping.map((item) => (
                    <article className="rounded-xl border border-border p-4" key={item.id}>
                      <PackageCheck className="size-5 text-primary" />
                      <h3 className="mt-2 font-semibold">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.provinces.join(", ") || "Todas las provincias"}
                      </p>
                      <p className="mt-2 text-sm">
                        RD${Number(item.fee).toLocaleString("es-DO")} ·{" "}
                        {item.estimated_time || "Tiempo por confirmar"}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="panel p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Métodos de pago</h2>
                    <p className="text-xs text-muted-foreground">
                      Solo se muestran los últimos cuatro dígitos.
                    </p>
                  </div>
                  <button onClick={() => setModal("payment")} className={submitClass}>
                    <Plus className="mr-2 size-4" />
                    Agregar
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {payments.map((item) => (
                    <article className="rounded-xl border border-border p-4" key={item.id}>
                      <CreditCard className="size-5 text-primary" />
                      <h3 className="mt-2 font-semibold">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.bank_name || "Pago directo"}
                        {item.account_last4 ? ` · •••• ${item.account_last4}` : ""}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
          {section === "integrations" && (
            <section className="grid gap-4 md:grid-cols-3">
              {(
                [
                  [MessageCircle, "Meta / WhatsApp", "Pendiente de credenciales"],
                  [ShieldCheck, "Inteligencia artificial", "Fuera de esta fase"],
                  [Building2, "N8N", "Se configurará después de los procesos internos"],
                ] satisfies ReadonlyArray<readonly [LucideIcon, string, string]>
              ).map(([Icon, title, detail]) => (
                <article className="panel p-5" key={String(title)}>
                  <Icon className="size-5 text-warning" />
                  <h2 className="mt-3 font-semibold">{String(title)}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{String(detail)}</p>
                  <span className="mt-4 inline-block rounded-full bg-warning/10 px-3 py-1 text-xs text-warning">
                    Pendiente
                  </span>
                </article>
              ))}
            </section>
          )}
        </main>
      </div>
      <FormModal open={modal === "company"} title="Nueva empresa" onClose={() => setModal(null)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await org.createOrganization(newCompany.name, newCompany.timezone);
              setModal(null);
              setNewCompany({ name: "", timezone: "America/Santo_Domingo" });
              toast.success("Empresa creada.");
            });
          }}
          className="space-y-4"
        >
          <Field label="Nombre">
            <input
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
              minLength={2}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Zona horaria">
            <input
              value={newCompany.timezone}
              onChange={(e) => setNewCompany({ ...newCompany, timezone: e.target.value })}
              className={inputClass}
              required
            />
          </Field>
          <div className="flex justify-end">
            <button disabled={saving} className={submitClass}>
              Crear empresa
            </button>
          </div>
        </form>
      </FormModal>
      <FormModal
        open={modal === "invite"}
        title="Invitar usuario"
        description="Comparte el enlace generado con la persona invitada."
        onClose={() => setModal(null)}
      >
        {inviteLink ? (
          <div className="space-y-4">
            <div className="break-all rounded-lg border border-border bg-muted p-3 text-xs">
              {inviteLink}
            </div>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(inviteLink);
                toast.success("Enlace copiado.");
              }}
              className={submitClass}
            >
              <Copy className="mr-2 size-4" />
              Copiar enlace
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const link = await org.inviteMember(invite.email, invite.role);
                setInviteLink(link);
                toast.success("Invitación creada.");
              });
            }}
            className="space-y-4"
          >
            <Field label="Correo">
              <input
                type="email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Rol">
              <select
                value={invite.role}
                onChange={(e) => setInvite({ ...invite, role: e.target.value as AppRole })}
                className={inputClass}
              >
                {Object.entries(roles).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end">
              <button disabled={saving} className={submitClass}>
                Generar invitación
              </button>
            </div>
          </form>
        )}
      </FormModal>
      <FormModal
        open={modal === "shipping"}
        title="Nuevo transportista"
        onClose={() => setModal(null)}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await saveShippingMethod(current.id, user!.id, ship);
              await loadCommerce();
              setModal(null);
              toast.success("Transportista guardado.");
            });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Nombre">
            <input
              value={ship.name}
              onChange={(e) => setShip({ ...ship, name: e.target.value })}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Tarifa">
            <input
              type="number"
              min="0"
              value={ship.fee}
              onChange={(e) => setShip({ ...ship, fee: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Provincias separadas por coma">
            <input
              value={ship.provinces}
              onChange={(e) => setShip({ ...ship, provinces: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Tiempo estimado">
            <input
              value={ship.estimatedTime}
              onChange={(e) => setShip({ ...ship, estimatedTime: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Instrucciones">
              <textarea
                value={ship.instructions}
                onChange={(e) => setShip({ ...ship, instructions: e.target.value })}
                className={textareaClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={saving} className={submitClass}>
              Guardar
            </button>
          </div>
        </form>
      </FormModal>
      <FormModal
        open={modal === "payment"}
        title="Nuevo método de pago"
        description="No guardes el número completo; registra únicamente los últimos cuatro dígitos."
        onClose={() => setModal(null)}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await savePaymentMethod(current.id, user!.id, payment);
              await loadCommerce();
              setModal(null);
              toast.success("Método de pago guardado.");
            });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Nombre">
            <input
              value={payment.name}
              onChange={(e) => setPayment({ ...payment, name: e.target.value })}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Tipo">
            <select
              value={payment.methodType}
              onChange={(e) =>
                setPayment({
                  ...payment,
                  methodType: e.target.value as PaymentMethodRow["method_type"],
                })
              }
              className={inputClass}
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="other">Otro</option>
            </select>
          </Field>
          <Field label="Banco">
            <input
              value={payment.bankName}
              onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Titular">
            <input
              value={payment.accountHolder}
              onChange={(e) => setPayment({ ...payment, accountHolder: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Tipo de cuenta">
            <input
              value={payment.accountType}
              onChange={(e) => setPayment({ ...payment, accountType: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Últimos 4 dígitos">
            <input
              value={payment.accountLast4}
              onChange={(e) =>
                setPayment({
                  ...payment,
                  accountLast4: e.target.value.replace(/\D/g, "").slice(0, 4),
                })
              }
              pattern="[0-9]{4}"
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={saving} className={submitClass}>
              Guardar
            </button>
          </div>
        </form>
      </FormModal>
    </AppShell>
  );
}
