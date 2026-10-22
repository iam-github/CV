"use client";

import { useEffect, useState } from "react";
import CvJump from "./CvJump";

// px from the top of the screen where a job lands (clear of the header)
const OFFSET = 100;

// Phones: "<previous job> ↑" / "<next job> ↓" floating in the lower right
// corner for the job being read (after the last job "Контакты ↓"). They
// appear once the jobs begin and hide when the footer comes up. On wider
// screens the same buttons stand under each job's dates instead.
export default function CvNav({ jobs }) {
  const [cur, setCur] = useState(-1); // the job being read, -1 = above them
  const [atEnd, setAtEnd] = useState(false); // the footer is on screen

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      let idx = -1;
      jobs.forEach((job, i) => {
        const el = document.getElementById(job.id);
        if (el && el.getBoundingClientRect().top <= OFFSET + 40) idx = i;
      });
      setCur(idx);
      const contacts = document.getElementById("contacts");
      setAtEnd(!!contacts && contacts.getBoundingClientRect().top < window.innerHeight * 0.8);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [jobs]);

  const prev = cur > 0 ? jobs[cur - 1] : null;
  const next =
    cur < 0 ? null : cur < jobs.length - 1 ? jobs[cur + 1] : { id: "contacts", company: "Контакты" };

  return (
    <nav
      className={`cv-nav${cur < 0 || atEnd ? " is-hidden" : ""}`}
      aria-label="Переход между местами работы"
    >
      {prev && <CvJump to={prev.id} name={prev.company} years={prev.years} dir="up" />}
      {next && <CvJump to={next.id} name={next.company} years={next.years} />}
    </nav>
  );
}
