import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function useZarazPageView() {
  const location = useLocation();

  useEffect(() => {
    let lastTitle = document.title;
    let attempts = 0;
    const maxAttempts = 10; // max wait ~2s

    const checkTitleAndSend = () => {
      const currentTitle = document.title;

      // Wait for title to actually change
      if (currentTitle !== lastTitle || attempts > maxAttempts) {
        const pageTitle = currentTitle;
        const pageURL = window.location.href;
        const pagePath = location.pathname + location.search;

        if (window.zaraz && typeof window.zaraz.track === "function") {
          window.zaraz.track("page_view", {
            page_title: pageTitle,
            page_location: pageURL,
            page_path: pagePath,
          });
          console.info("[Zaraz] page_view sent:", pageTitle, pagePath);
        } else if (attempts < maxAttempts) {
          setTimeout(checkTitleAndSend, 200);
        }
      } else {
        attempts++;
        setTimeout(checkTitleAndSend, 200);
      }
    };

    checkTitleAndSend();

    // Cleanup
    return () => {
      attempts = maxAttempts + 1;
    };
  }, [location]);
}
