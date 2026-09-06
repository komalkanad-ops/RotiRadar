import { useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { useApi, fmtDate } from "../lib/useApi";
import { isSuperAdmin } from "../lib/session";
import type { Admin } from "../lib/types";
import { PageHeader, Card, Table, Pill, Loading, ErrorNote, Btn } from "../components/ui";

const ROLES = ["SUPER_ADMIN", "SUPPORT_AGENT", "CITY_MANAGER"];

export default function Admins() {
  const { data, error, loading, reload } = useApi<Admin[]>("/admin/admins");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // create form
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SUPPORT_AGENT");

  if (!isSuperAdmin()) return <Navigate to="/" replace />;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMsg(null);
    try {
      await api("/admin/admins", { method: "POST", body: JSON.stringify({ email, name, password, role }) });
      setEmail("");
      setName("");
      setPassword("");
      setRole("SUPPORT_AGENT");
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function update(id: string, body: { role: string; active?: boolean }) {
    setBusy(id);
    setMsg(null);
    try {
      await api(`/admin/admins/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Admins" />
      {msg && <ErrorNote error={msg} />}

      <div className="space-y-6">
        <Card title="Add an admin">
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-char/25 bg-atta px-3 py-1.5 text-sm"
            />
            <input
              required
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-char/25 bg-atta px-3 py-1.5 text-sm"
            />
            <input
              required
              type="password"
              placeholder="password (min 8)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-char/25 bg-atta px-3 py-1.5 text-sm"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-char/25 bg-atta px-3 py-1.5 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
            <div>
              <Btn type="submit" variant="primary" disabled={busy === "create"}>
                {busy === "create" ? "Adding…" : "Add admin"}
              </Btn>
            </div>
          </form>
        </Card>

        {loading && <Loading />}
        {error && <ErrorNote error={error} onRetry={reload} />}

        {data && (
          <Table head={["Email", "Name", "Role", "Active", "Last login", ""]}>
            {data.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2 font-medium">{a.email}</td>
                <td className="px-3 py-2">{a.name}</td>
                <td className="px-3 py-2">
                  <select
                    value={a.role}
                    disabled={busy === a.id}
                    onChange={(e) => update(a.id, { role: e.target.value, active: a.active })}
                    className="rounded border border-char/25 bg-atta px-2 py-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, " ").toLowerCase()}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <Pill value={a.active ? "ACTIVE" : "SUSPENDED"} />
                </td>
                <td className="px-3 py-2 text-char-soft">{fmtDate(a.lastLoginAt)}</td>
                <td className="px-3 py-2 text-right">
                  <Btn
                    disabled={busy === a.id}
                    variant={a.active ? "danger" : "default"}
                    onClick={() => update(a.id, { role: a.role, active: !a.active })}
                  >
                    {a.active ? "deactivate" : "reactivate"}
                  </Btn>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </>
  );
}
