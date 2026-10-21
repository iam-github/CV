// Floating elements of the hero, following the logic of the reference set:
// - every element is a sticker with the same white die-cut edge;
// - neutral silver (inflated chrome shapes) carries the set;
// - each colour appears once and is muted (deep violet, brick orange, cream);
// - 3D keycaps, a "key + key" combo, flat logos, one black script sticker.
// Positions are not set here: the hero lets them fall like in water.

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { siClaude, siGoogle } from "simple-icons";

// `s` is the sticker's height in world units
export const FLOATERS = [
  { kind: "key", label: "KPI", arrow: true, color: "#4a2c9c", ink: "#ffffff", s: 0.95 },
  {
    kind: "combo",
    keys: [
      { label: "Digital", color: "#262626", ink: "#ffffff" },
      { label: "Маркетинг", color: "#d8692f", ink: "#ffffff" },
    ],
    s: 0.62,
  },
  { kind: "chrome", shape: "sparkle", s: 0.8 },
  { kind: "chrome", shape: "arrow", s: 0.85 },
  { kind: "level", mark: "C1", label: "English", s: 0.5 },
  { kind: "hand", lines: ["От сметы", "до запуска"], color: "#111111", ink: "#ffffff", s: 0.78 },
  { kind: "file", src: "/logos/ChatGPT_logo.svg", s: 0.72 },
  { kind: "google", icon: siGoogle, s: 0.7 },
  { kind: "shape", icon: siClaude, color: `#${siClaude.hex}`, s: 0.72 },
  { kind: "file", src: "/logos/Yandex_icon.svg", s: 0.74 },
];

// ---------- canvas helpers ----------

function canvas2d(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  return [c, c.getContext("2d", { willReadFrequently: true })];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawIcon(ctx, icon, cx, cy, size) {
  const s = size / 24; // Simple Icons paths live in a 24×24 box
  ctx.save();
  ctx.translate(cx - 12 * s, cy - 12 * s);
  ctx.scale(s, s);
  ctx.fill(new Path2D(icon.path));
  ctx.restore();
}

// crop an image to its visible pixels
function trim(c) {
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0) return c;
  const [out, octx] = canvas2d(x1 - x0 + 1, y1 - y0 + 1);
  octx.drawImage(c, -x0, -y0);
  return out;
}

// thick white die-cut edge around the artwork's silhouette, plus a soft shadow
function dieCut(art) {
  const border = Math.round(Math.min(art.width, art.height) * 0.06);
  const pad = border + 26;
  const W = art.width + pad * 2;
  const H = art.height + pad * 2;
  const [sil, s] = canvas2d(W, H);
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    s.drawImage(art, pad + Math.cos(a) * border, pad + Math.sin(a) * border);
  }
  s.globalCompositeOperation = "source-in";
  s.fillStyle = "#ffffff";
  s.fillRect(0, 0, W, H);

  const [c, ctx] = canvas2d(W, H);
  ctx.shadowColor = "rgba(0,0,0,0.24)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 9;
  ctx.drawImage(sil, 0, 0);
  ctx.shadowColor = "transparent";
  ctx.drawImage(art, pad, pad);
  return c;
}

function sticker(art, s) {
  const c = dieCut(art);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(c.width / c.height, 1);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    toneMapped: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.setScalar(s);
  return { mesh, disposables: [geo, mat, tex] };
}

// ---------- one-off 3D renders (keys, combo, chrome) ----------

// High-contrast "studio" for chrome: dark floor, bright sky, two softboxes.
// Chrome only looks like chrome when it has something dark and bright to reflect.
function studioScene() {
  const scene = new THREE.Scene();
  const [c, ctx] = canvas2d(16, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.5, "#dfe2e6");
  g.addColorStop(0.62, "#8a8f96");
  g.addColorStop(0.75, "#2a2c30");
  g.addColorStop(1, "#0a0a0b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  const sky = new THREE.CanvasTexture(c);
  sky.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide })
  );
  scene.add(dome);
  const panel = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // one softbox behind the camera lights the front, one at the side
  [[0, 2, 8], [-6, 3, 4]].forEach(([x, y, z]) => {
    const box = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.5), panel);
    box.position.set(x, y, z);
    box.lookAt(0, 0, 0);
    scene.add(box);
  });
  return scene;
}

// renders a small scene once, returns the image cropped to its content
function render3D(w, h, build, { studio = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envSource = studio ? studioScene() : new RoomEnvironment();
  const env = pmrem.fromScene(envSource, 0.04).texture;
  if (studio) {
    envSource.traverse((o) => {
      o.geometry?.dispose();
      o.material?.map?.dispose();
      o.material?.dispose();
    });
  }
  scene.environment = env;
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 3, 4);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 20);

  const disposables = build(scene, camera);
  renderer.render(scene, camera);

  const [c, ctx] = canvas2d(w, h);
  ctx.drawImage(renderer.domElement, 0, 0);
  [...disposables, env, pmrem].forEach((d) => d.dispose());
  renderer.dispose();
  renderer.forceContextLoss();
  return trim(c);
}

const chromeMaterial = () =>
  new THREE.MeshPhysicalMaterial({
    color: "#f1f1f1",
    metalness: 1,
    roughness: 0.1,
    envMapIntensity: 1.3,
  });

// printed top of a keycap: the label (fitted to the width) and an optional arrow
function keyFace(key, aspect, fonts) {
  const H = 256;
  const W = Math.round(H * aspect);
  const [c, ctx] = canvas2d(W, H);
  ctx.fillStyle = key.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const narrow = key.label.length > 3;
  const family = narrow ? fonts.display : fonts.body;
  ctx.font = `600 100px ${family}`;
  const fit = (100 * W * 0.84) / ctx.measureText(key.label).width;
  const size = Math.min(key.arrow ? 92 : 118, fit);
  ctx.font = `${narrow ? 600 : 700} ${size}px ${family}`;
  ctx.fillText(key.label, W / 2, key.arrow ? H * 0.38 : H * 0.53);
  if (key.arrow) {
    // small up arrow under the label, like the SHIFT key
    const cx = W / 2;
    ctx.beginPath();
    ctx.moveTo(cx, H * 0.6);
    ctx.lineTo(cx + 34, H * 0.76);
    ctx.lineTo(cx + 13, H * 0.76);
    ctx.lineTo(cx + 13, H * 0.88);
    ctx.lineTo(cx - 13, H * 0.88);
    ctx.lineTo(cx - 13, H * 0.76);
    ctx.lineTo(cx - 34, H * 0.76);
    ctx.closePath();
    ctx.fill();
  }
  return c;
}

// tapered keycap (`width` × 1, the top narrower than the base) with its print
function keycap(key, width, fonts) {
  const geo = new RoundedBoxGeometry(width, 1, 0.62, 6, 0.16);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = Math.max(0, (p.getZ(i) + 0.31) / 0.62);
    p.setXY(i, p.getX(i) * (1 - (0.2 * t) / width), p.getY(i) * (1 - 0.2 * t));
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({
    color: key.color,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const cap = new THREE.Mesh(geo, mat);
  const faceW = width - 0.38;
  const tex = new THREE.CanvasTexture(keyFace(key, faceW / 0.62, fonts));
  tex.colorSpace = THREE.SRGBColorSpace;
  const faceMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(faceW, 0.62), faceMat);
  top.position.z = 0.312;
  cap.add(top);
  return [cap, [geo, mat, tex, faceMat, top.geometry]];
}

function keyArt(def, fonts) {
  return render3D(440, 440, (scene, camera) => {
    const [cap, disposables] = keycap(def, 1, fonts);
    cap.rotation.set(0.55, -0.28, 0.12); // three-quarter view
    scene.add(cap);
    camera.position.z = 3.05;
    return disposables;
  });
}

// two wide keycaps joined by a chrome plus, like "ALT + SHIFT"
function comboArt(def, fonts) {
  return render3D(900, 380, (scene, camera) => {
    const disposables = [];
    const group = new THREE.Group();
    def.keys.forEach((key, i) => {
      const [cap, d] = keycap(key, 1.75, fonts);
      cap.position.x = (i === 0 ? -1 : 1) * 1.28;
      group.add(cap);
      disposables.push(...d);
    });
    const plus = new THREE.Shape();
    [[-0.1, 0.32], [0.1, 0.32], [0.1, 0.1], [0.32, 0.1], [0.32, -0.1], [0.1, -0.1],
      [0.1, -0.32], [-0.1, -0.32], [-0.1, -0.1], [-0.32, -0.1], [-0.32, 0.1], [-0.1, 0.1]]
      .forEach(([x, y], i) => (i ? plus.lineTo(x, y) : plus.moveTo(x, y)));
    const plusGeo = new THREE.ExtrudeGeometry(plus, {
      depth: 0.08, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.06, bevelSegments: 8,
    });
    plusGeo.center();
    const plusMat = chromeMaterial();
    const plusMesh = new THREE.Mesh(plusGeo, plusMat);
    plusMesh.position.z = 0.2;
    group.add(plusMesh);
    disposables.push(plusGeo, plusMat);
    group.rotation.set(0.5, -0.12, 0.04);
    scene.add(group);
    camera.position.z = 5.4;
    return disposables;
  });
}

// inflated chrome shapes: a four-point sparkle and an up-right arrow
function chromeShape(name) {
  const s = new THREE.Shape();
  if (name === "sparkle") {
    s.moveTo(0, 1);
    s.quadraticCurveTo(0.12, 0.12, 1, 0);
    s.quadraticCurveTo(0.12, -0.12, 0, -1);
    s.quadraticCurveTo(-0.12, -0.12, -1, 0);
    s.quadraticCurveTo(-0.12, 0.12, 0, 1);
  } else {
    [[-0.17, -0.95], [0.17, -0.95], [0.17, 0.15], [0.5, 0.15], [0, 0.95], [-0.5, 0.15], [-0.17, 0.15]]
      .forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
  }
  return s;
}

function chromeArt(def) {
  return render3D(440, 440, (scene, camera) => {
    const geo = new THREE.ExtrudeGeometry(chromeShape(def.shape), {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.14,
      bevelSegments: 14,
      curveSegments: 48,
    });
    geo.center();
    const mat = chromeMaterial();
    const mesh = new THREE.Mesh(geo, mat);
    // lean the face slightly up so it mirrors the bright sky, not the floor
    mesh.rotation.set(-0.3, -0.3, def.shape === "arrow" ? -0.75 : 0.2);
    scene.add(mesh);
    camera.position.z = 5;
    return [geo, mat];
  }, { studio: true });
}

// ---------- flat stickers ----------

async function fileArt(def) {
  const img = await loadImage(def.src);
  const [art, ctx] = canvas2d(240, 240);
  ctx.drawImage(img, 0, 0, 240, 240);
  return art;
}

// Google "G" in its four brand colours
function googleArt(def) {
  const S = 240;
  const c0 = S / 2;
  const [art, ctx] = canvas2d(S, S);
  // angles in canvas degrees: 0 = right, 90 = down
  const sectors = [
    ["#4285F4", -40, 40], // the bar and the lower right
    ["#34A853", 40, 150], // bottom
    ["#FBBC05", 150, 205], // left
    ["#EA4335", 205, 320], // top
  ];
  sectors.forEach(([color, a0, a1]) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c0, c0);
    ctx.arc(c0, c0, S, (a0 * Math.PI) / 180, (a1 * Math.PI) / 180);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = color;
    drawIcon(ctx, def.icon, c0, c0, S);
    ctx.restore();
  });
  return art;
}

// a single-colour logo cut out along its own outline
function shapeArt(def) {
  const S = 240;
  const [art, ctx] = canvas2d(S, S);
  ctx.fillStyle = def.color;
  drawIcon(ctx, def.icon, S / 2, S / 2, S);
  return art;
}

// rounded sticker with handwritten text
function handArt(def, fonts) {
  const font = `700 84px ${fonts.hand}`;
  const [, probe] = canvas2d(8, 8);
  probe.font = font;
  const textW = Math.max(...def.lines.map((l) => probe.measureText(l).width));
  const lineH = 72;
  const W = textW + 70;
  const H = def.lines.length * lineH + 50;
  const [art, ctx] = canvas2d(W, H);
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 26);
  ctx.fill();
  ctx.fillStyle = def.ink;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const top = H / 2 - ((def.lines.length - 1) * lineH) / 2;
  def.lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lineH + 4));
  return art;
}

// cream plate: a dark round mark ("C1") and a large word next to it
function levelArt(def, fonts) {
  const ink = "#2b2622";
  const cream = "#efe7d6";
  const H = 160;
  const word = def.label.toUpperCase();
  const wordFont = `600 92px ${fonts.display}`;
  const [, probe] = canvas2d(8, 8);
  probe.font = wordFont;
  const W = H + probe.measureText(word).width + 56;
  const [art, ctx] = canvas2d(W, H);
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, H / 2);
  ctx.fill();
  // the mark
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(H / 2, H / 2, H / 2 - 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cream;
  ctx.font = `600 70px ${fonts.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(def.mark, H / 2, H / 2 + 3);
  // the word
  ctx.fillStyle = ink;
  ctx.font = wordFont;
  ctx.textAlign = "left";
  ctx.fillText(word, H + 10, H / 2 + 4);
  return art;
}

// ---------- factory ----------

export async function createFloater(def, fonts) {
  switch (def.kind) {
    case "key":
      return sticker(keyArt(def, fonts), def.s);
    case "combo":
      return sticker(comboArt(def, fonts), def.s);
    case "chrome":
      return sticker(chromeArt(def), def.s);
    case "level":
      return sticker(levelArt(def, fonts), def.s);
    case "hand":
      return sticker(handArt(def, fonts), def.s);
    case "file":
      return sticker(await fileArt(def), def.s);
    case "google":
      return sticker(googleArt(def), def.s);
    case "shape":
      return sticker(shapeArt(def), def.s);
    default:
      throw new Error(`Unknown floater kind: ${def.kind}`);
  }
}
