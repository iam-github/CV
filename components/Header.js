"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/data";

// pages that end with the footer (it holds the contacts, id="contacts")
const WITH_FOOTER = ["/", "/experience"];

// sections with a dark background: over them the logo turns white
const DARK = ".mf-pane, .wd, .ach, .cl, .sk";

// the sections of "Разделы" in the footer, without "Контакты":
// the "Связаться" button already leads there
const MENU = SECTIONS.filter((s) => s.href !== "#contacts");

const LINKS_GAP = 22; // px between the open menu line and "Меню" (CSS margin)
const LOGO_ROOM = 12; // px kept free on each side of the logo

export default function Header() {
  const [open, setOpen] = useState(false); // opened by a tap / click
  const [hover, setHover] = useState(false); // mouse over the menu
  const [panel, setPanel] = useState(false); // no room for one line: a panel
  const [linksW, setLinksW] = useState(0); // width of the open menu line
  const [logoX, setLogoX] = useState(0); // where the logo moves meanwhile
  const [onDark, setOnDark] = useState(false);
  const hdRef = useRef(null);
  const leftRef = useRef(null);
  const menuRef = useRef(null);
  const linksRef = useRef(null);
  const logoRef = useRef(null);
  const pathname = usePathname();
  const expanded = open || hover;

  // "Связаться" goes down to the footer of this page, or to the home page's
  // footer where the page has none
  const page = pathname.replace(/\/$/, "") || "/";
  const contactsHref = WITH_FOOTER.includes(page) ? "#contacts" : "/#contacts";

  // The menu opens as one line to the left of "Меню", and the logo moves to
  // the middle of the space left between "Связаться" and that line. When the
  // line does not fit (phones, narrow windows) the menu opens as a panel below.
  useEffect(() => {
    const measure = () => {
      const hd = hdRef.current;
      const menu = menuRef.current;
      const links = linksRef.current;
      if (!hd || !menu || !links) return;
      // measure the closed one-line layout
      const cls = menu.className;
      menu.classList.remove("is-panel", "is-expanded");
      const lineW = links.scrollWidth;
      const closedW = menu.offsetWidth;
      menu.className = cls;

      const hdW = hd.clientWidth;
      const leftEdge = leftRef.current.offsetLeft + leftRef.current.offsetWidth;
      const menuLeft = hdW - (closedW + lineW + LINKS_GAP);
      const fits = menuLeft - leftEdge >= logoRef.current.offsetWidth + 2 * LOGO_ROOM;
      setPanel(!fits);
      setLinksW(lineW);
      setLogoX(fits ? (leftEdge + menuLeft) / 2 - hdW / 2 : 0);
    };
    measure();
    document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

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
    <header ref={hdRef} className="hd">
      <div ref={leftRef} className="hd-left">
        <Link href={contactsHref} className="hd-pill hd-cta">
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
        style={{ "--logo-x": `${expanded && !panel ? logoX : 0}px` }}
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

      <nav
        ref={menuRef}
        className={`hd-menu${expanded ? " is-expanded" : ""}${panel ? " is-panel" : ""}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
      >
        <div
          ref={linksRef}
          className="hd-menu-links"
          style={{ "--links-w": `${linksW}px` }}
        >
          {MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                setOpen(false);
                setHover(false);
              }}
            >
              {item.label} ↗
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="hd-menu-toggle"
          aria-expanded={expanded}
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
