import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Phase 1: POST /auth/admin/login -> { token }
      const { token } = await api<{ token: string }>("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(token);
      nav("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <h1 className="text-2xl">RotiRadar Admin</h1>
        <p className="mt-1 text-sm text-char-soft">Operations &amp; moderation.</p>

        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-char/20 bg-atta px-3 py-2 outline-none focus:border-flame"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-char/20 bg-atta px-3 py-2 outline-none focus:border-flame"
          />
        </label>

        {error && <p className="mt-3 text-sm text-clay">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-roti px-4 py-2 font-display font-semibold text-char hover:bg-roti-deep hover:text-atta disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
