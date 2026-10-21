"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Four glossy 3D tools of a manager / analyst in the corners of the
// achievements block: a rising bar chart, a budget pie chart, a calendar with
// deadlines and a folder with an estimate. Same muted palette as the hero.
const COLORS = {
  graphite: "#2b2b2e",
  violet: "#4a2c9c",
  orange: "#d8692f",
  cream: "#efe7d6",
};

const glossy = (color) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });

const chrome = () =>
  new THREE.MeshPhysicalMaterial({ color: "#eeeeee", metalness: 1, roughness: 0.15 });

function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---------- the four objects ----------

function barChart() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.12, 0.7, 4, 0.05), glossy(COLORS.cream));
  base.position.y = -0.55;
  g.add(base);
  const heights = [0.35, 0.55, 0.8, 1.1];
  const colors = [COLORS.graphite, COLORS.graphite, COLORS.violet, COLORS.orange];
  heights.forEach((h, i) => {
    const bar = new THREE.Mesh(new RoundedBoxGeometry(0.22, h, 0.22, 4, 0.04), glossy(colors[i]));
    bar.position.set(-0.45 + i * 0.3, -0.49 + h / 2, 0);
    g.add(bar);
  });
  return g;
}

function pieChart() {
  const g = new THREE.Group();
  const slices = [
    [0, 0.45, COLORS.violet, 0],
    [0.45, 0.75, COLORS.orange, 0.1], // pulled out a little
    [0.75, 1, COLORS.cream, 0],
  ];
  slices.forEach(([a0, a1, color, out]) => {
    const t0 = a0 * Math.PI * 2;
    const t1 = a1 * Math.PI * 2;
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.absarc(0, 0, 0.62, t0, t1, false);
    s.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 4,
      curveSegments: 40,
    });
    const mesh = new THREE.Mesh(geo, glossy(color));
    const mid = (t0 + t1) / 2;
    mesh.position.set(Math.cos(mid) * out, Math.sin(mid) * out, 0);
    g.add(mesh);
  });
  return g;
}

function calendar(fonts) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1, 1.06, 0.14, 4, 0.05), glossy(COLORS.cream));
  g.add(body);
  const face = canvasTexture(256, 272, (ctx, w, h) => {
    ctx.fillStyle = COLORS.orange;
    ctx.fillRect(0, 0, w, 64);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 34px ${fonts.display}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DEADLINE", w / 2, 36);
    // grid of days, one of them circled
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        ctx.fillStyle = "rgba(43,43,46,0.18)";
        ctx.fillRect(22 + c * 44, 88 + r * 44, 32, 32);
      }
    }
    ctx.strokeStyle = COLORS.violet;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(22 + 3 * 44 + 16, 88 + 2 * 44 + 16, 26, 0, Math.PI * 2);
    ctx.stroke();
  });
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.98),
    new THREE.MeshBasicMaterial({ map: face })
  );
  front.position.z = 0.071;
  g.add(front);
  [-0.25, 0.25].forEach((x) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 12, 24), chrome());
    ring.position.set(x, 0.55, 0);
    g.add(ring);
  });
  return g;
}

function folder(fonts) {
  const g = new THREE.Group();
  const back = new THREE.Shape();
  [[-0.5, -0.42], [0.5, -0.42], [0.5, 0.34], [-0.04, 0.34], [-0.14, 0.45], [-0.5, 0.45]]
    .forEach(([x, y], i) => (i ? back.lineTo(x, y) : back.moveTo(x, y)));
  back.closePath();
  const backGeo = new THREE.ExtrudeGeometry(back, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
  });
  const backMesh = new THREE.Mesh(backGeo, glossy(COLORS.violet));
  backMesh.position.z = -0.08;
  g.add(backMesh);

  // the estimate sheet sticking out
  const sheetTex = canvasTexture(256, 300, (ctx, w, h) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1b1b1b";
    ctx.font = `600 44px ${fonts.display}`;
    ctx.textBaseline = "top";
    ctx.fillText("СМЕТА", 24, 22);
    ctx.fillStyle = "rgba(27,27,27,0.25)";
    for (let i = 0; i < 5; i++) ctx.fillRect(24, 96 + i * 30, w - 48 - (i % 2) * 50, 10);
    ctx.fillStyle = COLORS.orange;
    ctx.font = `700 40px ${fonts.body}`;
    ctx.textAlign = "right";
    ctx.fillText("Итого ₽", w - 24, 244);
  });
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.96),
    new THREE.MeshBasicMaterial({ map: sheetTex })
  );
  sheet.position.set(0.02, 0.14, -0.01);
  g.add(sheet);

  const front = new THREE.Mesh(new RoundedBoxGeometry(1, 0.66, 0.04, 3, 0.02), glossy("#5b3cb3"));
  front.position.set(0, -0.1, 0.05);
  front.rotation.x = -0.12; // a little open
  g.add(front);
  return g;
}

// corner, spin (true = full turn, false = rocking), phase
const ITEMS = [
  { build: barChart, corner: [-1, 1], spin: true, phase: 0 },
  // the pie lies tilted towards the viewer and turns like a record
  { build: pieChart, corner: [1, 1], spin: true, spinAxis: "z", phase: 1.7, tilt: -0.9 },
  { build: calendar, corner: [-1, -1], spin: false, phase: 3.1 },
  { build: folder, corner: [1, -1], spin: false, phase: 4.4 },
];

export default function AchievementObjects() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = canvas.parentElement;
    const rootStyle = getComputedStyle(document.documentElement);
    const fonts = {
      display: rootStyle.getPropertyValue("--font-display").trim(),
      body: rootStyle.getPropertyValue("--font-body").trim(),
    };

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.z = 10;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(2, 4, 5);
    scene.add(sun);

    let items = [];
    let disposed = false;
    // build after the web fonts so the printed labels use the right face
    document.fonts.ready.then(() => {
      if (disposed) return;
      items = ITEMS.map((it) => {
        const obj = it.build(fonts);
        scene.add(obj);
        return { ...it, obj };
      });
      resize();
    });

    let viewW = 1;
    let viewH = 1;
    const resize = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      viewW = viewH * camera.aspect;
      // keep the objects about 110 px tall whatever the block size
      const scale = (110 / h) * viewH;
      items.forEach(({ obj, corner }) => {
        obj.scale.setScalar(scale);
        obj.userData.x = corner[0] * (viewW / 2 - scale * 0.9);
        obj.userData.y = corner[1] * (viewH / 2 - scale * 0.8);
      });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    resize();

    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(box);

    const start = performance.now();
    let raf;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = (performance.now() - start) / 1000;
      items.forEach(({ obj, spin, spinAxis = "y", phase, tilt = 0.35 }) => {
        obj.position.set(obj.userData.x, obj.userData.y + Math.sin(t * 0.8 + phase) * 0.06, 0);
        obj.rotation.x = tilt + Math.sin(t * 0.5 + phase) * 0.08;
        const turn = spin ? t * 0.35 + phase : Math.sin(t * 0.5 + phase) * 0.6;
        obj.rotation.y = spinAxis === "y" ? turn : 0;
        obj.rotation.z = spinAxis === "z" ? turn : 0;
      });
      renderer.render(scene, camera);
    };
    frame();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.map?.dispose();
        o.material?.dispose();
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="ach-objects" aria-hidden="true" />;
}
