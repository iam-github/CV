"use client";

import { useState } from "react";
import Art from "./Art";
import { SKILLS, jobBySlug } from "@/lib/data";

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
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="sk-item">
              <span className="sk-prev">
                <Art job={jobBySlug(s.job)} playing />
              </span>
              <span className="sk-word">{s.t}</span>
              <span className="sk-note">{s.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
