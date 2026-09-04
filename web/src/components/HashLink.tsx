import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * A link to an on-page anchor that also works from other routes. React Router v6 doesn't scroll to
 * `#hash` targets on its own, so this navigates to the path if needed and then scrolls the element
 * into view (respecting `scroll-padding-top` set in index.css).
 */
export function HashLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [path, hash] = to.split("#");
  const targetPath = path || "/";

  function scrollToHash() {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
  }

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    if (location.pathname === targetPath) {
      scrollToHash();
    } else {
      navigate(targetPath);
      // let the destination render before scrolling
      setTimeout(scrollToHash, 60);
    }
  }

  return (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
