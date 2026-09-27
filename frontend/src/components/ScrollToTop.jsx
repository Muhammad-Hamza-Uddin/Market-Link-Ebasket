import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Ensures every new page opens from the top instead of keeping
// the scroll position from the page you navigated away from.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
