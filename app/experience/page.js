import Link from "next/link";
import Art from "@/components/Art";
import Footer from "@/components/Footer";
import { JOBS, PERSON } from "@/lib/data";

export const metadata = {
  title: `Опыт — ${PERSON.name}`,
};

export default function ExperiencePage() {
  return (
    <main className="light">
      <header className="xp-head">
        <p className="xp-sub">
          {PERSON.experience} в управлении — от запусков с нуля до портфеля
          digital-проектов
        </p>
        <h1 className="xp-title">
          Опыт<sup>{JOBS.length}</sup>
        </h1>
      </header>

      <div className="xp-grid">
        {JOBS.map((job) => (
          <Link
            key={job.slug}
            href={`/experience/${job.slug}`}
            className="xp-card art-host"
            data-cursor="Смотреть ↗"
          >
            <Art job={job} />
            <span className="xp-year">{job.years}</span>
            <span className="xp-label">
              <b>■ {job.company}</b> {job.role}
            </span>
          </Link>
        ))}
      </div>

      <Footer />
    </main>
  );
}
