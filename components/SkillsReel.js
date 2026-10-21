"use client";

import { useEffect, useState } from "react";
import { SKILL_REEL } from "@/lib/data";

const COLORS = [
  { bg: "#e8341c", ink: "#ffffff" },
  { bg: "#111111", ink: "#efede6" },
  { bg: "#3d5afe", ink: "#ffffff" },
  { bg: "#2fd36b", ink: "#0b0b0b" },
  { bg: "#f2f1ee", ink: "#111111" },
  { bg: "#a64bf0", ink: "#ffffff" },
  { bg: "#f28a3c", ink: "#111111" },
  { bg: "#3fe0c8", ink: "#0b0b0b" },
];

const DURATION = 2600;
const pad = (n) => String(n).padStart(2, "0");

// One skill name; words rise in from below, or leave upwards when `out`.
function Words({ text, out = false }) {
  const size = text.length > 26 ? "s" : text.length > 14 ? "m" : "l";
  return (
    <p className={`reel-text reel-${size}${out ? " is-out" : ""}`}>
      {text.split(" ").map((w, i) => (
        <span className="reel-w" key={i}>
          {/* incoming words wait until the outgoing ones have mostly left */}
          <span style={{ animationDelay: out ? "0ms" : `${380 + i * 70}ms` }}>{w}</span>
        </span>
      ))}
    </p>
  );
}

export default function SkillsReel() {
  const [slide, setSlide] = useState({ cur: 0, prev: null });

  useEffect(() => {
    const id = setInterval(
      () =>
        setSlide(({ cur }) => ({ cur: (cur + 1) % SKILL_REEL.length, prev: cur })),
      DURATION
    );
    return () => clearInterval(id);
  }, []);

  // drop the outgoing name once its exit animation is over
  useEffect(() => {
    if (slide.prev === null) return;
    const id = setTimeout(() => setSlide((s) => ({ ...s, prev: null })), 420);
    return () => clearTimeout(id);
  }, [slide.prev]);

  const skill = SKILL_REEL[slide.cur];
  const color = COLORS[slide.cur % COLORS.length];

  return (
    <div
      className="reel"
      style={{ "--bg": color.bg, "--ink": color.ink }}
      aria-label={`Навык: ${skill.t}`}
    >
      <span className="reel-ghost" key={`g${slide.cur}`} aria-hidden="true">
        {pad(slide.cur + 1)}
      </span>
      <span className="reel-tag">( {skill.tag} )</span>
      <span className="reel-count">
        {pad(slide.cur + 1)} / {SKILL_REEL.length}
      </span>

      {slide.prev !== null && (
        <Words key={`p${slide.prev}`} text={SKILL_REEL[slide.prev].t} out />
      )}
      <Words key={`c${slide.cur}`} text={skill.t} />

      <span className="reel-bar" aria-hidden="true">
        <i key={`b${slide.cur}`} style={{ animationDuration: `${DURATION}ms` }} />
      </span>
    </div>
  );
}
