"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { PERSON, SECTIONS } from "@/lib/data";

const WORD = "SUCCESS";
const COLORS = [
  { c: "#1a1a1a", ink: "#ffffff" },
  { c: "#e8341c", ink: "#ffffff" },
  { c: "#f0f0ee", ink: "#111111" },
];
const KEYS = [
  ...[...WORD].map((l, i) => ({ l, ...COLORS[i % COLORS.length] })),
  { l: ":)", c: "#e8341c", ink: "#111111" },
];
const MAX_KEY = 1.5; // key size on wide screens
const ROW = 0.8; // the row of keys takes at most this share of the width
const GAP = 0.12; // gap between keys, in key sizes

function keyLabel(text, ink, family) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 120px ${family}`;
  ctx.fillText(text, 128, 136);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const pad = (n) => String(Math.max(0, Math.round(n))).padStart(4, "0");

export default function Footer() {
  const footRef = useRef(null);
  const canvasRef = useRef(null);
  const lineXRef = useRef(null);
  const lineYRef = useRef(null);
  const plusRef = useRef(null);
  const coordsRef = useRef(null);

  useEffect(() => {
    const foot = footRef.current;
    const canvas = canvasRef.current;
    const family = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mono")
      .trim();

    // ---------- three ----------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.z = 20;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(-4, 6, 8);
    scene.add(sun);

    // ---------- physics ----------
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -30, 0) });
    world.defaultContactMaterial.friction = 0.3;
    world.defaultContactMaterial.restitution = 0.2;

    const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    const wallL = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    wallL.quaternion.setFromEuler(0, Math.PI / 2, 0);
    const wallR = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    wallR.quaternion.setFromEuler(0, -Math.PI / 2, 0);
    // keeps the keys from flying out over the top edge
    const ceiling = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    ceiling.quaternion.setFromEuler(Math.PI / 2, 0, 0);
    [ground, wallL, wallR, ceiling].forEach((b) => world.addBody(b));

    // ---------- layout ----------
    let vw = 1;
    let vh = 1;
    const resize = () => {
      const w = foot.clientWidth;
      const h = foot.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      vw = vh * camera.aspect;
      ground.position.set(0, -vh / 2, 0);
      ceiling.position.set(0, vh / 2, 0);
      wallL.position.set(-vw / 2, 0, 0);
      wallR.position.set(vw / 2, 0, 0);
    };
    resize();

    // narrow screens (phones): two rows, SUCC on top of ESS:), so the keys
    // can be twice as large
    const narrow = foot.clientWidth <= 640;
    const perRow = narrow ? Math.ceil(KEYS.length / 2) : KEYS.length;
    // key size follows the screen width
    const KEY = Math.min(MAX_KEY, (vw * ROW) / (perRow + (perRow - 1) * GAP));

    const pointer = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.KINEMATIC,
      shape: new CANNON.Sphere(KEY * 0.73),
    });
    pointer.position.set(0, 100, 0);
    world.addBody(pointer);

    const disposables = [];
    const keys = KEYS.map((k) => {
      // corner rounding scales with the key, so small keys stay cube-shaped
      const geo = new RoundedBoxGeometry(KEY, KEY, KEY * 0.7, 4, KEY * 0.15);
      const mat = new THREE.MeshPhysicalMaterial({
        color: k.c,
        roughness: 0.4,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const tex = keyLabel(k.l, k.ink, family);
      const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(KEY * 0.62, KEY * 0.62), labelMat);
      label.position.z = KEY * 0.35 + 0.003;
      mesh.add(label);
      mesh.visible = false;
      scene.add(mesh);
      disposables.push(geo, mat, tex, labelMat, label.geometry);

      const body = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Box(new CANNON.Vec3(KEY / 2, KEY / 2, KEY * 0.35)),
        linearDamping: 0.05,
        angularDamping: 0.4,
      });
      // until someone plays with them the keys move only up and down, so they
      // fall straight into their places and the rows stay even (see release)
      body.linearFactor.set(0, 1, 0);
      body.angularFactor.set(0, 0, 0);
      return { mesh, body };
    });

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      keys.forEach(({ body }) => {
        // keep the lettered face towards the viewer: spin mostly in the screen plane
        body.linearFactor.set(1, 1, 0);
        body.angularFactor.set(0.12, 0.12, 1);
        body.wakeUp();
      });
    };

    const ro = new ResizeObserver(resize);
    ro.observe(foot);

    // one after another the keys fall straight down onto their places in the
    // row and spell the word; after that they only move when pushed or tapped
    let spawned = false;
    const timers = [];
    const spawn = () => {
      spawned = true;
      const step = KEY * (1 + GAP);
      keys.forEach(({ mesh, body }, i) => {
        const col = i % perRow;
        const topRow = narrow && i < perRow;
        body.position.set((col - (perRow - 1) / 2) * step, vh / 2 - KEY, 0);
        body.quaternion.set(0, 0, 0, 1);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        // the bottom row falls first, the top row lands on it after
        const order = topRow ? perRow + col : narrow ? col : i;
        timers.push(
          setTimeout(() => {
            world.addBody(body);
            mesh.visible = true;
          }, order * 120 + (topRow ? 400 : 0))
        );
      });
    };

    let visible = false;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !spawned) spawn();
      },
      { threshold: 0.35 }
    );
    io.observe(foot);

    // ---------- pointer / crosshair ----------
    const target = { x: 0, y: 0, inside: false };
    const cross = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = foot.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      target.inside = true;
      if (spawned) release();
    };
    const onLeave = () => {
      target.inside = false;
    };
    foot.addEventListener("pointermove", onMove);
    foot.addEventListener("pointerleave", onLeave);

    // phones: a tapped key jumps up with a little spin
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const onTap = (e) => {
      if (e.pointerType === "mouse" || !spawned) return;
      const r = foot.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(keys.map((k) => k.mesh), true)[0];
      if (!hit) return;
      const key = keys.find((k) => k.mesh === hit.object || k.mesh === hit.object.parent);
      if (!key) return;
      release();
      key.body.velocity.set((Math.random() - 0.5) * KEY * 2, Math.sqrt(150 * KEY), 0);
      key.body.angularVelocity.set(0, 0, (Math.random() - 0.5) * 10);
    };
    foot.addEventListener("pointerdown", onTap);

    // ---------- loop ----------
    let raf;
    let lastT = performance.now();
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!visible) {
        lastT = now;
        return;
      }
      const dt = Math.min((now - lastT) / 1000, 1 / 30);
      lastT = now;
      const w = foot.clientWidth;
      const h = foot.clientHeight;

      const cx = target.inside ? target.x : w / 2;
      const cy = target.inside ? target.y : h / 2;
      cross.x += (cx - cross.x) * 0.15;
      cross.y += (cy - cross.y) * 0.15;
      lineXRef.current.style.transform = `translateY(${cross.y}px)`;
      lineYRef.current.style.transform = `translateX(${cross.x}px)`;
      plusRef.current.style.transform = `translate(${cross.x}px, ${cross.y}px)`;
      coordsRef.current.textContent = `X : ${pad(cross.x)}   Y : ${pad(cross.y)}`;

      if (target.inside) {
        const px = (target.x / w - 0.5) * vw;
        const py = (0.5 - target.y / h) * vh;
        if (pointer.position.y > 50) pointer.position.set(px, py, 0);
        pointer.velocity.set((px - pointer.position.x) / dt, (py - pointer.position.y) / dt, 0);
      } else {
        pointer.velocity.set(0, 0, 0);
        pointer.position.set(0, 100, 0);
      }

      if (spawned) {
        world.step(1 / 60, dt, 3);
        keys.forEach(({ mesh, body }) => {
          mesh.position.copy(body.position);
          mesh.quaternion.copy(body.quaternion);
        });
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      ro.disconnect();
      io.disconnect();
      foot.removeEventListener("pointermove", onMove);
      foot.removeEventListener("pointerleave", onLeave);
      foot.removeEventListener("pointerdown", onTap);
      disposables.forEach((d) => d.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  const mail = `mailto:${PERSON.email}`;
  const [user, domain] = PERSON.email.split("@");

  return (
    <footer ref={footRef} id="contacts" className="ft">
      <div className="ft-bg" aria-hidden="true" />
      <span ref={lineXRef} className="ft-line ft-line-x" aria-hidden="true" />
      <span ref={lineYRef} className="ft-line ft-line-y" aria-hidden="true" />
      <span ref={plusRef} className="ft-plus" aria-hidden="true" />
      <span ref={coordsRef} className="ft-coords" aria-hidden="true">
        X : 0000 Y : 0000
      </span>

      {/* the site's contacts block: "Связаться" and "Контакты" lead here */}
      <div className="ft-inner">
        <p className="ft-sub ft-sub-top">Давайте запустим ваш следующий проект</p>
        <a href={mail} className="ft-mail">
          <span>{user}</span>
          <span>@{domain}</span>
        </a>

        <div className="ft-cols">
          <div>
            <h3>Связь</h3>
            <a href={PERSON.phoneHref}>{PERSON.phone}</a>
            <a href={mail}>{PERSON.email}</a>
          </div>
          <div>
            <h3>Формат</h3>
            <span>Удалённо</span>
            <span>Полная / проектная занятость</span>
          </div>
          <div>
            <h3>Разделы</h3>
            {/* the home page blocks in their order: three columns of two */}
            <div className="ft-links">
              {SECTIONS.map((s) => (
                <Link key={s.href} href={s.href}>
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ft-bottom">
        <span>Сайт разработан мной в 2026 году</span>
        <span>{PERSON.role} | Операционный менеджер</span>
      </div>

      <canvas ref={canvasRef} className="ft-canvas" />
    </footer>
  );
}
