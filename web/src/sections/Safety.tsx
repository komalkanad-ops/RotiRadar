import SectionHeading from "../components/SectionHeading";

const MEASURES = [
  {
    title: "Masked calls",
    body: "Your number stays private. Every call between you and your cook is routed through RotiRadar — never shared directly.",
  },
  {
    title: "Monitored chats",
    body: "In-app chat is screened around the clock for unsafe behaviour, so conversations stay respectful and on-topic.",
  },
  {
    title: "Background-verified cooks",
    body: "Government ID checks, address verification, and in-person kitchen hygiene training before a cook's first booking.",
  },
  {
    title: "Live visit tracking",
    body: "Follow your cook's arrival on the map and share the live trip status with family — plus an in-app SOS, just in case.",
  },
];

export default function Safety() {
  return (
    <section id="safety" className="section">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Safety first"
            title={<>Your home. Your rules. Our promise.</>}
            lede="Inviting someone into your kitchen takes trust. Every RotiRadar visit is wrapped in layers of protection — before, during, and after the cooking."
          />
          <p className="mt-6 flex items-start gap-3 rounded-2xl border border-sage/30 bg-sage/5 px-4 py-3 text-sm text-sage">
            <span aria-hidden className="mt-0.5">
              ⛨
            </span>
            Every visit is insured, and every cook is re-verified every 6 months.
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
