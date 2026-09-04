import { useEffect, useState } from "react";
import { HashLink } from "./HashLink";
import { Link, Outlet, useLocation } from "react-router-dom";
import CookieConsentBanner from "./CookieConsentBanner";

const NAV = [
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/#safety", label: "Safety" },
  { to: "/#for-cooks", label: "For cooks" },
  { to: "/#faq", label: "FAQ" },
  { to: "/#contact", label: "Contact" },
];

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="" className="h-9 w-9" />
      <span className="font-display text-xl font-semibold">RotiRadar</span>
    </Link>
  );
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Wordmark />

          <nav className="hidden items-center gap-7 text-sm md:flex">
            {NAV.map((l) => (
              <HashLink key={l.to} to={l.to} className="text-ink-soft transition-colors hover:text-ink">
                {l.label}
              </HashLink>
            ))}
            <HashLink to="/#get-app" className="btn-primary">
              Get the app →
            </HashLink>
          </nav>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/20 text-lg md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "×" : "≡"}
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-ink/10 px-6 py-3 md:hidden">
            {NAV.map((l) => (
              <HashLink key={l.to} to={l.to} className="block border-b border-ink/10 py-3 text-ink-soft last:border-0">
                {l.label}
              </HashLink>
            ))}
            <HashLink to="/#get-app" className="btn-primary mt-3 w-full">
              Get the app →
            </HashLink>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <CookieConsentBanner />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-display text-paper">Dinner is 60 minutes away.</h2>
            <p className="mt-3 max-w-prose text-paper/70">
              Download RotiRadar and book your first cook today. Fresh, home-cooked food — without
              lifting a finger.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-2 text-sm lg:justify-end">
            <div className="space-y-2">
              <FooterLink to="/#how-it-works">How it works</FooterLink>
              <FooterLink to="/#pricing">Pricing</FooterLink>
              <FooterLink to="/#safety">Safety</FooterLink>
            </div>
            <div className="space-y-2">
              <FooterLink to="/#for-cooks">For cooks</FooterLink>
              <FooterLink to="/#faq">FAQ</FooterLink>
              <FooterLink to="/#contact">Contact</FooterLink>
            </div>
            <div className="space-y-2">
              <PlainLink to="/privacy">Privacy</PlainLink>
              <PlainLink to="/terms">Terms</PlainLink>
              <PlainLink to="/refund-policy">Refunds</PlainLink>
              <PlainLink to="/delete-account">Delete account</PlainLink>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-paper/15 pt-6 text-xs text-paper/60 sm:flex-row">
          <span>© {new Date().getFullYear()} RotiRadar Technologies Pvt. Ltd. All rights reserved.</span>
          <span>Made with love in Bengaluru</span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <HashLink to={to} className="block text-paper/70 transition-colors hover:text-paper">
      {children}
    </HashLink>
  );
}

function PlainLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="block text-paper/70 transition-colors hover:text-paper">
      {children}
    </Link>
  );
}
