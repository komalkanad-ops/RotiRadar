import StoreButtons from "../components/StoreButtons";

const APPS = [
  {
    name: "RotiRadar",
    who: "For your kitchen",
    body: "Book a verified cook, pick your slot, track them to your door, and pay in the app.",
    href: "/downloads/rotiradar-user.apk",
  },
  {
    name: "RotiRadar for Cooks",
    who: "Cook with us",
    body: "Set your rates and availability, accept jobs nearby, and see what you've earned.",
    href: "/downloads/rotiradar-cook.apk",
  },
];

export default function Download() {
  return (
    <section id="get-app" className="bg-cream-deep">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <p className="eyebrow text-terracotta">Get the app</p>
        <h2 className="mt-3 text-display">Two apps, one kitchen.</h2>
        <p className="mt-4 max-w-prose text-ink-soft">
          RotiRadar runs in the app — booking, chat, tracking and payments all live there. Grab the
          Android build below while we finish the Play Store and iOS listings.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {APPS.map((a) => (
            <div
              key={a.href}
              className="flex flex-col rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm"
            >
              <p className="eyebrow text-ink-soft">{a.who}</p>
              <h3 className="mt-2 font-display text-xl font-semibold">{a.name}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{a.body}</p>
              <a href={a.href} download className="btn-primary mt-6 self-start">
                Download for Android →
              </a>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-prose text-xs text-ink-soft">
          Android only for now. After the download finishes, open the file and allow installs from
          your browser if Android asks. These are early test builds — expect a "Play Protect"
          prompt; choose <span className="font-semibold">Install anyway</span>. iOS is coming later.
        </p>

        <div className="mt-8">
          <p className="text-sm font-semibold">Also coming soon</p>
          <StoreButtons className="mt-3" />
        </div>
      </div>
    </section>
  );
}
