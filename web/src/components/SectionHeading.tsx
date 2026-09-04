import type { ReactNode } from "react";

export default function SectionHeading({
  eyebrow,
  title,
  lede,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-display">{title}</h2>
      {lede && <p className="mt-4 text-ink-soft">{lede}</p>}
    </div>
  );
}
