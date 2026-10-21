"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { PERSON } from "@/lib/data";

const KEYS = [
  { l: "К", c: "#1a1a1a", ink: "#ffffff" },
  { l: "Р", c: "#e8341c", ink: "#ffffff" },
  { l: "И", c: "#f0f0ee", ink: "#111111" },
  { l: "С", c: "#1a1a1a", ink: "#ffffff" },
  { l: "Т", c: "#e8341c", ink: "#ffffff" },
  { l: "И", c: "#f0f0ee", ink: "#111111" },
  { l: "Н", c: "#1a1a1a", ink: "#ffffff" },
  { l: "А", c: "#f0f0ee", ink: "#111111" },
  { l: ":)", c: "#e8341c", ink: "#111111" },
];
const KEY = 1.5;

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
    [ground, wallL, wallR].forEach((b) => world.addBody(b));

    const pointer = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.KINEMATIC,
      shape: new CANNON.Sphere(1.1),
    });
    pointer.position.set(0, 100, 0);
    world.addBody(pointer);

    const disposables = [];
    const keys = KEYS.map((k) => {
      const geo = new RoundedBoxGeometry(KEY, KEY, KEY * 0.7, 4, 0.22);
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
      // keep the lettered face towards the viewer: spin mostly in the screen plane
      body.linearFactor.set(1, 1, 0);
      body.angularFactor.set(0.12, 0.12, 1);
      return { mesh, body };
    });

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
      wallL.position.set(-vw / 2, 0, 0);
      wallR.position.set(vw / 2, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(foot);
    resize();

    let spawned = false;
    const spawn = () => {
      spawned = true;
      keys.forEach(({ mesh, body }, i) => {
        body.position.set((Math.random() - 0.5) * (vw - KEY * 2), vh / 2 + 2 + i * 1.4, 0);
        body.quaternion.setFromEuler(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6,
          Math.random() * Math.PI * 2
        );
        world.addBody(body);
        mesh.visible = true;
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
    };
    const onLeave = () => {
      target.inside = false;
    };
    foot.addEventListener("pointermove", onMove);
    foot.addEventListener("pointerleave", onLeave);

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
      ro.disconnect();
      io.disconnect();
      foot.removeEventListener("pointermove", onMove);
      foot.removeEventListener("pointerleave", onLeave);
      disposables.forEach((d) => d.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  const mail = `mailto:${PERSON.email}`;
  const [user, domain] = PERSON.email.split("@");

  return (
    <footer ref={footRef} className="ft">
      <div className="ft-bg" aria-hidden="true" />
      <span ref={lineXRef} className="ft-line ft-line-x" aria-hidden="true" />
      <span ref={lineYRef} className="ft-line ft-line-y" aria-hidden="true" />
      <span ref={plusRef} className="ft-plus" aria-hidden="true" />
      <span ref={coordsRef} className="ft-coords" aria-hidden="true">
        X : 0000 Y : 0000
      </span>

      <div className="ft-inner">
        <a href={mail} className="ft-mail">
          <span>{user}</span>
          <span>@{domain}</span>
        </a>
        <p className="ft-sub">Давайте запустим ваш следующий проект</p>

        <div className="ft-cols">
          <div>
            <h3>Разделы</h3>
            <Link href="/">Главная</Link>
            <Link href="/experience">Опыт</Link>
            <Link href="/contact">Контакты</Link>
          </div>
          <div>
            <h3>Связь</h3>
            <a href={PERSON.phoneHref}>{PERSON.phone}</a>
            <a href={mail}>{PERSON.email}</a>
          </div>
          <div>
            <h3>Формат</h3>
            <span>{PERSON.city}</span>
            <span>Удалённо, полная занятость</span>
          </div>
        </div>
      </div>

      <div className="ft-bottom">
        <span>© 2026 {PERSON.name}</span>
        <span>{PERSON.role}</span>
      </div>

      <canvas ref={canvasRef} className="ft-canvas" />
    </footer>
  );
}
