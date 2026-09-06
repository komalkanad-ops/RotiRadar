/**
 * App-store buttons in the live site's style — dark pills with a small glyph and a two-line label.
 * RotiRadar isn't published yet, so these don't link by default. Pass `playUrl` / `appStoreUrl`
 * once the listings exist.
 */
interface Props {
  playUrl?: string;
  appStoreUrl?: string;
  className?: string;
}

const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
    <path d="M3.5 2.3v19.4c0 .5.5.8.9.5l11-9.7c.4-.3.4-.9 0-1.2l-11-9.7a.6.6 0 0 0-.9.4z" opacity=".85" />
  </svg>
);
const AppleGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
    <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3 .9-3.8 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.5zM14.2 5.4c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
  </svg>
);

function Badge({ glyph, top, name, href }: { glyph: React.ReactNode; top: string; name: string; href?: string }) {
  const content = (
    <>
      {glyph}
      <span className="text-left leading-tight">
        <span className="block text-[0.6rem] uppercase tracking-wider text-paper/70">{top}</span>
        <span className="block font-display text-base font-semibold">{name}</span>
      </span>
    </>
  );
  const cls = "inline-flex items-center gap-2.5 rounded-xl bg-ink px-4 py-2.5 text-paper";
  return href ? (
    <a href={href} className={`${cls} transition-opacity hover:opacity-90`}>
      {content}
    </a>
  ) : (
    <span className={`${cls} cursor-default opacity-55`} title="Coming soon">
      {content}
    </span>
  );
}

export default function StoreButtons({ playUrl, appStoreUrl, className = "" }: Props) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Badge glyph={<PlayGlyph />} top={playUrl ? "Get it on" : "Coming soon to"} name="Google Play" href={playUrl} />
      <Badge glyph={<AppleGlyph />} top="Later on the" name="App Store" href={appStoreUrl} />
    </div>
  );
}
