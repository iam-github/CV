"use client";

import { useEffect, useRef } from "react";
import { TOOLS } from "@/lib/data";

const SPEED = 60; // px per second, always, even while the page stands still
const SCROLL_PUSH = 1.5; // extra px of movement per px of page scroll

// The tools run to the left without end: the list is laid out twice, and once
// the first copy has gone by, the movement starts over from the beginning.
// Scrolling the page speeds them up (scrolling back moves them back).
export default function ClientsStrip() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;

    // width of one copy of the list
    let loop = 1;
    const measure = () => {
      const cells = track.children;
      loop = cells[TOOLS.length].offsetLeft - cells[0].offsetLeft || 1;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    document.fonts.ready.then(measure);

    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(section);

    let offset = 0;
    let lastY = window.scrollY;
    let last = performance.now();
    let raf;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const y = window.scrollY;
      const scrolled = y - lastY;
      lastY = y;
      if (!visible) return;
      offset += SPEED * dt + scrolled * SCROLL_PUSH;
      offset = ((offset % loop) + loop) % loop;
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} id="tools" className="cl" aria-label="Инструменты">
      <div ref={trackRef} className="cl-track">
        {[0, 1].map((copy) =>
          TOOLS.map((t) => (
            <div key={`${copy}-${t}`} className="cl-cell" aria-hidden={copy === 1}>
              <span>{t}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
