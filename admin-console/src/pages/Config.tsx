import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { PageHeader, Card, Loading, ErrorNote, Btn } from "../components/ui";

const LABELS: Record<string, string> = {
  cancellation_cutoff_minutes: "Free-cancellation window (minutes before slot)",
  cancellation_fee_paise: "Cancellation fee inside the window (paise)",
  platform_fee_percent: "Platform fee (%)",
  gst_percent: "GST (%)",
  scheduling_horizon_days: "How far ahead a slot can be booked (days)",
  default_service_radius_km: "Default cook service radius (km)",
  cook_commission_percent: "Cook commission taken by the platform (%)",
};

export default function Config() {
  const { data, error, loading, reload } = useApi<Record<string, string>>("/admin/config");
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const dirty = data ? Object.keys(form).filter((k) => form[k] !== data[k]) : [];

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const patch = Object.fromEntries(dirty.map((k) => [k, form[k]]));
      await api("/admin/config", { method: "PATCH", body: JSON.stringify(patch) });
      setMsg("Saved.");
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Configuration">
        <Btn variant="primary" disabled={saving || dirty.length === 0} onClick={save}>
          {saving ? "Saving…" : dirty.length ? `Save ${dirty.length} change${dirty.length > 1 ? "s" : ""}` : "Saved"}
        </Btn>
      </PageHeader>

      {loading && <Loading />}
      {error && <ErrorNote error={error} onRetry={reload} />}
      {msg && <p className="mb-4 text-sm text-chutney">{msg}</p>}

      {data && (
        <Card>
          <div className="space-y-4">
            {Object.keys(data).map((key) => (
              <label key={key} className="block">
                <span className="text-sm font-medium">{LABELS[key] ?? key}</span>
                <input
                  inputMode="numeric"
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value.replace(/[^\d]/g, "") }))}
                  className={`mt-1 w-40 rounded-lg border bg-atta px-3 py-1.5 text-sm outline-none ${
                    data[key] !== form[key] ? "border-roti" : "border-char/25"
                  }`}
                />
              </label>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
