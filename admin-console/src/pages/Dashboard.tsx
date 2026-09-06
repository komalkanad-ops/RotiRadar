import { useApi, fmtPaise } from "../lib/useApi";
import type { Stats } from "../lib/types";
import { PageHeader, Stat, Card, Loading, ErrorNote, Pill } from "../components/ui";

export default function Dashboard() {
  const { data, error, loading, reload } = useApi<Stats>("/admin/stats");

  return (
    <>
      <PageHeader title="Dashboard" />
      {loading && <Loading />}
      {error && <ErrorNote error={error} onRetry={reload} />}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Customers" value={data.users} />
            <Stat label="Active cooks" value={data.cooks.ACTIVE ?? 0} />
            <Stat label="Pending KYC docs" value={data.pendingKycDocuments} />
            <Stat label="Gross collected" value={fmtPaise(data.grossPaidPaise)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Cooks by status">
              <StatusRows counts={data.cooks} />
            </Card>
            <Card title="Bookings by status">
              <StatusRows counts={data.bookings} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function StatusRows({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return <p className="text-sm text-char-soft">None yet.</p>;
  return (
    <div className="space-y-2">
      {entries.map(([status, n]) => (
        <div key={status} className="flex items-center justify-between">
          <Pill value={status} />
          <span className="font-display font-semibold">{n}</span>
        </div>
      ))}
    </div>
  );
}
