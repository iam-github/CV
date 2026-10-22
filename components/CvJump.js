"use client";

// A "<job> ↑ / ↓" button on the "Опыт" page: scrolls smoothly to the block
// with id `to` (see "scroll:to" in SmoothScroll; the jobs stop below the
// header by their CSS scroll-margin-top).
export default function CvJump({ to, name, years, dir = "down" }) {
  const go = () => {
    const target = document.getElementById(to);
    if (target) window.dispatchEvent(new CustomEvent("scroll:to", { detail: { target } }));
  };

  return (
    <button type="button" className="cv-jump" onClick={go}>
      <span>
        {name} {dir === "up" ? "↑" : "↓"}
      </span>
      {years && <span className="cv-jump-years">{years}</span>}
    </button>
  );
}
