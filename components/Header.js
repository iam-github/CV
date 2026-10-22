"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/experience", label: "Опыт" },
  { href: "/contact", label: "Контакты" },
];

// sections with a dark background: over them the logo turns white
const DARK = ".mf-pane, .wd, .ach, .cl, .sk, .nc";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const logoRef = useRef(null);
  const pathname = usePathname();

  // checks which section is under the logo while the page scrolls
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const r = logoRef.current?.getBoundingClientRect();
      if (!r) return;
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const dark = [...document.querySelectorAll(DARK)].some((el) => {
        const s = el.getBoundingClientRect();
        return x >= s.left && x <= s.right && y >= s.top && y <= s.bottom;
      });
      setOnDark(dark);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    // a new page may finish laying out a moment later
    const late = setTimeout(check, 400);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  // on the home page the logo brings the glass "ОК" back out (see Hero)
  const onLogo = (e) => {
    if (pathname !== "/") return;
    e.preventDefault();
    window.dispatchEvent(new Event("ok:show"));
  };

  return (
    <header className="hd">
      <div className="hd-left">
        <Link href="/contact" className="hd-pill hd-cta">
          Связаться
        </Link>
        <span className="hd-icon" aria-hidden="true">
          {/* idle: sideways smile */}
          <svg className="ico ico-idle" viewBox="0 0 24 24">
            <circle cx="8" cy="9" r="1.4" />
            <circle cx="8" cy="15" r="1.4" />
            <path d="M13 8.5c2.6 1.6 2.6 5.4 0 7" />
          </svg>
          {/* hover on the button: upright smile */}
          <svg className="ico ico-smile" viewBox="0 0 24 24">
            <circle cx="9" cy="9.5" r="1.4" />
            <circle cx="15" cy="9.5" r="1.4" />
            <path d="M8 14c2.2 2.6 5.8 2.6 8 0" />
          </svg>
          {/* hover on the icon: sparkles */}
          <svg className="ico ico-spark" viewBox="0 0 24 24">
            <path d="M10 4v6M7 7h6" />
            <path d="M16 11v4M14 13h4" />
            <path d="M9 15v3M7.5 16.5h3" />
          </svg>
        </span>
      </div>

      <Link
        ref={logoRef}
        href="/"
        className={`hd-logo${onDark ? " is-on-dark" : ""}`}
        aria-label="ОК"
        onClick={onLogo}
      >
        {/* the letters are cut out of the shape, so the page shows through */}
        <svg viewBox="0 0 48 56" width="48" height="56">
          <defs>
            <mask id="hd-logo-cut">
              <path
                className="hd-logo-mask-shape"
                d="M6 0h28l14 14v36a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z"
              />
              <text className="hd-logo-mask-text" x="24" y="38" textAnchor="middle">
                ОК
              </text>
            </mask>
          </defs>
          <path
            className="hd-logo-shape"
            mask="url(#hd-logo-cut)"
            d="M6 0h28l14 14v36a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z"
          />
        </svg>
      </Link>

      <nav className={`hd-menu${open ? " is-open" : ""}`}>
        <div className="hd-menu-links">
          {MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label} ↗
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="hd-menu-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span>Меню</span>
          <span className="hd-dots" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </nav>
    </header>
  );
}
