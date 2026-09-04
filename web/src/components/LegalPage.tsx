import type { ReactNode } from "react";
import Seo from "../lib/seo";
import PageIntro from "./PageIntro";

/**
 * Shared shell for the policy pages. The copy in each is a working draft — every policy page is
 * marked for legal review before RotiRadar takes real bookings.
 */
export default function LegalPage({
  title,
  path,
  description,
  updated,
  children,
}: {
  title: string;
  path: string;
  description: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <Seo title={`${title} — RotiRadar`} description={description} path={path} />
      <PageIntro title={title}>
        <p className="mt-4 text-sm text-ink-soft">Last updated {updated}</p>
      </PageIntro>

      <div className="mx-auto max-w-prose px-6 pb-20 pt-6">
        <p className="mb-8 rounded-xl border border-terracotta/40 bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
          Draft for review. This document is not yet finalised and does not constitute the binding
          terms of any service.
        </p>
        <div className="prose-body space-y-6 text-ink-soft [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3">
          {children}
        </div>
      </div>
    </>
  );
}
