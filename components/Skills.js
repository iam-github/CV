"use client";

import { useState } from "react";
import { SKILLS } from "@/lib/data";

export default function Skills() {
  const [active, setActive] = useState(null);

  return (
    <section className="sk">
      <p className="sk-label">( Компетенции )</p>
      <ul className={`sk-list${active !== null ? " has-active" : ""}`} data-cursor="dot">
        {SKILLS.map((s, i) => (
          <li
            key={s.t}
            className={active === i ? "is-on" : ""}
            style={{ "--sk-c": s.color, "--sk-bg": s.tint }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            {/* the word in the middle column; on hover it gets a box in its
                colour, and an arrow leads from it to the note on the right */}
            <span className="sk-word">{s.t}</span>
            <span className="sk-aside">
              <span className="sk-arrow" aria-hidden="true" />
              <span className="sk-note">{s.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
