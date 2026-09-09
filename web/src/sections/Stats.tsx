/**
 * We deliberately show no usage metrics (meals cooked, cook count, ratings, arrival times) until
 * they are real and verifiable — RotiRadar is in early access. This strip carries the
 * differentiators instead. See docs/marketing-roadmap.md §1.
 */
const POINTS = [
  { value: "Your kitchen", label: "Your ingredients, cooked to your taste" },
  { value: "Per visit", label: "No subscription — pay for the visits you book" },
  { value: "After the meal", label: "Pay once the cooking's done, in the app" },
  { value: "ID-verified", label: "Every cook is reviewed before their first booking" },
];

export default function Stats() {
  return (
    <section className="border-y border-ink/10 bg-paper">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-ink/10 sm:grid-cols-4">
        {POINTS.map((s) => (
          <div key={s.value} className="px-6 py-10 text-center">
            <dt className="font-display text-xl font-semibold text-terracotta sm:text-2xl">{s.value}</dt>
            <dd className="mt-1.5 text-sm text-ink-soft">{s.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
