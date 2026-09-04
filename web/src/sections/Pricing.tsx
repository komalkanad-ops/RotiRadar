import SectionHeading from "../components/SectionHeading";
import { TIERS } from "../lib/pricing";

export default function Pricing() {
  return (
    <section id="pricing" className="bg-cream-deep">
      <div className="section">
        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_auto]">
          <div>
            <SectionHeading
              eyebrow="Pricing"
              title="Honest prices, no surprises"
              lede="Pay per visit, only in the app. No subscriptions, no hidden charges — just ghar ka khana at less than the cost of ordering in."
            />
            <p className="mt-4 max-w-prose text-sm text-ink-soft">
              Groceries aren't included — your cook uses your kitchen and your ingredients. The
              platform fee and GST are itemised before you pay.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-ink/10 shadow-[0_10px_30px_-14px_rgba(42,27,19,0.3)] lg:w-72">
            <img
              src="/thali.jpg"
              width={1100}
              height={715}
              alt="A fresh RotiRadar home-style thali — rotis, dal, rice and seasonal sabzis"
              className="block aspect-[3/2] w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const dark = tier.popular;
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-3xl border p-7 ${
                  dark ? "border-ink bg-ink text-paper" : "card"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-7 rounded-full bg-terracotta px-3 py-1 text-xs font-semibold uppercase tracking-wider text-paper">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-2xl font-semibold">{tier.name}</h3>
                <p className={`mt-2 text-sm ${dark ? "text-paper/70" : "text-ink-soft"}`}>{tier.blurb}</p>

                <p className="mt-5 font-display text-4xl font-semibold">
                  {tier.priceLabel}
                  <span className={`ml-1 text-base font-normal ${dark ? "text-paper/60" : "text-ink-soft"}`}>/ visit</span>
                </p>
                <p className={`mt-1 text-sm ${dark ? "text-paper/60" : "text-ink-soft"}`}>{tier.duration}</p>

                <ul className={`mt-5 space-y-2.5 border-t pt-5 text-sm ${dark ? "border-paper/20 text-paper/80" : "border-ink/10 text-ink-soft"}`}>
                  {tier.includes.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span aria-hidden className="mt-0.5 text-terracotta">
                        ✓
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#get-app"
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                    dark
                      ? "bg-terracotta text-paper hover:bg-terracotta-deep"
                      : "border border-ink/20 text-ink hover:border-ink/50"
                  }`}
                >
                  Book in the app →
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
