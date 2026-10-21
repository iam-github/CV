"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Art from "./Art";
import { JOBS } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

const ITEMS = JOBS.slice(0, 4);
const STEP = 40; // degrees between neighbouring faces

export default function WorkDrum() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const drumRef = useRef(null);

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

      layout();
      render();

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
          },
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="wd">
      <div ref={stageRef} className="wd-stage">
        <div ref={drumRef} className="wd-drum">
          {ITEMS.map((job) => (
            <Link
              key={job.slug}
              href={`/experience/${job.slug}`}
              className="wd-card art-host"
              data-cursor="Смотреть ↗"
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
