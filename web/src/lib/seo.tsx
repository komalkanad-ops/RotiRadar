import { useEffect } from "react";

const SITE = "https://rotiradar.in";
const DEFAULT_DESC =
  "RotiRadar sends a verified home cook to your kitchen — fresh rotis, dal, sabzi, or a full family meal, from ₹199 a visit.";

interface SeoProps {
  title: string;
  description?: string;
  path: string;
  /** Optional JSON-LD object graph injected for this route (e.g. an FAQPage). */
  jsonLd?: Record<string, unknown>;
}

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * No SSR here — this is a client-rendered SPA — so this hook keeps the document head in sync with
 * the current route for browsers, shares/unfurls, and JS-executing crawlers. The static tags in
 * index.html cover the no-JS case for the home page.
 */
export default function Seo({ title, description = DEFAULT_DESC, path, jsonLd }: SeoProps) {
  useEffect(() => {
    const url = SITE + path;
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const existing = document.getElementById("route-jsonld");
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "route-jsonld";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, path, jsonLd]);

  return null;
}
