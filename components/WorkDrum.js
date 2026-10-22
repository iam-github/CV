"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Art from "./Art";
import { JOBS } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

const ITEMS = JOBS.slice(0, 4);
const STEP = 40; // degrees between neighbouring faces

// The description shows the CV text from its very start, as much as fits on
// the card; the last line that fits is cut at a word and ends with "…".
const INFO_EDGE = 22; // px between the text and the card's top / bottom edge
const DESC_GAP = 16; // px between the title and the description (CSS margin)
const DESC_MAX = 340; // px, the description's max height in CSS

function fitDescription(card) {
  const desc = card.querySelector(".wd-desc");
  if (!desc) return;
  const meta = card.querySelector(".wd-meta");
  const title = card.querySelector(".wd-title");
  const items = [...desc.children];
  items.forEach((el) => {
    el.dataset.full ??= el.textContent;
    el.textContent = el.dataset.full;
    el.hidden = false;
  });
  const head =
    meta.offsetHeight + parseFloat(getComputedStyle(meta).marginBottom) + title.offsetHeight;
  const room = Math.min(DESC_MAX, card.clientHeight - 2 * INFO_EDGE - head - DESC_GAP);
  const fits = () => desc.scrollHeight <= room;
  if (fits()) return;

  // drop whole items from the end while the text is too tall
  let last = items.length - 1;
  while (last > 0 && !fits()) items[last--].hidden = true;

  // then fill the space left with the start of the next item (or, when even
  // the first item is too long, cut that one)
  const cut = (el) => {
    const words = el.dataset.full.split(" ");
    el.hidden = false;
    let lo = 0;
    let hi = words.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      el.textContent = `${words.slice(0, mid).join(" ")}…`;
      if (fits()) lo = mid;
      else hi = mid - 1;
    }
    if (lo === 0) el.hidden = true;
    else el.textContent = `${words.slice(0, lo).join(" ")}…`;
  };
  if (!fits()) cut(items[0]);
  else if (last + 1 < items.length) cut(items[last + 1]);
}

export default function WorkDrum() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const drumRef = useRef(null);
  const [openSlug, setOpenSlug] = useState(null);

  // without a mouse (phones) a tap opens or closes the description
  // instead of going to the job page
  const onCard = (e, slug) => {
    if (!window.matchMedia("(hover: none)").matches) return;
    e.preventDefault();
    setOpenSlug((cur) => (cur === slug ? null : slug));
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      const drum = drumRef.current;
      const cards = gsap.utils.toArray(".wd-card");
      const state = { angle: 0 };

      // transforms are written as strings: each card is pushed out by the
      // radius first and then rotated around the drum axis
      const layout = () => {
        const h = cards[0].offsetHeight;
        const radius = (h / 2 + 24) / Math.tan(((STEP / 2) * Math.PI) / 180);
        cards.forEach((card, i) => {
          card.style.transform = `rotateX(${-i * STEP}deg) translateZ(${radius}px)`;
        });
        drum.dataset.radius = radius;
      };

      const render = () => {
        const radius = Number(drum.dataset.radius);
        drum.style.transform = `translateZ(${-radius}px) rotateX(${state.angle}deg)`;
        cards.forEach((card, i) => {
          const off = Math.min(Math.abs(i * STEP - state.angle) / STEP, 1.5);
          card.style.filter = `brightness(${1 - Math.min(off, 1) * 0.7})`;
        });
      };

      const fitAll = () => cards.forEach(fitDescription);

      layout();
      render();
      fitAll();
      document.fonts.ready.then(fitAll);

      gsap.to(state, {
        angle: STEP * (ITEMS.length - 1),
        ease: "none",
        onUpdate: render,
        scrollTrigger: {
          trigger: stageRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 0.9 * (ITEMS.length - 1)}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefresh: () => {
            layout();
            render();
            fitAll();
          },
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="experience" className="wd">
      <div ref={stageRef} className="wd-stage">
        <div ref={drumRef} className="wd-drum">
          {ITEMS.map((job) => (
            <Link
              key={job.slug}
              href={`/experience#${job.slug}`}
              className={`wd-card art-host${openSlug === job.slug ? " is-open" : ""}`}
              data-cursor="Смотреть ↗"
              onClick={(e) => onCard(e, job.slug)}
            >
              <Art job={job} />
              <span className="brk brk-tl" />
              <span className="brk brk-tr" />
              <span className="brk brk-bl" />
              <span className="brk brk-br" />
              {/* on hover the description opens and lifts the title up */}
              <span className="wd-info">
                <span className="wd-meta">
                  {job.role} · {job.years}
                </span>
                <span className="wd-title">{job.company}</span>
                {job.cv && (
                  <span className="wd-desc">
                    {job.cv.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
        <Link href="/experience" className="wd-all">
          Весь опыт ↗
        </Link>
      </div>
    </section>
  );
}
