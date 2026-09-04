const BENEFITS = [
  {
    title: "Earn up to ₹35,000/month",
    body: "Keep up to 85% of every booking, with weekly payouts straight to your bank.",
  },
  {
    title: "Flexible slots",
    body: "Choose mornings, evenings, or weekends — you set your own availability.",
  },
  {
    title: "Free training",
    body: "Hygiene certification, plating skills, and customer-care coaching, on us.",
  },
  {
    title: "You're protected too",
    body: "Masked calls, verified customers, and insured visits — safety works both ways.",
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
            <p className="font-display text-xl font-semibold text-paper">₹35,000</p>
            <p className="text-xs text-paper/80">top monthly earnings</p>
          </div>
        </div>

        <div>
          <p className="eyebrow text-terracotta">For cooks</p>
          <h2 className="mt-3 text-display text-paper">Your recipes. Your income. Your name.</h2>
          <p className="mt-4 max-w-prose text-paper/70">
            Join 1,200+ home cooks turning everyday cooking into a respected, well-paid profession —
            without leaving your neighbourhood.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title}>
                <h3 className="font-display text-lg font-semibold text-paper">{b.title}</h3>
                <p className="mt-1.5 text-sm text-paper/65">{b.body}</p>
              </div>
            ))}
          </div>

          <a href="#get-app" className="btn-primary mt-9">
            Apply as a cook in the app →
          </a>
        </div>
      </div>
    </section>
  );
}
