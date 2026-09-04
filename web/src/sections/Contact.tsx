import SectionHeading from "../components/SectionHeading";

// Placeholder contact details until the real support desk is live.
const CARDS = [
  { label: "Email us", value: "support@rotiradar.in", href: "mailto:support@rotiradar.in", note: "We reply within a day" },
  { label: "Call support", value: "999-ROTI-RADAR", href: "tel:999-ROTI-RADAR", note: "9 AM – 9 PM, every day" },
  { label: "Visit us", value: "HSR Layout, Bengaluru", note: "27th Main, Sector 2" },
];

export default function Contact() {
  return (
    <section id="contact" className="section">
      <SectionHeading
        eyebrow="Contact"
        title="Talk to a human"
        lede="Questions about bookings, partnerships, or press? Reach out — or download the app for 24×7 in-app support on live bookings."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.label} className="card">
            <p className="eyebrow">{c.label}</p>
            <p className="mt-3 font-display text-xl font-semibold">
              {c.href ? (
                <a href={c.href} className="hover:text-terracotta">
                  {c.value}
                </a>
              ) : (
                c.value
              )}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{c.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
