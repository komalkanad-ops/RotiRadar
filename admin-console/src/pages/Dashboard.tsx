import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CalendarClock, MessageSquareWarning, Wallet, Settings } from "lucide-react";
import { clearToken } from "../lib/api";

// Scaffold shell. Phase 1 fills these sections in against the backend admin routes
// (see docs/architecture.md and the product outline §6).
const SECTIONS = [
  { icon: LayoutDashboard, label: "Overview", note: "bookings, active cooks/users, revenue, disputes" },
  { icon: Users, label: "Users & cooks", note: "search, profiles, KYC approval, suspend/ban" },
  { icon: CalendarClock, label: "Bookings", note: "filter by status, reassign, force-cancel, mark disputed" },
  { icon: MessageSquareWarning, label: "Reports & chats", note: "review reported conversations, act on abuse" },
  { icon: Wallet, label: "Payments & payouts", note: "transactions, refunds, cook payout runs" },
  { icon: Settings, label: "Configuration", note: "prices, commission, taxes, cancellation windows" },
];

export default function Dashboard() {
  const nav = useNavigate();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">RotiRadar Admin</h1>
        <button
          onClick={() => {
            clearToken();
            nav("/login", { replace: true });
          }}
          className="rounded-lg border border-char/25 px-3 py-1.5 text-sm hover:border-char/60"
        >
          Sign out
        </button>
      </div>

      <p className="mt-2 text-sm text-char-soft">
        Scaffold — no data yet. Sections below are wired up in Phase 1.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, label, note }) => (
          <div key={label} className="rounded-xl border border-char/15 p-5">
            <div className="flex items-center gap-2.5">
              <Icon size={18} className="text-flame" />
              <h2 className="font-display text-lg">{label}</h2>
            </div>
            <p className="mt-2 text-sm text-char-soft">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
