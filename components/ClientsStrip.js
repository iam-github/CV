"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { COMPANIES } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

// Moves only with the page scroll, not on its own.
export default function ClientsStrip() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="cl" aria-label="Компании">
      <div ref={trackRef} className="cl-track">
        {COMPANIES.map((c) => (
          <div key={c} className="cl-cell">
            <span>{c}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
