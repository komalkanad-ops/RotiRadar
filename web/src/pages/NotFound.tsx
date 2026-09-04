import { Link } from "react-router-dom";
import Seo from "../lib/seo";

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found — RotiRadar" path="/404" />
      <section className="section flex min-h-[50vh] flex-col justify-center">
        <p className="font-display text-sm font-semibold text-terracotta">404</p>
        <h1 className="mt-2 text-display">Nothing's cooking here.</h1>
        <p className="mt-4 max-w-prose text-ink-soft">
          That page doesn't exist or has moved.
        </p>
        <div className="mt-7 flex gap-3">
          <Link to="/" className="btn-primary">
            Back home
          </Link>
          <Link to="/#faq" className="btn-ghost">
            Read the FAQ
          </Link>
        </div>
      </section>
    </>
  );
}
