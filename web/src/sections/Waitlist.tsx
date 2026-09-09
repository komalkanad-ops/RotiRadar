import { useState } from "react";
import SectionHeading from "../components/SectionHeading";

/**
 * Demand capture for areas we don't cover yet. Posts JSON to `VITE_WAITLIST_ENDPOINT` when set;
 * otherwise falls back to a pre-filled email (same pattern as the old contact form).
 *
 * TODO: point `VITE_WAITLIST_ENDPOINT` at a real sink — a small backend `POST /waitlist` that
 * writes to Hostinger Reach contacts (tagged by area/pincode), or a Hostinger-hosted Reach form.
 * Until then submissions arrive as email.
 */
const ENDPOINT = import.meta.env.VITE_WAITLIST_ENDPOINT;
const FALLBACK_EMAIL = "hello@rotiradar.in";

type State = "idle" | "sending" | "done" | "error";

export default function Waitlist() {
  const [state, setState] = useState<State>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    if (!ENDPOINT) {
      const subject = `Waitlist: ${data.area || "new area"}`;
      const body = `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || "—"}\nArea / city: ${data.area}`;
      window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setState("done");
      return;
    }

    setState("sending");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "website-waitlist" }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) form.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <section id="waitlist" className="section">
      <div className="card mx-auto max-w-2xl">
        <SectionHeading
          eyebrow="Waitlist"
          title="Not in your neighbourhood yet?"
          lede="We're in early access in Pune and adding areas one at a time. Tell us where you are and we'll let you know the moment we can cook for you."
        />

        {state === "done" ? (
          <p className="mt-8 rounded-2xl border border-sage/30 bg-sage/5 px-4 py-4 text-sm text-sage">
            Thanks — you're on the list. We'll be in touch when RotiRadar reaches your area.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 grid gap-4">
            <Field name="name" label="Your name" autoComplete="name" required />
            <Field name="email" label="Email" type="email" autoComplete="email" required />
            <Field name="phone" label="Phone (optional)" type="tel" autoComplete="tel" />
            <Field
              name="area"
              label="Your area & city"
              placeholder="e.g. Baner, Pune"
              autoComplete="off"
              required
            />

            {state === "error" && (
              <p className="text-sm text-terracotta-deep">
                Something went wrong. Please email us at{" "}
                <a href={`mailto:${FALLBACK_EMAIL}`} className="underline">
                  {FALLBACK_EMAIL}
                </a>
                .
              </p>
            )}

            <button type="submit" className="btn-primary mt-1 justify-self-start" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Join the waitlist →"}
            </button>
            <p className="text-xs text-ink-soft">
              We'll only use this to tell you when we launch near you. No spam.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-ink">
        {label}
        {required && <span aria-hidden className="text-terracotta"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="rounded-xl border border-ink/20 bg-paper px-3.5 py-2.5 text-ink outline-none placeholder:text-ink-soft/60 focus:border-terracotta"
      />
    </label>
  );
}
