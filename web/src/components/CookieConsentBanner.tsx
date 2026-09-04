import { useState } from "react";

const STORAGE_KEY = "rr_cookie_consent";

/**
 * RotiRadar's marketing site sets no tracking or analytics cookies today (verified by a full grep
 * of web/src). This banner is built ahead of need so consent is already gated the moment any
 * analytics is added — any future tracking script must check
 * `localStorage.getItem("rr_cookie_consent") === "accepted"` before loading.
 */
export default function CookieConsentBanner() {
  const [choice, setChoice] = useState<string | null>(() =>
    typeof window === "undefined" ? "accepted" : window.localStorage.getItem(STORAGE_KEY),
  );

  if (choice) return null;

  function decide(value: "accepted" | "declined") {
    window.localStorage.setItem(STORAGE_KEY, value);
    setChoice(value);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/15 bg-cream-deep">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <p className="text-sm text-ink-soft">
          We don't use tracking cookies today. If that changes, this is where you'll decide.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide("declined")}
            className="rounded-lg border border-ink/25 px-4 py-2 text-sm hover:border-ink/60"
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="rounded-lg bg-terracotta px-4 py-2 text-sm font-semibold text-paper hover:bg-terracotta-deep"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
