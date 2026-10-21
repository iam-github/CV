"use client";

import { useEffect, useRef } from "react";
import { ACHIEVEMENTS } from "@/lib/data";

const LINES = ["Люди помнят", "не задачи.", "Они помнят", "результат."];
const RADIUS = 110;
const LETTERS = "abcdefgh";

export default function Achievements() {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const family = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-display")
      .trim();

    let dots = [];
    let size = 3;
    let w = 0;
    let h = 0;
    const mouse = { x: -9999, y: -9999 };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = box.clientWidth;
      h = box.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // draw the text once off-screen and sample it into a dot grid
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const o = off.getContext("2d");
      let fs = 100;
      o.font = `700 ${fs}px ${family}`;
      const widest = Math.max(...LINES.map((l) => o.measureText(l.toUpperCase()).width));
      fs = Math.min((fs * w * 0.82) / widest, (h * 0.92) / (LINES.length * 1.02));
      o.font = `700 ${fs}px ${family}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#000";
      const lh = fs * 1.02;
      const top = h / 2 - (lh * (LINES.length - 1)) / 2;
      LINES.forEach((l, i) => o.fillText(l.toUpperCase(), w / 2, top + i * lh));

      const step = Math.max(5, Math.round(fs / 16));
      size = step * 0.45;
      const data = o.getImageData(0, 0, w, h).data;
      dots = [];
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if (data[(y * w + x) * 4 + 3] > 128) {
            dots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
          }
        }
      }
    };

    const onMove = (e) => {
      const r = box.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerleave", onLeave);

    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(box);

    const ro = new ResizeObserver(build);
    ro.observe(box);
    document.fonts.ready.then(build);

    let raf;
    let t = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      t += 1;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "rgba(239, 237, 230, 0.3)";
      ctx.beginPath();
      const moved = [];
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0.01) {
          const f = (1 - dist / RADIUS) * 5;
          d.vx += (dx / dist) * f;
          d.vy += (dy / dist) * f;
        }
        d.vx += (d.hx - d.x) * 0.07;
        d.vy += (d.hy - d.y) * 0.07;
        d.vx *= 0.8;
        d.vy *= 0.8;
        d.x += d.vx;
        d.y += d.vy;
        if (Math.abs(d.x - d.hx) + Math.abs(d.y - d.hy) > 1.5) moved.push(d);
        else ctx.rect(d.x, d.y, size, size);
      }
      ctx.fill();

      // displaced dots get a rainbow colour by their angle around the cursor
      for (const d of moved) {
        const hue = (Math.atan2(d.hy - mouse.y, d.hx - mouse.x) * 57.3 + 360 + t) % 360;
        ctx.fillStyle = `hsl(${hue}, 90%, 62%)`;
        ctx.fillRect(d.x, d.y, size, size);
      }
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="ach">
      <div ref={boxRef} className="ach-dots">
        <canvas ref={canvasRef} />
        <p className="sr-only">{LINES.join(" ")}</p>
        {["tl", "tr", "bl", "br"].map((pos) => (
          <span key={pos} className={`cube cube-${pos}`} aria-hidden="true">
            {["f", "b", "l", "r", "t", "d"].map((f) => (
              <i key={f} className={`cube-${f}`} />
            ))}
          </span>
        ))}
      </div>

      <ul className="ach-table">
        {ACHIEVEMENTS.map((a, i) => (
          <li key={a.what}>
            <span>{a.what}</span>
            <span>{a.where}</span>
            <span>({LETTERS[i]}.)</span>
            <span>{a.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
