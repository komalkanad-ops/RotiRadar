import SectionHeading from "../components/SectionHeading";
import { HashLink } from "../components/HashLink";

/**
 * Founder / "why we're building this" block. Honest narrative — no invented milestones. If the
 * owner wants a named founder note + photo, add it here (TODO).
 */
export default function Story() {
  return (
    <section id="story" className="bg-cream-deep">
      <div className="section">
        <SectionHeading
          eyebrow="Why RotiRadar"
          title="Good home food shouldn't be a luxury — or a bad deal for the cook"
        />

        <div className="mt-8 grid max-w-4xl gap-5 text-ink-soft [&_p]:max-w-prose">
          <p>
            Ordering in every night is expensive and rarely feels like a proper meal. Hiring a
            full-time cook is out of reach for most households. The informal arrangements that fill
            the gap leave the cook with no profile, no reviews, no backup if something goes wrong —
            and often no fair, predictable pay.
          </p>
          <p>
            RotiRadar is the middle option, done properly: book a verified home cook for a visit,
            pay a fair itemised price in the app, and eat food cooked in your own kitchen with your
            own ingredients. On the other side, the cook gets a real profile, real ratings, set
            rates they control, and — as we grow — insurance and steady payouts.
          </p>
          <p>
            We're a small team in Pune, cooking for our first neighbourhoods now. If that's
            something you'd want near you,{" "}
            <HashLink to="/#waitlist" className="font-semibold text-terracotta underline underline-offset-2">
              tell us where you are
            </HashLink>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
