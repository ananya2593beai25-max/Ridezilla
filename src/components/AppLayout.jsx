// Layout route: header, page, footer. Child routes render where <Outlet /> sits.

import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import PageLoader from "./PageLoader";

/** Scroll to the top on a new page, or to the element named in the URL hash. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait a tick so the target exists after a route change.
      const id = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 50);
      return () => clearTimeout(id);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function AppLayout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to Content
      </a>
      <ScrollManager />
      <Header />
      <main id="main">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
