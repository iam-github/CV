"use client";

import { useEffect, useRef, useState } from "react";

// Follows the pointer. Over an element with data-cursor="text" shows a label,
// with data-cursor="dot" turns into a blue dot.
export default function Cursor() {
  const ref = useRef(null);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    const el = ref.current;
    let x = -100;
    let y = -100;
    let tx = x;
    let ty = y;
    let raf;

    const pick = (el) => {
      const target = el?.closest?.("[data-cursor]");
      const value = target ? target.getAttribute("data-cursor") : null;
      setMode((prev) => (prev === value ? prev : value));
    };

    const move = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      pick(e.target);
    };

    // content moves under a still pointer while scrolling
    const scroll = () => pick(document.elementFromPoint(tx, ty));

    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("scroll", scroll, { passive: true });
    loop();
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const cls = mode === "dot" ? " is-dot" : mode ? " is-label" : "";

  return (
    <div ref={ref} className={`cur${cls}`} aria-hidden="true">
      <span className="cur-label">{mode && mode !== "dot" ? mode : ""}</span>
      <span className="cur-dot" />
    </div>
  );
}
