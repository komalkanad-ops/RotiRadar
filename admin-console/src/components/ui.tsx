import type { ReactNode } from "react";

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
