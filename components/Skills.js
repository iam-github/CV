"use client";

import { useEffect, useRef, useState } from "react";
import { SKILLS } from "@/lib/data";

const DWELL = 2500; // ms each item stays lit during the auto show
const RESUME = 2000; // ms after the cursor leaves before the auto show goes on

// While the block is on screen the items light up one after another by
// themselves, so it is clear they can be explored. The cursor takes over:
// hovering stops the auto show, leaving resumes it from the next item.
export default function Skills() {
  const [active, setActive] = useState(null);
  const sectionRef = useRef(null);
  const hovering = useRef(false);
  const last = useRef(-1);
  const auto = useRef({ start: () => {}, stop: () => {} });

  useEffect(() => {
    let visible = false;
    let timer = null;

    const step = () => {
      if (!visible || hovering.current) return;
      last.current = (last.current + 1) % SKILLS.length;
      setActive(last.current);
      timer = setTimeout(step, DWELL);
    };
    const start = (delay) => {
      clearTimeout(timer);
      timer = setTimeout(step, delay);
    };
    const stop = () => clearTimeout(timer);
    auto.current = { start, stop };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) start(300);
        else {
          stop();
          if (!hovering.current) setActive(null);
        }
      },
      { threshold: 0.3 }
    );
    io.observe(sectionRef.current);

    return () => {
      io.disconnect();
      stop();
    };
  }, []);

  const onEnter = (i) => {
    hovering.current = true;
    auto.current.stop();
    last.current = i;
    setActive(i);
  };
  const onLeave = () => {
    hovering.current = false;
    setActive(null);
    auto.current.start(RESUME);
  };

  return (
    <section ref={sectionRef} id="skills" className="sk">
      <p className="sk-label">( Компетенции )</p>
      <ul className={`sk-list${active !== null ? " has-active" : ""}`} data-cursor="dot">
        {SKILLS.map((s, i) => (
          <li
            key={s.t}
            className={active === i ? "is-on" : ""}
            style={{ "--sk-c": s.color, "--sk-bg": s.tint }}
            onMouseEnter={() => onEnter(i)}
            onMouseLeave={onLeave}
          >
            {/* the word in the middle column; when lit it gets a box in its
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
