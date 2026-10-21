// Placeholder for photos / videos: a gradient tile built from the job's colours.
// Elements with `.art` start "playing" (moving gradient) on hover of a parent
// with the `art-host` class, or always with `playing`.
export default function Art({ job, playing = false, className = "" }) {
  const [a, b, c] = job.colors;
  return (
    <div
      className={`art${playing ? " is-playing" : ""} ${className}`}
      style={{ "--a": a, "--b": b, "--c": c }}
      aria-hidden="true"
    >
      <span className="art-blob" />
      <span className="art-mark">{job.mark}</span>
    </div>
  );
}
