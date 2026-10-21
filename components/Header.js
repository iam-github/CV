"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/experience", label: "Опыт" },
  { href: "/contact", label: "Контакты" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

      <Link href="/" className="hd-logo" aria-label="ОК" onClick={onLogo}>
        <svg viewBox="0 0 48 56" width="48" height="56">
          <path d="M6 0h28l14 14v36a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z" />
          <text x="24" y="38" textAnchor="middle">
            ОК
          </text>
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
