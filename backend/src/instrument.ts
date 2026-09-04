import * as Sentry from "@sentry/node";

// Error monitoring — no-ops until SENTRY_DSN is set. Must be imported before anything else in the
// process entrypoint (see server.ts) per Sentry's Node SDK setup.
//
// RotiRadar handles personal data (phone numbers, addresses, ID document URLs). Prisma's
// validation errors embed query args verbatim, so scrub before anything leaves the process.

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?<!\d)(?:\+?91[- ]?)?[6-9]\d{9}(?!\d)/g;
const RUPEE_RE = /(?:₹|Rs\.?|INR)\s?[\d,]+(?:\.\d+)?/gi;

function scrubText(value: string): string {
  return value.replace(EMAIL_RE, "[email]").replace(PHONE_RE, "[phone]").replace(RUPEE_RE, "[amount]");
}

function scrubEvent(event: Sentry.ErrorEvent): void {
  for (const ex of event.exception?.values ?? []) {
    if (ex.type?.startsWith("PrismaClient")) {
      ex.value = "PrismaClient error (message redacted — see server logs; contained query args)";
    } else if (ex.value) {
      ex.value = scrubText(ex.value);
    }
  }
  if (event.message) event.message = scrubText(event.message);
  if (event.request?.data) event.request.data = "[redacted]";
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.1,
    beforeSend(event) {
      try {
        scrubEvent(event as Sentry.ErrorEvent);
      } catch {
        if (event.request) event.request.data = "[redacted]";
      }
      return event;
    },
  });
} else {
  console.warn("SENTRY_DSN not set — backend error monitoring is disabled");
}
