"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PERSON, TICKER } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

// `u: true` marks a word that gets an underline.
const LINES = [
  [{ t: "Международные" }, { t: "проекты." }],
  [{ t: "Кроссфункциональные" }, { t: "команды." }],
  [{ t: "От" }, { t: "идеи" }, { t: "до" }, { t: "запуска." }],
  // one piece, so the underline runs unbroken under both words
  [{ t: "Ваша" }, { t: "задача" }, { t: "—" }, { t: "мой результат.", u: true }],
];

const TICKER_ITEMS = TICKER;

// the whole lighting-up takes this many screen heights of scrolling
const SCREENS = 2;
// after the last word lights up the section stays pinned this many "words"
// longer, so the end of the text is always seen fully lit
const HOLD_WORDS = 3;

export default function Manifest() {
  const sectionRef = useRef(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("ru-RU", { timeZone: "Europe/Moscow" })
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray(".mf-word");

      // the pane is held on screen by CSS (position: sticky) rather than
      // pinned from script, so on phones it never runs off and jumps back
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.25,
        },
      });

      words.forEach((word, i) => {
        tl.fromTo(
          word,
          { opacity: 0.16 },
          { opacity: 1, duration: 1, ease: "none" },
          i
        );
        if (word.dataset.underline) {
          tl.fromTo(
            word,
            { "--u": 0 },
            { "--u": 1, duration: 0.6, ease: "none" },
            i + 0.7
          );
        }
      });

      // hold the finished text before the pin releases
      tl.to({}, { duration: HOLD_WORDS });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const ticker = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <section
      ref={sectionRef}
      className="mf"
      style={{ height: `${(SCREENS + 1) * 100}vh` }}
    >
      <div className="mf-pane">
      <p className="mf-label">
        Управление проектами | бизнес-аналитика | операционный менеджмент
      </p>

      <h2 className="mf-text">
        {LINES.map((line, li) => (
          <span className="mf-line" key={li}>
            {line.map((w, wi) => (
              <span
                className="mf-word"
                data-underline={w.u ? "1" : undefined}
                key={wi}
              >
                {w.t}
              </span>
            ))}
          </span>
        ))}
      </h2>

      <div className="mf-bar">
        <div className="mf-ticker-wrap" aria-hidden="true">
          {/* same speed whatever the number of items */}
          <div
            className="mf-ticker"
            style={{ animationDuration: `${TICKER_ITEMS.length * 4.5}s` }}
          >
            {[0, 1].map((n) => (
              <div className="mf-ticker-set" key={n}>
                {ticker.map((item, i) => (
                  <span key={`${n}-${i}`}>{item}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mf-clock">
          <span>{PERSON.city}</span>
          <span suppressHydrationWarning>{time}</span>
        </div>
      </div>
      </div>
    </section>
  );
}
