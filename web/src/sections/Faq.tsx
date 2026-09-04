import SectionHeading from "../components/SectionHeading";
import FaqAccordion from "../components/FaqAccordion";
import { FAQS } from "../lib/faqs";

export default function Faq() {
  return (
    <section id="faq" className="section">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" center />
      <div className="mx-auto mt-12 max-w-3xl">
        <FaqAccordion items={FAQS} />
      </div>
    </section>
  );
}
