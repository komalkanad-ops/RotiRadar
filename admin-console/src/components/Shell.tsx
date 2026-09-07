import { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { clearToken } from "../lib/api";
import { claims, isSuperAdmin } from "../lib/session";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/cooks", label: "Cooks & KYC", icon: ChefHat },
  { to: "/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/users", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: ShieldAlert },
  { to: "/disputes", label: "Disputes", icon: Scale },
  { to: "/config", label: "Configuration", icon: SlidersHorizontal },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
    isActive ? "bg-roti/20 font-medium text-char" : "text-char-soft hover:bg-char/5"
  }`;

export default function Shell() {
  const nav = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const me = claims();

  function signOut() {
    clearToken();
    nav("/login", { replace: true });
  }

  const navList = (onNavigate?: () => void) => (
    <nav className="mt-6 flex flex-1 flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={linkClass} onClick={onNavigate}>
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
      {isSuperAdmin() && (
        <NavLink to="/admins" className={linkClass} onClick={onNavigate}>
          <UserCog size={16} />
          Admins
        </NavLink>
      )}
    </nav>
  );

  const brand = (
    <div>
      <div className="px-2 font-display text-lg font-semibold">RotiRadar</div>
      <div className="px-2 text-xs text-char-soft">Operations</div>
    </div>
  );

  const signOutBtn = (
    <button
      onClick={signOut}
      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-char-soft hover:bg-char/5"
    >
      <LogOut size={16} />
      Sign out
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-char/15 bg-atta-deep/40 px-3 py-4 md:flex">
        {brand}
        {navList()}
        {signOutBtn}
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-char/15 bg-atta-deep/40 px-4 py-3 md:hidden">
        {brand}
        <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="text-char-soft">
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-char/40" />
          <div
            className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-char/15 bg-atta px-3 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              {brand}
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-char-soft">
                <X size={20} />
              </button>
            </div>
            {navList(() => setDrawerOpen(false))}
            {signOutBtn}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden px-5 py-6 md:px-8 md:py-8">
        {me && (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2 text-xs text-char-soft">
            <span className="font-medium text-char">{me.email ?? me.sub}</span>
            {me.adminRole && (
              <span className="rounded-full bg-char/10 px-2 py-0.5">
                {me.adminRole.replace(/_/g, " ").toLowerCase()}
              </span>
            )}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
