import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useApi, fmtDate } from "../lib/useApi";
import type { Cook } from "../lib/types";
import { PageHeader, Card, Table, Pill, Loading, ErrorNote, Btn } from "../components/ui";

const COOK_ACTIONS = ["ACTIVE", "SUSPENDED", "REJECTED", "PENDING_REVIEW"];

export default function CookDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useApi<Cook>(`/cooks/${id}`);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function setStatus(status: string) {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/cooks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function reviewDoc(docId: string, status: "VERIFIED" | "REJECTED") {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/cooks/${id}/documents/${docId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title={data ? data.name : "Cook"}>
        <Link to="/cooks" className="text-sm text-flame underline">
          ← all cooks
        </Link>
      </PageHeader>

      {loading && <Loading />}
      {error && <ErrorNote error={error} onRetry={reload} />}
      {msg && <ErrorNote error={msg} />}

      {data && (
        <div className="space-y-6">
          <Card title="Profile">
            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <Row k="Status" v={<Pill value={data.status} />} />
              <Row k="Phone" v={data.phone ?? "guest"} />
              <Row k="Languages" v={data.languages.join(", ") || "—"} />
              <Row k="Experience" v={`${data.experienceYrs} yr`} />
              <Row k="Rating" v={data.ratingCount ? `${data.ratingAvg.toFixed(1)} (${data.ratingCount})` : "—"} />
              <Row k="Joined" v={fmtDate(data.createdAt)} />
              {data.bio && <Row k="Bio" v={data.bio} />}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {COOK_ACTIONS.filter((s) => s !== data.status).map((s) => (
                <Btn
                  key={s}
                  disabled={busy}
                  variant={s === "REJECTED" || s === "SUSPENDED" ? "danger" : s === "ACTIVE" ? "primary" : "default"}
                  onClick={() => setStatus(s)}
                >
                  → {s.replace(/_/g, " ").toLowerCase()}
                </Btn>
              ))}
            </div>
          </Card>

          <Card title="KYC documents">
            {data.documents && data.documents.length > 0 ? (
              <Table head={["Type", "Status", "Uploaded", "File", ""]}>
                {data.documents.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-medium">{d.type}</td>
                    <td className="px-3 py-2">
                      <Pill value={d.status} />
                    </td>
                    <td className="px-3 py-2 text-char-soft">{fmtDate(d.createdAt)}</td>
                    <td className="px-3 py-2">
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-flame underline">
                        open
                      </a>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {d.status === "UPLOADED" && (
                        <span className="flex justify-end gap-2">
                          <Btn disabled={busy} variant="primary" onClick={() => reviewDoc(d.id, "VERIFIED")}>
                            verify
                          </Btn>
                          <Btn disabled={busy} variant="danger" onClick={() => reviewDoc(d.id, "REJECTED")}>
                            reject
                          </Btn>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-sm text-char-soft">No documents uploaded.</p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-char-soft">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
