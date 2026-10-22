"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis();
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // other parts of the site ask for a smooth scroll to a block with
    // window event "scroll:to" (detail: { target, offset })
    const onScrollTo = (e) =>
      lenis.scrollTo(e.detail.target, { offset: e.detail.offset ?? 0, duration: 1 });
    window.addEventListener("scroll:to", onScrollTo);

    return () => {
      window.removeEventListener("scroll:to", onScrollTo);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // start every page from the top and re-measure scroll animations; a link
  // with a block's id (e.g. "/#contacts") goes to that block instead
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      const hash = window.location.hash;
      const target = hash && document.getElementById(hash.slice(1));
      if (target && lenisRef.current) {
        // the new page is longer than the old one: measure it first,
        // otherwise the scroll stops at the old page's end
        lenisRef.current.resize();
        // (a block's CSS scroll-margin-top, e.g. the jobs on "Опыт",
        // keeps it below the header)
        lenisRef.current.scrollTo(target, { immediate: true, force: true });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return children;
}
