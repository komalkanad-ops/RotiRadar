import Seo from "../lib/seo";
import { FAQS } from "../lib/faqs";
import Hero from "../sections/Hero";
import DishMarquee from "../sections/DishMarquee";
import HowItWorks from "../sections/HowItWorks";
import Pricing from "../sections/Pricing";
import Safety from "../sections/Safety";
import Stats from "../sections/Stats";
import ForCooks from "../sections/ForCooks";
import Faq from "../sections/Faq";
import Contact from "../sections/Contact";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Seo
        title="RotiRadar — Book a Home Cook in Minutes | Fresh Rotis from ₹199"
        description="RotiRadar sends a verified home cook to your kitchen — fresh rotis, dal, sabzi, or a full family meal, cooked your way, from ₹199 a visit. Now live in 5 Indian cities."
        path="/"
        jsonLd={jsonLd}
      />
      <Hero />
      <DishMarquee />
      <HowItWorks />
      <Pricing />
      <Safety />
      <Stats />
      <ForCooks />
      <Faq />
      <Contact />
    </>
  );
}
