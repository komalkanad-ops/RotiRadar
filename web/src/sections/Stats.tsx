const STATS = [
  { value: "50,000+", label: "Meals cooked" },
  { value: "1,200+", label: "Verified cooks" },
  { value: "4.8", label: "Average rating" },
  { value: "25 min", label: "Average arrival" },
];

export default function Stats() {
  return (
    <section className="border-y border-ink/10 bg-paper">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-ink/10 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="px-6 py-10 text-center">
            <dt className="font-display text-3xl font-semibold text-terracotta sm:text-4xl">{s.value}</dt>
            <dd className="mt-1 text-sm text-ink-soft">{s.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
