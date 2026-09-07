import { useEffect, useRef, useState, type ReactNode } from "react";
import { Inbox, X } from "lucide-react";
import { csvDownload } from "../lib/csv";

export { csvDownload };
export type { CsvColumn } from "../lib/csv";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-char/15 bg-white/40">
      {title && <div className="border-b border-char/10 px-4 py-2.5 font-display text-sm font-semibold">{title}</div>}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-char/15 bg-white/40 p-4">
      <div className="text-xs uppercase tracking-wide text-char-soft">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

const PILL: Record<string, string> = {
  // booking
  PENDING: "bg-roti/15 text-roti-deep",
  ACCEPTED: "bg-flame/15 text-flame",
  ON_THE_WAY: "bg-flame/15 text-flame",
  IN_PROGRESS: "bg-flame/15 text-flame",
  COMPLETED: "bg-chutney/15 text-chutney",
  CANCELLED: "bg-clay/15 text-clay",
  // cook / doc
  PENDING_REVIEW: "bg-roti/15 text-roti-deep",
  ACTIVE: "bg-chutney/15 text-chutney",
  SUSPENDED: "bg-clay/15 text-clay",
  REJECTED: "bg-clay/15 text-clay",
  UPLOADED: "bg-roti/15 text-roti-deep",
  VERIFIED: "bg-chutney/15 text-chutney",
  // txn
  CREATED: "bg-roti/15 text-roti-deep",
  PAID: "bg-chutney/15 text-chutney",
  FAILED: "bg-clay/15 text-clay",
  REFUNDED: "bg-flame/15 text-flame",
  // report / dispute
  OPEN: "bg-roti/15 text-roti-deep",
  UNDER_REVIEW: "bg-flame/15 text-flame",
  ACTIONED: "bg-chutney/15 text-chutney",
  DISMISSED: "bg-char/10 text-char-soft",
  RESOLVED: "bg-chutney/15 text-chutney",
};

export function Pill({ value }: { value: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PILL[value] ?? "bg-char/10 text-char-soft"}`}>
      {value.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function Loading() {
  return <p className="py-8 text-center text-sm text-char-soft">Loading…</p>;
}

export function ErrorNote({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-clay/30 bg-clay/5 p-4 text-sm text-clay">
      {error}
      {onRetry && (
        <button onClick={onRetry} className="ml-3 underline">
          retry
        </button>
      )}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-char/15">
      <table className="w-full text-sm">
        <thead className="bg-atta-deep/60 text-left text-xs uppercase tracking-wide text-char-soft">
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-char/10">{children}</tbody>
      </table>
    </div>
  );
}

// ─── Loading skeletons ────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-char/10 ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-char/15">
      <div className="flex gap-3 border-b border-char/10 bg-atta-deep/60 px-3 py-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-char/10">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3 px-3 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────────

export function Empty({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-char/25 px-6 py-12 text-center">
      <span className="text-char-soft/60">{icon ?? <Inbox size={28} strokeWidth={1.5} />}</span>
      <p className="font-display font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-char-soft">{hint}</p>}
    </div>
  );
}

/** Kept for any older callers; forwards to {@link Empty}. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return <Empty title={title} hint={hint} />;
}

// ─── Modal + prompt ───────────────────────────────────────────────────────────────

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-char/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-char/15 bg-atta p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-char-soft hover:text-char">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PromptModal({
  open,
  title,
  label,
  placeholder,
  confirmText = "Submit",
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  confirmText?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setValue("");
      setTimeout(() => ref.current?.focus(), 0);
    }
  }, [open]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = value.trim();
          if (!v) return;
          onSubmit(v);
          onClose();
        }}
      >
        {label && <label className="mb-1 block text-sm text-char-soft">{label}</label>}
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-char/25 bg-white/60 px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn type="submit" variant="primary" disabled={!value.trim()}>
            {confirmText}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Toast (module-level event bus) ───────────────────────────────────────────────

export type ToastTone = "info" | "error" | "success";
type ToastItem = { id: number; message: string; tone: ToastTone };

let toastSeq = 0;
const toastListeners = new Set<(t: ToastItem) => void>();

/** Fire a transient top-right notice from anywhere (no context/provider needed). */
export function showToast(message: string, tone: ToastTone = "info") {
  const item = { id: ++toastSeq, message, tone };
  toastListeners.forEach((l) => l(item));
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const listener = (t: ToastItem) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="fixed right-4 top-4 z-[60] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border px-3 py-2 text-sm shadow-lg ${
            t.tone === "error"
              ? "border-clay/30 bg-clay/10 text-clay"
              : t.tone === "success"
                ? "border-chutney/30 bg-chutney/10 text-chutney"
                : "border-char/20 bg-atta text-char"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "default",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles =
    variant === "primary"
      ? "bg-roti text-char hover:bg-roti-deep hover:text-atta"
      : variant === "danger"
        ? "border border-clay/40 text-clay hover:bg-clay/10"
        : "border border-char/25 hover:border-char/60";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-lg px-3 py-1.5 text-sm ${styles} disabled:opacity-50`}>
      {children}
    </button>
  );
}
