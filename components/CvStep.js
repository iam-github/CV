"use client";

// "Перейти к опыту работы ↓" on the "Опыт" page: scrolls smoothly to the
// block with id `to` (see "scroll:to" in SmoothScroll; the jobs stop below
// the header by their CSS scroll-margin-top). Without script the plain
// #anchor still works.
export default function CvStep({ to, label, dir = "down" }) {
  const go = (e) => {
    const target = document.getElementById(to);
    if (!target) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("scroll:to", { detail: { target } }));
  };

  return (
    <a href={`#${to}`} className={`cv-step cv-step-${dir}`} onClick={go}>
      {label} <span aria-hidden="true">{dir === "up" ? "↑" : "↓"}</span>
    </a>
  );
}
