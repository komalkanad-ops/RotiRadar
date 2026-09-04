import type { ReactNode } from "react";

/** Title block for standalone pages (legal, contact). */
export default function PageIntro({ eyebrow, title, lede, children }: { eyebrow?: string; title: string; lede?: string; children?: ReactNode }) {
  return (
    <header className="mx-auto max-w-6xl px-6 pb-4 pt-16 sm:pt-24">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-3 text-display">{title}</h1>
      {lede && <p className="mt-4 max-w-prose text-lg text-ink-soft">{lede}</p>}
      {children}
    </header>
  );
}
