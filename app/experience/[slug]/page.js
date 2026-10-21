import { Suspense } from "react";
import { notFound } from "next/navigation";
import Art from "@/components/Art";
import NextCase from "@/components/NextCase";
import { JOBS, PERSON, jobBySlug } from "@/lib/data";

export function generateStaticParams() {
  return JOBS.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const job = jobBySlug(slug);
  return { title: job ? `${job.company} — ${PERSON.name}` : PERSON.name };
}

// params are read inside <Suspense> so navigation can show the page shell at once
export default function CasePage({ params }) {
  return (
    <Suspense fallback={<main className="light cs" />}>
      <CaseContent params={params} />
    </Suspense>
  );
}

async function CaseContent({ params }) {
  const { slug } = await params;
  const job = jobBySlug(slug);
  if (!job) notFound();

  const index = JOBS.indexOf(job);
  const next = JOBS[(index + 1) % JOBS.length];

  return (
    <main className="light cs">
      <header className="cs-head">
        <h1>{job.company}</h1>
        <span>
          {job.role} · {job.place} · {job.years}
        </span>
      </header>

      <Art job={job} playing className="cs-cover" />

      <section className="cs-intro">
        <h2>{job.lead}</h2>
        <div>
          <p className="cs-period">{job.period}</p>
          <p>{job.summary}</p>
        </div>
      </section>

      <div className="cs-pair">
        <Art job={job} />
        <Art job={job} playing />
      </div>

      <section className="cs-lists">
        <div>
          <p className="cs-label">( Задачи )</p>
          <ul>
            {job.tasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="cs-label">( Результаты )</p>
          <ul>
            {job.results.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </section>

      <Art job={job} className="cs-wide" />

      <section className="cs-desc">
        <p className="cs-label">( Сфера )</p>
        <p>{job.industry}</p>
      </section>

      <NextCase job={next} />
    </main>
  );
}
