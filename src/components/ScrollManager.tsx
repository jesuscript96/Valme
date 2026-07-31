import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ScrollTrigger } from "../lib/gsap";
import { useSmoothScroll } from "./SmoothScroll";

/**
 * Resets scroll on route change and refreshes ScrollTrigger so reveals on
 * the freshly mounted page measure correctly. Also handles `/#section`
 * deep-links arriving from another route.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const { lenis, scrollTo } = useSmoothScroll();

  useEffect(() => {
    let raf = 0;
    let tries = 0;

    if (hash) {
      // Wait for the target section to mount, then scroll to it.
      const findAndScroll = () => {
        const node = document.querySelector(hash);
        if (node) {
          scrollTo(node as HTMLElement, -20);
          ScrollTrigger.refresh();
        } else if (tries++ < 30) {
          raf = requestAnimationFrame(findAndScroll);
        }
      };
      raf = requestAnimationFrame(findAndScroll);
      return () => cancelAnimationFrame(raf);
    }

    // New page: jump to top, then recalc triggers once content settles.
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, lenis, scrollTo]);

  return null;
}
