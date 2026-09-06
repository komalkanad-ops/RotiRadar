import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ChefHat,
  CalendarClock,
  Users,
  ShieldAlert,
  Scale,
  SlidersHorizontal,
  UserCog,
  LogOut,
} from "lucide-react";
import { clearToken } from "../lib/api";
import { isSuperAdmin } from "../lib/session";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/cooks", label: "Cooks & KYC", icon: ChefHat },
  { to: "/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/users", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: ShieldAlert },
  { to: "/disputes", label: "Disputes", icon: Scale },
  { to: "/config", label: "Configuration", icon: SlidersHorizontal },
];

export default function Shell() {
  const nav = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-char/15 bg-atta-deep/40 px-3 py-4">
        <div className="px-2 font-display text-lg font-semibold">RotiRadar</div>
        <div className="px-2 text-xs text-char-soft">Operations</div>

        <nav className="mt-6 flex flex-1 flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                  isActive ? "bg-roti/20 font-medium text-char" : "text-char-soft hover:bg-char/5"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {isSuperAdmin() && (
            <NavLink
              to="/admins"
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                  isActive ? "bg-roti/20 font-medium text-char" : "text-char-soft hover:bg-char/5"
                }`
              }
            >
              <UserCog size={16} />
              Admins
            </NavLink>
          )}
        </nav>

        <button
          onClick={() => {
            clearToken();
            nav("/login", { replace: true });
          }}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-char-soft hover:bg-char/5"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      <main className="flex-1 overflow-x-hidden px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
