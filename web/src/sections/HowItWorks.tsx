import SectionHeading from "../components/SectionHeading";

const STEPS = [
  {
    title: "Tell us what you're craving",
    body: "Pick roti-dal-rice, sabzi prep, or a full meal in the app, and choose a slot that suits you.",
  },
  {
    title: "Match with a verified cook",
    body: "We pair you with a background-checked, hygiene-trained home cook near you — often within the hour.",
  },
  {
    title: "They cook in your kitchen",
    body: "Your cook arrives with an apron and gets to work with your ingredients, your spices, your way.",
  },
  {
    title: "Eat fresh, pay in-app",
    body: "Pay securely by UPI or card, rate your cook, and rebook your favourites with one tap.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <SectionHeading eyebrow="How it works" title="From craving to fresh rotis in four steps" />

      <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <span className="font-display text-4xl text-terracotta/35">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
