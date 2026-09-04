import { useState } from "react";

export interface QA {
  q: string;
  a: string;
}

/** Disclosure list — motion answers the click (open/close), which is the kind worth keeping. */
export default function FaqAccordion({ items }: { items: QA[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="card p-0">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
            >
              <span className="font-display text-lg font-medium">{item.q}</span>
              <span aria-hidden className={`shrink-0 text-xl text-terracotta transition-transform ${isOpen ? "rotate-45" : ""}`}>
                +
              </span>
            </button>
            {isOpen && <p className="max-w-prose px-6 pb-6 text-ink-soft">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
