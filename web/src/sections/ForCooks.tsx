/**
 * Cook-facing earnings and benefit claims are held to the same bar as the customer copy — say
 * only what's real today. No specific monthly-earnings figure until we have a cohort to back it;
 * weekly bank payouts (RazorpayX) are still on the roadmap. See docs/marketing-roadmap.md §1.
 */
const BENEFITS = [
  {
    title: "You set your rates",
    body: "You price each tier in the app — from ₹199 to ₹999 a visit — and keep the majority of every booking fee.",
  },
  {
    title: "Flexible slots",
    body: "Choose mornings, evenings, or weekends — you set your own weekly availability.",
  },
  {
    title: "Onboarding support",
    body: "We help you set up your profile, pricing, and first bookings, and you have support on every job.",
  },
  {
    title: "Verified customers",
    body: "Every customer books through a registered account, and chat is tied to the booking — safety works both ways.",
  },
];

export default function ForCooks() {
  return (
    <section id="for-cooks" className="bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative mx-auto w-full max-w-sm self-start">
          <div className="overflow-hidden rounded-[2rem] border-4 border-paper/10 shadow-2xl">
            <img
              src="/partner-cook.jpg"
              width={1000}
              height={1357}
              alt="A RotiRadar partner cook in her home kitchen"
              className="block aspect-[3/4] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 right-4 rounded-2xl bg-terracotta px-4 py-3 text-center">
            <p className="font-display text-lg font-semibold text-paper">You set</p>
            <p className="text-xs text-paper/80">your own rates</p>
          </div>
        </div>

        <div>
          <p className="eyebrow text-terracotta">For cooks</p>
          <h2 className="mt-3 text-display text-paper">Your recipes. Your income. Your name.</h2>
          <p className="mt-4 max-w-prose text-paper/70">
            Be one of the first cooks in Pune turning everyday cooking into a respected, well-paid
            profession — without leaving your neighbourhood.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title}>
                <h3 className="font-display text-lg font-semibold text-paper">{b.title}</h3>
                <p className="mt-1.5 text-sm text-paper/65">{b.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-prose text-sm text-paper/55">
            Weekly bank payouts are coming with our wider launch; early cooks are paid directly in
            the meantime.
          </p>

          <a href="#get-app" className="btn-primary mt-7">
            Apply as a cook in the app →
          </a>
        </div>
      </div>
    </section>
  );
}
