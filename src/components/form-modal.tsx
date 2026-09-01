import { X } from "lucide-react";
import type { ReactNode } from "react";

export function FormModal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button className="fixed inset-0 cursor-default" onClick={onClose} aria-label="Cerrar" />
      <section className="relative z-10 my-6 w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
        <h2 className="pr-10 text-xl font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-2">{children}</div>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
export const textareaClass =
  "min-h-24 w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
export const submitClass =
  "inline-flex h-11 items-center justify-center rounded-lg bg-brand-gradient px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50";

export function LoadingState() {
  return (
    <div className="panel grid min-h-44 place-items-center">
      <span className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel px-6 py-14 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
