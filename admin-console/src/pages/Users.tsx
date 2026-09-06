import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useApi, fmtDate } from "../lib/useApi";
import type { User } from "../lib/types";
import { PageHeader, Table, Loading, ErrorNote } from "../components/ui";

export default function Users() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [input, setInput] = useState(q);
  const { data, error, loading, reload } = useApi<User[]>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);

  return (
    <>
      <PageHeader title="Customers">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParams(input ? { q: input } : {});
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="phone or name"
            className="rounded-lg border border-char/25 bg-atta px-3 py-1.5 text-sm"
          />
        </form>
      </PageHeader>

      {loading && <Loading />}
      {error && <ErrorNote error={error} onRetry={reload} />}
      {data && (
        <Table head={["Name", "Phone", "Email", "Via", "Joined", ""]}>
          {data.map((u) => (
            <tr key={u.id} className="hover:bg-char/5">
              <td className="px-3 py-2 font-medium">{u.name ?? "—"}</td>
              <td className="px-3 py-2 text-char-soft">{u.phone ?? "guest"}</td>
              <td className="px-3 py-2 text-char-soft">{u.email ?? "—"}</td>
              <td className="px-3 py-2 text-char-soft">{u.authProvider}</td>
              <td className="px-3 py-2 text-char-soft">{fmtDate(u.createdAt)}</td>
              <td className="px-3 py-2 text-right">
                <Link to={`/users/${u.id}`} className="text-flame underline">
                  open
                </Link>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-char-soft">
                No customers.
              </td>
            </tr>
          )}
        </Table>
      )}
    </>
  );
}
