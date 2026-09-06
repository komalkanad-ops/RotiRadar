import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useApi, fmtDate } from "../lib/useApi";
import type { Report } from "../lib/types";
import { PageHeader, Card, Pill, Loading, ErrorNote, Btn } from "../components/ui";

const STATUSES = ["OPEN", "UNDER_REVIEW", "ACTIONED", "DISMISSED"];

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "OPEN";
  const { data, error, loading, reload } = useApi<Report[]>(`/admin/reports?status=${status}`);
  const [busy, setBusy] = useState<string | null>(null);

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
