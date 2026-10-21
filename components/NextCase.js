"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Art from "./Art";

gsap.registerPlugin(ScrollTrigger);

// Banner at the end of a job page. Staying at the very bottom fills the bar,
// then the curtain closes and the next job opens.
export default function NextCase({ job }) {
  const ref = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    const href = `/experience/${job.slug}`;
    let tween = null;
    let fired = false;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "bottom-=40 bottom",
        onEnter: () => {
          tween = gsap.fromTo(
            barRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1.4,
              ease: "none",
              onComplete: () => {
                if (fired) return;
                fired = true;
                window.dispatchEvent(new CustomEvent("curtain:go", { detail: href }));
              },
            }
          );
        },
        onLeaveBack: () => {
          tween?.kill();
          if (barRef.current) gsap.to(barRef.current, { scaleX: 0, duration: 0.3 });
        },
      });
    }, ref);

    return () => {
      tween?.kill();
      ctx.revert();
    };
  }, [job.slug]);

  return (
    <section ref={ref} className="nc">
      <Art job={job} playing className="nc-art" />
      <div className="nc-text">
        <p className="nc-kicker">Загрузка следующего места работы</p>
        <h2>{job.company}</h2>
        <p className="nc-role">( {job.role} )</p>
        <span className="nc-bar">
          <span ref={barRef} />
        </span>
      </div>
    </section>
  );
}
