import { DISHES } from "../lib/pricing";

/** The scrolling dish strip from the live site — a dark band under the hero. Pauses on hover;
 *  frozen under prefers-reduced-motion (see index.css). Duplicated once so the loop is seamless. */
export default function DishMarquee() {
  const row = [...DISHES, ...DISHES];
  return (
    <div className="overflow-hidden border-y border-ink/20 bg-ink py-4 text-paper">
      <div className="flex w-max animate-marquee gap-0 [animation-play-state:running] hover:[animation-play-state:paused]">
        {row.map((dish, i) => (
          <span key={i} className="flex items-center whitespace-nowrap px-6 font-display italic">
            {dish}
            <span aria-hidden className="ml-6 text-terracotta">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
