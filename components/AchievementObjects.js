"use client";

import { useEffect, useRef } from "react";

// Four objects in the corners of the achievements block, as on the reference:
// still pictures with a slight tilt and a soft shadow. While the block scrolls
// up the screen they drift apart (top pair up, bottom pair down), all at the
// same pace, and never leave the block: the bottom pair stops at its lower edge.
// files in /public live under the site's base path on GitHub Pages
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const ITEMS = [
  { src: `${BASE}/achievements/blocks.png`, pos: "tl", dir: -1 },
  { src: `${BASE}/achievements/chart.png`, pos: "tr", dir: -1 },
  { src: `${BASE}/achievements/floppy.png`, pos: "bl", dir: 1 },
  { src: `${BASE}/achievements/phone.png`, pos: "br", dir: 1 },
];
const TRAVEL = 100; // px each object moves at most
const ABOVE = 90; // px the top pair may rise above the block (empty corners)
const MARGIN = 8; // px kept between the bottom pair and the block's lower edge

export default function AchievementObjects() {
  const refs = useRef([]);

  useEffect(() => {
    const els = refs.current;
    const box = els[0]?.parentElement;
    if (!box) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      // 0 when the block's top enters at the bottom of the screen,
      // 1 when it reaches the top of the screen
      const p = Math.min(1, Math.max(0, (vh - box.getBoundingClientRect().top) / vh));
      // the same distance for all four, limited by the room each one has
      const room = els.map((el, i) =>
        ITEMS[i].dir < 0
          ? el.offsetTop + ABOVE
          : box.clientHeight - el.offsetTop - el.offsetHeight - MARGIN
      );
      const travel = Math.max(0, Math.min(TRAVEL, ...room));
      els.forEach((el, i) => el.style.setProperty("--drift", `${ITEMS[i].dir * travel * p}px`));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return ITEMS.map(({ src, pos }, i) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={pos}
      ref={(el) => (refs.current[i] = el)}
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`ach-obj ach-obj-${pos}`}
    />
  ));
}
