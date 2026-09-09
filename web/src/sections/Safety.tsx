import SectionHeading from "../components/SectionHeading";

/**
 * Only describe what actually ships today. Features still on the roadmap (masked calling, map
 * tracking, in-app SOS, insurance, periodic re-verification) are labelled as coming — do not
 * state them as live. See docs/marketing-roadmap.md §1.
 */
const MEASURES = [
  {
    title: "No numbers exchanged",
    body: "You and your cook coordinate through in-app chat tied to the booking — personal phone numbers are never shared. Masked calling is coming with our wider launch.",
  },
  {
    title: "Chats you can escalate",
    body: "Every booking's chat is linked to your account. If you report a problem, our team can review the conversation and act on it.",
  },
  {
    title: "ID-checked cooks",
    body: "Every cook submits government ID and photos, which we review before their first booking. Address checks and in-person hygiene training are being added as we scale.",
  },
  {
    title: "You pay after the meal",
    body: "Nothing is charged until the visit is done. If a cook cancels or doesn't show, or the work wasn't as booked, our refund policy covers you.",
  },
];

export default function Safety() {
  return (
    <section id="safety" className="section">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Safety first"
            title={<>Your home. Your rules.</>}
            lede="Inviting someone into your kitchen takes trust. Here's what protects each booking today — and what we're building next."
          />
          <p className="mt-6 flex items-start gap-3 rounded-2xl border border-sage/30 bg-sage/5 px-4 py-3 text-sm text-sage">
            <span aria-hidden className="mt-0.5">
              ⛨
            </span>
            On the roadmap: masked calling, live map tracking, an in-app SOS button, visit
            insurance, and periodic re-verification of every cook.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {MEASURES.map((m) => (
            <div key={m.title} className="card">
              <h3 className="font-display text-lg font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{m.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
