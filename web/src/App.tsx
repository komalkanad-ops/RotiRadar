import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";
import DeleteAccount from "./pages/DeleteAccount";
import NotFound from "./pages/NotFound";

/** Reset scroll on route change, except when navigating to an on-page anchor. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/** Old standalone URLs now resolve to sections of the single-page home. */
function toHome(hash: string) {
  return <Navigate to={`/#${hash}`} replace />;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          <Route path="/how-it-works" element={toHome("how-it-works")} />
          <Route path="/pricing" element={toHome("pricing")} />
          <Route path="/safety" element={toHome("safety")} />
          <Route path="/for-cooks" element={toHome("for-cooks")} />
          <Route path="/faq" element={toHome("faq")} />
          <Route path="/support" element={toHome("contact")} />
          <Route path="/contact" element={toHome("contact")} />
          <Route path="/download" element={toHome("get-app")} />

          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
