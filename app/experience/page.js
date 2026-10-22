import Footer from "@/components/Footer";
import CvStep from "@/components/CvStep";
import CvNav from "@/components/CvNav";
import CvJump from "@/components/CvJump";
import { PERSON } from "@/lib/data";
import { INTRO, EXPERIENCE, EXPERIENCE_TOTAL } from "@/lib/resume";

export const metadata = {
  title: `Опыт — ${PERSON.name}`,
};

// files in /public live under the site's base path on GitHub Pages
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// shown without "https://" and the trailing slash
const short = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
const href = (url) => (url.startsWith("http") ? url : `https://${url}`);
const pad = (n) => String(n).padStart(2, "0");

// for the floating buttons: name and years ("2024 — 2025") of each job
const NAV_JOBS = EXPERIENCE.map((job) => ({
  id: job.id,
  company: job.company,
  years: [...new Set(job.period.match(/\d{4}/g))].join(" — "),
}));

// "Команды: координировала…" — the short label before the colon in bold
function Labeled({ text }) {
  const m = text.match(/^([^:]{2,40}):\s(.+)$/s);
  if (!m) return text;
  return (
    <>
      <b>{m[1]}:</b> {m[2]}
    </>
  );
}

function Block({ block }) {
  if (block.h) return <h5 className="cv-h">{block.h}</h5>;
  if (block.p)
    return (
      <p>
        <Labeled text={block.p} />
      </p>
    );
  if (block.lines)
    return (
      <p>
        {block.lines.map((line, i) => (
          <span key={i} className="cv-line">
            <Labeled text={line} />
          </span>
        ))}
      </p>
    );
  if (block.list)
    return (
      <ul>
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  if (block.links)
    return (
      <ul className="cv-links">
        {block.links.map((url) => (
          <li key={url}>
            <a href={url} target="_blank" rel="noreferrer">
              {short(url)}
            </a>
          </li>
        ))}
      </ul>
    );
  return null;
}

// A calm, CV-like page over the same changing background as the home page:
// beige at the top of the screen, the moving colour towards the bottom.
export default function ExperiencePage() {
  return (
    <main className="cv-page">
      <div className="cv-bg" aria-hidden="true" />

      <div className="cv">
        <header className="cv-head">
          {/* not shown, kept for search engines and screen readers */}
          <h1 className="sr-only">Опыт</h1>
          {/* the lead paragraph between two lines level with the photo's top
              and bottom; the photo has corner marks like the work drum cards */}
          <div className="cv-head-top">
            <p className="cv-lead">{INTRO[0]}</p>
            <div className="cv-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${BASE}/photo.jpg`} alt={PERSON.name} width={500} height={500} />
              <span className="brk brk-tl" />
              <span className="brk brk-tr" />
              <span className="brk brk-bl" />
              <span className="brk brk-br" />
            </div>
          </div>
          <div className="cv-intro">
            {INTRO.slice(1).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <CvStep to={EXPERIENCE[0].id} label="Перейти к опыту работы" />
        </header>

        <h2 className="cv-section">Опыт работы — {EXPERIENCE_TOTAL}</h2>

        {EXPERIENCE.map((job, i) => (
          <article key={job.id} id={job.id} className="cv-job">
            {/* number and dates stay in view while the job is read */}
            <div className="cv-when">
              <span className="cv-num">
                {pad(i + 1)} / {pad(EXPERIENCE.length)}
              </span>
              <span>{job.period}</span>
              <span className="cv-dur">{job.duration}</span>

              {/* previous / next job: they float along with the dates */}
              <div className="cv-when-nav">
                {i > 0 && (
                  <CvJump
                    to={NAV_JOBS[i - 1].id}
                    name={NAV_JOBS[i - 1].company}
                    years={NAV_JOBS[i - 1].years}
                    dir="up"
                  />
                )}
                {i < NAV_JOBS.length - 1 ? (
                  <CvJump
                    to={NAV_JOBS[i + 1].id}
                    name={NAV_JOBS[i + 1].company}
                    years={NAV_JOBS[i + 1].years}
                  />
                ) : (
                  <CvJump to="contacts" name="Контакты" />
                )}
              </div>
            </div>

            <div className="cv-what">
              <h3 className="cv-company">{job.company}</h3>
              {(job.place || job.site) && (
                <p className="cv-place">
                  {job.place}
                  {job.place && job.site && ", "}
                  {job.site && (
                    <a href={href(job.site)} target="_blank" rel="noreferrer">
                      {job.site}
                    </a>
                  )}
                </p>
              )}

              <h4 className="cv-role">{job.role}</h4>
              <div className="cv-body">
                {job.body.map((block, k) => (
                  <Block key={k} block={block} />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* phones: the same buttons floating in the corner */}
      <CvNav jobs={NAV_JOBS} />
      <Footer />
    </main>
  );
}
