"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";

// Full-screen black curtain. Closes on window event "curtain:go" (detail = href),
// navigates, and opens again once the new page is rendered.
export default function Curtain() {
  const ref = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const covered = useRef(false);

  useEffect(() => {
    const go = (e) => {
      const href = e.detail;
      gsap.set(ref.current, { transformOrigin: "50% 100%" });
      gsap.to(ref.current, {
        scaleY: 1,
        duration: 0.7,
        ease: "power3.inOut",
        onComplete: () => {
          covered.current = true;
          router.push(href);
        },
      });
    };
    window.addEventListener("curtain:go", go);
    return () => window.removeEventListener("curtain:go", go);
  }, [router]);

  useEffect(() => {
    if (!covered.current) return;
    covered.current = false;
    gsap.set(ref.current, { transformOrigin: "50% 0%" });
    gsap.to(ref.current, {
      scaleY: 0,
      duration: 0.8,
      delay: 0.2,
      ease: "power3.inOut",
    });
  }, [pathname]);

  return <div ref={ref} className="curtain" aria-hidden="true" />;
}
