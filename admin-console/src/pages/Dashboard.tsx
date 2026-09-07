import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApi, fmtPaise } from "../lib/useApi";
import type { Stats, TimeseriesPoint } from "../lib/types";
import { PageHeader, Stat, Card, Loading, ErrorNote, Pill, Skeleton } from "../components/ui";

// Brand palette (see web/tailwind.config.js). ink drives axes/text; grid sits at low opacity.
const INK = "#2A1B13";
const TERRACOTTA = "#BC401A";
const SAGE = "#3F6B4A";
const GRID = "rgba(42,27,19,0.10)";

// Booking status → a fixed colour, so the donut's identity never depends on slice order.
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#E4A11B",
  ACCEPTED: "#1C6DD0",
  ON_THE_WAY: "#5598E7",
  IN_PROGRESS: "#3987E5",
  COMPLETED: SAGE,
  CANCELLED: "#B0492B",
};

const axis = { stroke: INK, fontSize: 11, tickLine: false };
const rupeeTick = (v: number) => `₹${Math.round(v / 100).toLocaleString("en-IN")}`;
const dayTick = (d: string) => d.slice(5); // MM-DD

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

          <Trends bookings={data.bookings} />
        </div>
      )}
    </>
  );
}

function Trends({ bookings }: { bookings: Record<string, number> }) {
  const { data, error, loading, reload } = useApi<TimeseriesPoint[]>("/admin/stats/timeseries?days=30");

  const mix = Object.entries(bookings)
    .filter(([, n]) => n > 0)
    .map(([status, value]) => ({ status, value }));

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold">Trends · last 30 days</h2>

      {error && <ErrorNote error={error} onRetry={reload} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Bookings per day">
          {loading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="gBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TERRACOTTA} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={TERRACOTTA} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={dayTick} {...axis} interval="preserveStartEnd" minTickGap={24} />
                <YAxis allowDecimals={false} width={32} {...axis} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${GRID}` }}
                  labelStyle={{ color: INK }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  name="Bookings"
                  dataKey="bookings"
                  stroke={TERRACOTTA}
                  strokeWidth={2}
                  fill="url(#gBookings)"
                />
                <Area
                  type="monotone"
                  name="Completed"
                  dataKey="completed"
                  stroke={SAGE}
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Revenue per day">
          {loading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={dayTick} {...axis} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tickFormatter={rupeeTick} width={52} {...axis} />
                <Tooltip
                  cursor={{ fill: GRID }}
                  formatter={(v) => [fmtPaise(Number(v)), "Revenue"] as [string, string]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${GRID}` }}
                  labelStyle={{ color: INK }}
                />
                <Bar dataKey="revenuePaise" name="Revenue" fill={TERRACOTTA} radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card title="Booking mix (all time)">
        {mix.length === 0 ? (
          <p className="text-sm text-char-soft">No bookings yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={mix}
                dataKey="value"
                nameKey="status"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                label={(e: { name?: string; value?: number }) =>
                  `${String(e.name).replace(/_/g, " ").toLowerCase()} (${e.value})`
                }
                labelLine={false}
                fontSize={11}
              >
                {mix.map((m) => (
                  <Cell key={m.status} fill={STATUS_COLOR[m.status] ?? INK} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => v.replace(/_/g, " ").toLowerCase()} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${GRID}` }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>
    </section>
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
