import { useParams, Link } from "react-router-dom";
import { useApi, fmtDate, fmtPaise } from "../lib/useApi";
import type { Booking, Message } from "../lib/types";
import { PageHeader, Card, Table, Pill, Loading, ErrorNote } from "../components/ui";

export default function BookingDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useApi<Booking>(`/admin/bookings/${id}`);
  const chat = useApi<Message[]>(`/admin/bookings/${id}/chat`);

  return (
    <>
      <PageHeader title="Booking">
        <Link to="/bookings" className="text-sm text-flame underline">
          ← all bookings
        </Link>
      </PageHeader>

      {loading && <Loading />}
      {error && <ErrorNote error={error} onRetry={reload} />}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Booking">
              <dl className="grid gap-y-2 text-sm">
                <Row k="Status" v={<Pill value={data.status} />} />
                <Row k="Tier" v={data.tier.replace(/_/g, " ").toLowerCase()} />
                <Row k="Slot" v={`${fmtDate(data.startAt)} · ${data.durationMinutes} min`} />
                <Row k="Created" v={fmtDate(data.createdAt)} />
                {data.cancelledBy && <Row k="Cancelled by" v={`${data.cancelledBy} — ${data.cancelReason ?? ""}`} />}
              </dl>
            </Card>
            <Card title="Money">
              <dl className="grid gap-y-2 text-sm">
                <Row k="Service" v={fmtPaise(data.servicePaise)} />
                <Row k="Platform fee" v={fmtPaise(data.platformFeePaise)} />
                <Row k="Tax" v={fmtPaise(data.taxPaise)} />
                <Row k="Total" v={<strong>{fmtPaise(data.totalPaise)}</strong>} />
                {data.cancellationFeePaise > 0 && <Row k="Cancellation fee" v={fmtPaise(data.cancellationFeePaise)} />}
              </dl>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Customer">
              {data.customer ? (
                <dl className="grid gap-y-2 text-sm">
                  <Row k="Name" v={data.customer.name ?? "—"} />
                  <Row k="Phone" v={data.customer.phone ?? "guest"} />
                  <Row k="Email" v={data.customer.email ?? "—"} />
                  <Row k="Address" v={data.address ? `${data.address.line1}, ${data.address.city} ${data.address.pincode}` : "—"} />
                </dl>
              ) : (
                <p className="text-sm text-char-soft">—</p>
              )}
            </Card>
            <Card title="Cook">
              {data.cook ? (
                <dl className="grid gap-y-2 text-sm">
                  <Row k="Name" v={data.cook.name} />
                  <Row k="Phone" v={data.cook.phone ?? "guest"} />
                  <Row k="Status" v={<Pill value={data.cook.status} />} />
                </dl>
              ) : (
                <p className="text-sm text-char-soft">Not assigned.</p>
              )}
            </Card>
          </div>

          <Card title="Status history">
            {data.statusEvents && data.statusEvents.length > 0 ? (
              <ol className="space-y-1.5 text-sm">
                {data.statusEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-char-soft">{fmtDate(e.createdAt)}</span>
                    <Pill value={e.status} />
                    {e.note && <span className="text-char-soft">— {e.note}</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-char-soft">No events.</p>
            )}
          </Card>

          <Card title="Transactions">
            {data.transactions && data.transactions.length > 0 ? (
              <Table head={["When", "Amount", "Status", "Order", "Payment"]}>
                {data.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 text-char-soft">{fmtDate(t.createdAt)}</td>
                    <td className="px-3 py-2">{fmtPaise(t.amountPaise)}</td>
                    <td className="px-3 py-2">
                      <Pill value={t.status} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-char-soft">{t.providerOrderId ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-char-soft">{t.providerPaymentId ?? "—"}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-sm text-char-soft">No transactions.</p>
            )}
          </Card>

          <Card title="Chat transcript (admin review)">
            {chat.loading && <Loading />}
            {chat.error && <ErrorNote error={chat.error} onRetry={chat.reload} />}
            {chat.data && chat.data.length === 0 && <p className="text-sm text-char-soft">No messages.</p>}
            {chat.data && chat.data.length > 0 && (
              <div className="space-y-2">
                {chat.data.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.senderRole === "CUSTOMER" ? "bg-flame/10" : "ml-auto bg-roti/10"
                    }`}
                  >
                    <div className="mb-0.5 text-xs text-char-soft">
                      {m.senderRole.toLowerCase()} · {fmtDate(m.createdAt)}
                    </div>
                    {m.body}
                    {m.imageUrl && (
                      <a href={m.imageUrl} target="_blank" rel="noreferrer" className="mt-1 block text-flame underline">
                        [image]
                      </a>
                    )}
                  </div>
                ))}
              </div>
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
