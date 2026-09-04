import StoreButtons from "../components/StoreButtons";

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-10 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-terracotta" />
          Now live in 5 Indian cities
        </p>

        <h1 className="mt-5 text-hero">
          Book a cook{" "}
          <span className="italic text-terracotta underline decoration-[3px] underline-offset-[6px]">
            in minutes.
          </span>
        </h1>

        <p className="mt-5 max-w-prose text-lg text-ink-soft">
          RotiRadar sends a verified home cook to your kitchen — fresh rotis, dal, sabzi, or a full
          family meal, cooked your way, in your own home. Starting at just ₹199.
        </p>

        <StoreButtons className="mt-7" />

        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-terracotta">
              ★
            </span>
            <dt className="font-semibold">4.8</dt>
            <dd className="text-ink-soft">average rating</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="font-semibold">50,000+</dt>
            <dd className="text-ink-soft">meals cooked</dd>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-sage">
              ✓
            </span>
            <dd className="text-ink-soft">Background-verified cooks</dd>
          </div>
        </dl>
      </div>

      <div className="relative mx-auto w-full min-w-0 max-w-[420px] lg:justify-self-end">
        <div className="overflow-hidden rounded-[2rem] rounded-tr-[5rem] border border-ink/10 shadow-[0_20px_50px_-20px_rgba(42,27,19,0.35)]">
          <img
            src="/hero-cook.jpg"
            width={1400}
            height={1031}
            alt="A RotiRadar home cook flipping fresh phulka rotis on a tawa in a home kitchen"
            className="block aspect-[4/3] w-full object-cover"
          />
        </div>

        <div className="absolute -left-4 top-8 rounded-2xl border border-ink/10 bg-paper px-4 py-3 shadow-lg">
          <p className="text-sm font-semibold">Cook on the way</p>
          <p className="text-xs text-ink-soft">Arriving in 22 min</p>
        </div>

        <div className="absolute -bottom-5 right-2 rounded-2xl border border-ink/10 bg-paper px-4 py-3 shadow-lg">
          <p className="text-sm font-semibold">&ldquo;Rotis like mom&rsquo;s&rdquo;</p>
          <p className="text-xs text-ink-soft">Priya, HSR Layout</p>
        </div>
      </div>
    </section>
  );
}
