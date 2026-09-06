import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./lib/api";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cooks from "./pages/Cooks";
import CookDetail from "./pages/CookDetail";
import Bookings from "./pages/Bookings";
import BookingDetail from "./pages/BookingDetail";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Reports from "./pages/Reports";
import Disputes from "./pages/Disputes";
import Config from "./pages/Config";
import Admins from "./pages/Admins";

function RequireAuth({ children }: { children: ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/cooks" element={<Cooks />} />
        <Route path="/cooks/:id" element={<CookDetail />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/disputes" element={<Disputes />} />
        <Route path="/config" element={<Config />} />
        <Route path="/admins" element={<Admins />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
