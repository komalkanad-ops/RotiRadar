import { useParams, Link } from "react-router-dom";
import { useApi, fmtDate, fmtPaise } from "../lib/useApi";
import type { User } from "../lib/types";
import { PageHeader, Card, Table, Pill, Loading, ErrorNote } from "../components/ui";

export default function UserDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useApi<User>(`/admin/users/${id}`);

  return (
    <>
      <PageHeader title={data?.name ?? "Customer"}>
        <Link to="/users" className="text-sm text-flame underline">
          ← all customers
        </Link>
      </PageHeader>

      {loading && <Loading />}
      {error && <ErrorNote error={error} onRetry={reload} />}

      {data && (
        <div className="space-y-6">
          <Card title="Profile">
            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <Row k="Phone" v={data.phone ?? "guest"} />
              <Row k="Email" v={data.email ?? "—"} />
              <Row k="Signed up via" v={data.authProvider} />
              <Row k="Joined" v={fmtDate(data.createdAt)} />
            </dl>
          </Card>

          <Card title="Addresses">
            {data.addresses && data.addresses.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {data.addresses.map((a) => (
                  <li key={a.id}>
                    <span className="font-medium">{a.label}</span> — {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city} {a.pincode}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-char-soft">None.</p>
            )}
          </Card>

          <Card title="Bookings">
            {data.bookings && data.bookings.length > 0 ? (
              <Table head={["Slot", "Tier", "Status", "Total", ""]}>
                {data.bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2">{fmtDate(b.startAt)}</td>
                    <td className="px-3 py-2">{b.tier.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="px-3 py-2">
                      <Pill value={b.status} />
                    </td>
                    <td className="px-3 py-2">{fmtPaise(b.totalPaise)}</td>
                    <td className="px-3 py-2 text-right">
                      <Link to={`/bookings/${b.id}`} className="text-flame underline">
                        open
                      </Link>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-sm text-char-soft">No bookings.</p>
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
      <dt className="w-32 shrink-0 text-char-soft">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
