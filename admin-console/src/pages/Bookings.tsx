import { useSearchParams, Link } from "react-router-dom";
import { useApi, fmtDate, fmtPaise } from "../lib/useApi";
import type { Booking } from "../lib/types";
import { PageHeader, Table, Pill, Loading, ErrorNote } from "../components/ui";

const STATUSES = ["PENDING", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function Bookings() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const { data, error, loading, reload } = useApi<Booking[]>(`/admin/bookings${status ? `?status=${status}` : ""}`);

  return (
    <>
      <PageHeader title="Bookings">
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
        <Table head={["Slot", "Tier", "Status", "Total", "Cook?", ""]}>
          {data.map((b) => (
            <tr key={b.id} className="hover:bg-char/5">
              <td className="px-3 py-2">{fmtDate(b.startAt)}</td>
              <td className="px-3 py-2">{b.tier.replace(/_/g, " ").toLowerCase()}</td>
              <td className="px-3 py-2">
                <Pill value={b.status} />
              </td>
              <td className="px-3 py-2">{fmtPaise(b.totalPaise)}</td>
              <td className="px-3 py-2 text-char-soft">{b.cookId ? "assigned" : "—"}</td>
              <td className="px-3 py-2 text-right">
                <Link to={`/bookings/${b.id}`} className="text-flame underline">
                  open
                </Link>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-char-soft">
                No bookings.
              </td>
            </tr>
          )}
        </Table>
      )}
    </>
  );
}
