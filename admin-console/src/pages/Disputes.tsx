import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useApi, fmtDate, fmtPaise } from "../lib/useApi";
import type { Dispute } from "../lib/types";
import { PageHeader, Card, Pill, Loading, ErrorNote, Btn } from "../components/ui";

const STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

export default function Disputes() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "OPEN";
  const { data, error, loading, reload } = useApi<Dispute[]>(`/admin/disputes?status=${status}`);

  return (
    <>
      <PageHeader title="Disputes">
        <select
          value={status}
          onChange={(e) => setParams({ status: e.target.value })}
          className="rounded-lg border border-char/25 bg-atta px-2 py-1.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
      </PageHeader>

      {loading && <Loading />}
      {error && <ErrorNote error={error} onRetry={reload} />}
      {data && data.length === 0 && <p className="text-sm text-char-soft">Nothing here.</p>}

      <div className="space-y-3">
        {data?.map((d) => (
          <DisputeCard key={d.id} dispute={d} onChange={reload} />
        ))}
      </div>
    </>
  );
}

function DisputeCard({ dispute: d, onChange }: { dispute: Dispute; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState(d.resolution ?? "");
  const [refund, setRefund] = useState(String(d.refundPaise || ""));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const terminal = d.status === "RESOLVED" || d.status === "REJECTED";

  async function submit(next: "UNDER_REVIEW" | "RESOLVED" | "REJECTED") {
    setBusy(true);
    setErr(null);
    try {
      await api(`/admin/disputes/${d.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: next,
          ...(resolution.trim() ? { resolution: resolution.trim() } : {}),
          ...(refund ? { refundPaise: Number(refund) } : {}),
        }),
      });
      setOpen(false);
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Pill value={d.status} />
            <span className="text-xs text-char-soft">opened by {d.openedBy.toLowerCase()}</span>
          </div>
          <p className="mt-1 max-w-2xl whitespace-pre-wrap text-sm">{d.reason}</p>
          <p className="mt-1 text-xs text-char-soft">
            {fmtDate(d.createdAt)}
            {" · "}
            <Link to={`/bookings/${d.bookingId}`} className="text-flame underline">
              booking
            </Link>
            {d.resolvedAt && ` · resolved ${fmtDate(d.resolvedAt)}`}
          </p>
          {d.resolution && <p className="mt-1 text-xs text-chutney">Resolution: {d.resolution}</p>}
          {d.refundPaise > 0 && <p className="text-xs text-chutney">Refund: {fmtPaise(d.refundPaise)}</p>}
        </div>
        {!terminal && (
          <Btn onClick={() => setOpen((o) => !o)}>{open ? "cancel" : "handle"}</Btn>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-char/10 pt-4">
          <label className="block">
            <span className="text-sm font-medium">Resolution notes</span>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-char/25 bg-atta px-3 py-1.5 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Refund (paise)</span>
            <input
              inputMode="numeric"
              value={refund}
              onChange={(e) => setRefund(e.target.value.replace(/[^\d]/g, ""))}
              className="mt-1 block w-40 rounded-lg border border-char/25 bg-atta px-3 py-1.5 text-sm outline-none"
            />
          </label>
          {err && <ErrorNote error={err} />}
          <div className="flex flex-wrap gap-2">
            {d.status === "OPEN" && (
              <Btn disabled={busy} onClick={() => submit("UNDER_REVIEW")}>
                mark under review
              </Btn>
            )}
            <Btn disabled={busy} variant="primary" onClick={() => submit("RESOLVED")}>
              resolve
            </Btn>
            <Btn disabled={busy} variant="danger" onClick={() => submit("REJECTED")}>
              reject
            </Btn>
          </div>
        </div>
      )}
    </Card>
  );
}
