import { useSearchParams, Link } from "react-router-dom";
import { useApi, fmtDate } from "../lib/useApi";
import type { Cook } from "../lib/types";
import { PageHeader, Table, Pill, Loading, ErrorNote } from "../components/ui";

const STATUSES = ["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"];

export default function Cooks() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const { data, error, loading, reload } = useApi<Cook[]>(`/cooks${status ? `?status=${status}` : ""}`);

  return (
    <>
      <PageHeader title="Cooks & KYC">
        <select
          value={status}
          onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})}
          className="rounded-lg border border-char/25 bg-atta px-2 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
      </PageHeader>

      {loading && <Loading />}
      {error && <ErrorNote error={error} onRetry={reload} />}
      {data && (
        <Table head={["Name", "Phone", "Status", "Rating", "Joined", ""]}>
          {data.map((c) => (
            <tr key={c.id} className="hover:bg-char/5">
              <td className="px-3 py-2 font-medium">{c.name}</td>
              <td className="px-3 py-2 text-char-soft">{c.phone ?? "guest"}</td>
              <td className="px-3 py-2">
                <Pill value={c.status} />
              </td>
              <td className="px-3 py-2 text-char-soft">
                {c.ratingCount ? `${c.ratingAvg.toFixed(1)} (${c.ratingCount})` : "—"}
              </td>
              <td className="px-3 py-2 text-char-soft">{fmtDate(c.createdAt)}</td>
              <td className="px-3 py-2 text-right">
                <Link to={`/cooks/${c.id}`} className="text-flame underline">
                  review
                </Link>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-char-soft">
                No cooks.
              </td>
            </tr>
          )}
        </Table>
      )}
    </>
  );
}
