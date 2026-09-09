import Seo from "../lib/seo";
import { FAQS } from "../lib/faqs";
import { TIERS } from "../lib/pricing";
import Hero from "../sections/Hero";
import DishMarquee from "../sections/DishMarquee";
import HowItWorks from "../sections/HowItWorks";
import Pricing from "../sections/Pricing";
import Safety from "../sections/Safety";
import Story from "../sections/Story";
import Stats from "../sections/Stats";
import ForCooks from "../sections/ForCooks";
import Faq from "../sections/Faq";
import Download from "../sections/Download";
import Waitlist from "../sections/Waitlist";
import Contact from "../sections/Contact";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "Service",
        serviceType: "On-demand home cook",
        provider: { "@type": "Organization", name: "RotiRadar" },
        areaServed: { "@type": "City", name: "Pune" },
        offers: TIERS.map((t) => ({
          "@type": "Offer",
          name: t.name,
          price: (t.amountPaise / 100).toFixed(2),
          priceCurrency: "INR",
          description: t.blurb,
        })),
      },
    ],
  };

  return (
    <>
      <Seo
        title="RotiRadar — Book a Home Cook in Pune | Fresh Rotis from ₹199"
        description="RotiRadar brings a verified home cook to your kitchen — fresh rotis, dal, sabzi, or a full family meal, cooked your way with your ingredients. From ₹199 a visit, pay after the meal. Now in early access in Pune."
        path="/"
        jsonLd={jsonLd}
      />
      <Hero />
      <DishMarquee />
      <HowItWorks />
      <Pricing />
      <Safety />
      <Story />
      <Stats />
      <ForCooks />
      <Faq />
      <Download />
      <Waitlist />
      <Contact />
    </>
  );
}
