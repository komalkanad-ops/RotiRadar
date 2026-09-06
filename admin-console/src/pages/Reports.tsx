import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useApi, fmtDate } from "../lib/useApi";
import type { Report } from "../lib/types";
import { PageHeader, Card, Pill, Loading, ErrorNote, Btn } from "../components/ui";

const STATUSES = ["OPEN", "UNDER_REVIEW", "ACTIONED", "DISMISSED"];
const KINDS = [
  { value: "", label: "All reports" },
  { value: "feedback", label: "Bug reports & ideas" },
  { value: "safety", label: "Safety" },
];

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "OPEN";
  const kind = params.get("category") ?? "";
  const query = new URLSearchParams({ status, ...(kind ? { category: kind } : {}) }).toString();
  const { data, error, loading, reload } = useApi<Report[]>(`/admin/reports?${query}`);
  const [busy, setBusy] = useState<string | null>(null);

  function setFilter(next: { status?: string; category?: string }) {
    const merged = { status, category: kind, ...next };
    setParams(merged.category ? merged : { status: merged.status });
  }

  async function act(id: string, next: string, actionTaken?: string) {
    setBusy(id);
    try {
      await api(`/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next, ...(actionTaken ? { actionTaken } : {}) }),
      });
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Reports">
        <select
          value={kind}
          onChange={(e) => setFilter({ category: e.target.value })}
          className="rounded-lg border border-char/25 bg-atta px-2 py-1.5 text-sm"
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setFilter({ status: e.target.value })}
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
        {data?.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold">{r.category}</span>
                  <Pill value={r.status} />
                </div>
                <p className="mt-1 max-w-2xl whitespace-pre-wrap text-sm">{r.detail}</p>
                <p className="mt-1 text-xs text-char-soft">
                  {fmtDate(r.createdAt)}
                  {r.bookingId && (
                    <>
                      {" · "}
                      <Link to={`/bookings/${r.bookingId}`} className="text-flame underline">
                        booking
                      </Link>
                    </>
                  )}
                  {r.attachmentUrl && (
                    <>
                      {" · "}
                      <a href={r.attachmentUrl} target="_blank" rel="noreferrer" className="text-flame underline">
                        attachment
                      </a>
                    </>
                  )}
                </p>
                {r.actionTaken && <p className="mt-1 text-xs text-chutney">Action: {r.actionTaken}</p>}
                <AppContext raw={r.appContext} />
              </div>
              {(r.status === "OPEN" || r.status === "UNDER_REVIEW") && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  {r.status === "OPEN" && (
                    <Btn disabled={busy === r.id} onClick={() => act(r.id, "UNDER_REVIEW")}>
                      review
                    </Btn>
                  )}
                  <Btn
                    disabled={busy === r.id}
                    variant="primary"
                    onClick={() => {
                      const a = prompt("Action taken?");
                      if (a) act(r.id, "ACTIONED", a);
                    }}
                  >
                    action
                  </Btn>
                  <Btn disabled={busy === r.id} onClick={() => act(r.id, "DISMISSED")}>
                    dismiss
                  </Btn>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/** Renders the JSON diagnostic context attached to an in-app bug report / suggestion. */
function AppContext({ raw }: { raw: string | null }) {
  if (!raw) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return <pre className="mt-2 overflow-x-auto rounded bg-char/5 p-2 text-[11px] text-char-soft">{raw}</pre>;
  }
  const entries = Object.entries(parsed).filter(([, v]) => v !== null && v !== "");
  if (entries.length === 0) return null;
  return (
    <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 rounded bg-char/5 p-2 text-[11px]">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-char-soft">{k}</dt>
          <dd className="font-mono break-all">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
