import SectionHeading from "../components/SectionHeading";

// TODO: create the support@ / hello@ mailboxes on Hostinger mail and add a real support phone
// number once the desk is staffed. No fake phone / street address until then.
const CARDS = [
  {
    label: "Email us",
    value: "support@rotiradar.in",
    href: "mailto:support@rotiradar.in",
    note: "Bookings & support — we reply within a day",
  },
  {
    label: "Partnerships & press",
    value: "hello@rotiradar.in",
    href: "mailto:hello@rotiradar.in",
    note: "Cooks, societies, and media enquiries",
  },
  { label: "In the app", value: "24×7 in-app support", note: "On every live booking" },
];

export default function Contact() {
  return (
    <section id="contact" className="section">
      <SectionHeading
        eyebrow="Contact"
        title="Talk to a human"
        lede="Questions about bookings, partnerships, or press? Reach out — or download the app for in-app support on live bookings."
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

      <p className="mt-6 text-xs text-ink-soft">Based in Pune, India.</p>
    </section>
  );
}
