"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { TessellateModifier } from "three/addons/modifiers/TessellateModifier.js";
import gsap from "gsap";
import SkillsReel from "./SkillsReel";
import { FLOATERS, createFloater } from "./heroFloaters";
import { PERSON } from "@/lib/data";

const HEADLINE = ["Острожинская", "Кристина"];

// Background gradient colours (sRGB). The same palette drives the shader and
// the tint of the glass letters.
const PALETTE = [
  [0.66, 0.36, 0.95],
  [0.27, 0.66, 0.96],
  [0.38, 0.88, 0.76],
  [0.98, 0.56, 0.3],
];
const PALETTE_SPEED = 0.03;

function paletteAt(t, out) {
  const p = (((t % 1) + 1) % 1) * 4;
  const i = Math.floor(p);
  const f = p - i;
  const s = f * f * (3 - 2 * f);
  const a = PALETTE[i];
  const b = PALETTE[(i + 1) % 4];
  return out.setRGB(
    a[0] + (b[0] - a[0]) * s,
    a[1] + (b[1] - a[1]) * s,
    a[2] + (b[2] - a[2]) * s,
    THREE.SRGBColorSpace
  );
}

const glsl = String.raw;

const MESH_VERTEX = glsl`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// full-screen passes: the plane already spans clip space
const SCREEN_VERTEX = glsl`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BG_FRAGMENT = glsl`
  uniform float uTime;
  uniform vec2 uRes;
  uniform sampler2D uText;
  varying vec2 vUv;

  vec3 palette(float t) {
    vec3 c0 = vec3(${PALETTE[0].join(", ")});
    vec3 c1 = vec3(${PALETTE[1].join(", ")});
    vec3 c2 = vec3(${PALETTE[2].join(", ")});
    vec3 c3 = vec3(${PALETTE[3].join(", ")});
    t = fract(t) * 4.0;
    if (t < 1.0) return mix(c0, c1, smoothstep(0.0, 1.0, t));
    if (t < 2.0) return mix(c1, c2, smoothstep(0.0, 1.0, t - 1.0));
    if (t < 3.0) return mix(c2, c3, smoothstep(0.0, 1.0, t - 2.0));
    return mix(c3, c0, smoothstep(0.0, 1.0, t - 3.0));
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec3 top = vec3(0.85, 0.82, 0.77);
    vec3 bottom = palette(uTime * ${PALETTE_SPEED.toFixed(3)});
    vec3 col = mix(top, bottom, smoothstep(0.2, 1.0, 1.0 - vUv.y));
    col += (hash(vUv * uRes + fract(uTime) * 100.0) - 0.5) * 0.07;
    float text = texture2D(uText, vUv).a;
    col = mix(col, vec3(0.07), text);
    // the scene renders into a linear buffer, so convert from sRGB
    gl_FragColor = sRGBTransferEOTF(vec4(col, 1.0));
  }
`;

// Pointer trail: velocity in .xy, strength in .z. Each frame the field drifts
// along itself with a slow swirl and fades; the pointer splats new velocity.
const FLOW_FRAGMENT = glsl`
  uniform sampler2D uPrev;
  uniform vec2 uPointer;
  uniform vec2 uPointerVel;
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec4 here = texture2D(uPrev, vUv);
    float a = noise(vUv * 4.0 + uTime * 0.2) * 6.2831;
    vec2 swirl = vec2(cos(a), sin(a)) * 0.004 * here.z;
    vec4 prev = texture2D(uPrev, vUv - here.xy * 0.015 - swirl);

    vec2 d = vUv - uPointer;
    d.x *= uAspect;
    float splat = exp(-dot(d, d) * 120.0);

    vec2 vel = prev.xy * 0.97 + uPointerVel * splat;
    float amount = min(prev.z * 0.97 + length(uPointerVel) * splat * 6.0, 1.0);
    gl_FragColor = vec4(vel, amount, 1.0);
  }
`;

// Final pass: the scene is pushed along the trail, with colour fringes.
const COMPOSITE_FRAGMENT = glsl`
  uniform sampler2D uScene;
  uniform sampler2D uFlow;
  varying vec2 vUv;

  void main() {
    vec2 vel = texture2D(uFlow, vUv).xy;
    vel /= max(1.0, length(vel) / 0.2);
    vec2 uv = vUv - vel * 0.3;
    vec2 fringe = vel * 0.06;

    vec4 col = texture2D(uScene, uv);
    col.r = texture2D(uScene, uv + fringe).r;
    col.b = texture2D(uScene, uv - fringe).b;
    gl_FragColor = col;
    #include <colorspace_fragment>
  }
`;

// Letters "OK" (the initials), drawn as outlines in the proportions of a bold
// condensed face, extruded with a round bevel and finely tessellated so the
// surface can flow.
const LETTERS_WIDTH = 3.32;

function buildLetters() {
  const o = new THREE.Shape();
  o.absellipse(-0.9, 0, 0.72, 1, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(-0.9, 0, 0.34, 0.6, 0, Math.PI * 2, true, 0);
  o.holes.push(hole);

  const k = new THREE.Shape();
  [
    [0, -1], [0, 1], [0.42, 1], [0.42, 0.18], [0.95, 1], [1.42, 1],
    [0.82, 0.08], [1.46, -1], [0.98, -1], [0.55, -0.26], [0.42, -0.08], [0.42, -1],
  ].forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y)));
  k.closePath();

  let geo = new THREE.ExtrudeGeometry([o, k], {
    depth: 0.45,
    bevelEnabled: true,
    bevelThickness: 0.22,
    bevelSize: 0.12,
    bevelSegments: 10,
    curveSegments: 64,
  });
  geo.center();
  geo = new TessellateModifier(0.09, 8).modify(geo);
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  geo = mergeVertices(geo);
  geo.computeVertexNormals();
  return geo;
}

export default function Hero() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const rootStyle = getComputedStyle(document.documentElement);
    const fonts = {
      display: rootStyle.getPropertyValue("--font-display").trim(),
      body: rootStyle.getPropertyValue("--font-body").trim(),
      hand: rootStyle.getPropertyValue("--font-hand").trim(),
    };

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 10;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(3, 4, 5);
    scene.add(sun);

    // ---------- background: gradient + grain + headline ----------
    const textCanvas = document.createElement("canvas");
    const textTex = new THREE.CanvasTexture(textCanvas);
    const bgMat = new THREE.ShaderMaterial({
      vertexShader: MESH_VERTEX,
      fragmentShader: BG_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uText: { value: textTex },
      },
    });
    const BG_Z = -2;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bgMat);
    bg.position.z = BG_Z;
    scene.add(bg);

    const drawHeadline = () => {
      const w = 2048;
      const h = Math.round((w * section.clientHeight) / section.clientWidth);
      textCanvas.width = w;
      textCanvas.height = h;
      const ctx = textCanvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      const lines = HEADLINE.map((l) => l.toUpperCase());
      ctx.font = `600 100px ${fonts.display}`;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const size = Math.min((100 * w * 0.96) / widest, h * 0.3);
      ctx.font = `600 ${size}px ${fonts.display}`;
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      const ascent = ctx.measureText(lines[0]).actualBoundingBoxAscent;
      lines.forEach((line, i) =>
        ctx.fillText(line, w / 2, h * 0.12 + ascent + i * size * 0.98)
      );
      textTex.needsUpdate = true;
    };

    // ---------- liquid glass letters ----------
    const glassGeo = buildLetters();
    const base = glassGeo.attributes.position.array.slice();
    const baseNormal = glassGeo.attributes.normal.array.slice();
    const tint = new THREE.Color();
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 1,
      thickness: 0.6,
      roughness: 0.03,
      ior: 1.18,
      dispersion: 2,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color(),
      attenuationDistance: 1.4,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    scene.add(glass);
    const noise = new SimplexNoise();

    // ---------- falling elements ----------
    const floaters = [];
    const disposables = [];
    let disposed = false;
    let viewW = 1;
    let viewH = 1;

    // All stickers fly at one depth, in front of the glass letters (so they
    // never cut through them). Sizes and screen edges are measured there.
    const FLOAT_Z = 1.4;
    const MAX_TILT = 0.6; // |base rotation| + rocking, radians
    const halfAt = () => {
      const h = (camera.position.z - FLOAT_Z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      return { x: h * camera.aspect, y: h };
    };
    // half extents of a sticker's outline turned by `rot`
    const box = (f, rot) => {
      const c = Math.abs(Math.cos(rot));
      const s = Math.abs(Math.sin(rot));
      return [(f.w * c + f.h * s) / 2, (f.w * s + f.h * c) / 2];
    };
    const widest = (f) => Math.max(box(f, 0)[0], box(f, MAX_TILT)[0]);
    // how far the centre may go sideways and still stay fully on screen
    const xLimit = (f) => Math.max(halfAt().x - widest(f) - f.swayAmp - 0.1, 0);

    const clashAt = (f, x, y) =>
      floaters.some((o) => {
        if (o === f) return false;
        const [ow, oh] = box(o, MAX_TILT);
        const [fw, fh] = box(f, MAX_TILT);
        return Math.abs(o.x - x) < ow + fw + o.swayAmp + f.swayAmp && Math.abs(o.y - y) < oh + fh;
      });

    // drop a sticker in from above at a free spot
    const respawn = (f, initialY = null) => {
      f.speed = 0.2 + Math.random() * 0.04; // nearly equal, so they rarely catch up
      f.swayAmp = 0.1 + Math.random() * 0.2;
      f.swayFreq = 0.25 + Math.random() * 0.3;
      f.baseRot = (Math.random() - 0.5) * 0.5;
      f.rockFreq = 0.2 + Math.random() * 0.25;
      f.phase = Math.random() * Math.PI * 2;
      const limit = xLimit(f);
      let y = initialY ?? halfAt().y + box(f, MAX_TILT)[1] + Math.random() * 1.2;
      let x = 0;
      for (let tries = 0; tries < 30; tries++) {
        x = (Math.random() * 2 - 1) * limit;
        if (!clashAt(f, x, y)) break;
        if (initialY === null && tries % 6 === 5) y += 0.8; // crowded: start higher
      }
      f.x = x;
      f.y = y;
    };

    const buildFloaters = () => {
      FLOATERS.forEach(async (def, i) => {
        const item = await createFloater(def, fonts);
        if (disposed) {
          item.disposables.forEach((d) => d.dispose());
          return;
        }
        disposables.push(...item.disposables);
        scene.add(item.mesh);
        const { width, height } = item.mesh.geometry.parameters;
        const f = {
          mesh: item.mesh,
          def,
          tick: item.tick,
          w: width * item.mesh.scale.x,
          h: height * item.mesh.scale.y,
        };
        // start spread over the whole height so the screen is never empty
        const top = halfAt().y;
        const startY = top - ((i + Math.random() * 0.7) / FLOATERS.length) * (top * 2 + 1);
        respawn(f, startY);
        floaters.push(f);
      });
    };
    // wait for the web fonts so sticker texts are drawn in the right face
    document.fonts.ready.then(() => !disposed && buildFloaters());

    // ---------- pointer trail (liquid glass) ----------
    const pointer = new THREE.Vector2(0.5, 0.5);
    const lastPointer = new THREE.Vector2(0.5, 0.5);
    let pointerInside = false;

    const onMove = (e) => {
      const r = section.getBoundingClientRect();
      pointer.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      if (!pointerInside) lastPointer.copy(pointer);
      pointerInside = true;
    };
    const onLeave = () => {
      pointerInside = false;
    };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);

    // ---------- render targets & full-screen passes ----------
    const sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    const flowOpts = { type: THREE.HalfFloatType, depthBuffer: false };
    let flowA = new THREE.WebGLRenderTarget(1, 1, flowOpts);
    let flowB = new THREE.WebGLRenderTarget(1, 1, flowOpts);

    const screenCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const screenScene = new THREE.Scene();
    const flowMat = new THREE.ShaderMaterial({
      vertexShader: SCREEN_VERTEX,
      fragmentShader: FLOW_FRAGMENT,
      uniforms: {
        uPrev: { value: null },
        uPointer: { value: pointer },
        uPointerVel: { value: new THREE.Vector2() },
        uAspect: { value: 1 },
        uTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const compositeMat = new THREE.ShaderMaterial({
      vertexShader: SCREEN_VERTEX,
      fragmentShader: COMPOSITE_FRAGMENT,
      uniforms: {
        uScene: { value: sceneRT.texture },
        uFlow: { value: null },
      },
      depthTest: false,
      depthWrite: false,
    });
    const screenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), flowMat);
    screenScene.add(screenQuad);

    // ---------- "ОК" flies into the header logo and back ----------
    // ok.p: 1 = in the centre, 0 = shrunk inside the header logo.
    // The page opens with the letters hidden; the header logo brings them out.
    const ok = { p: 0 };
    const tmp = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const zeroPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const logoPoint = new THREE.Vector3();

    const locateLogo = () => {
      const el = document.querySelector(".hd-logo");
      if (!el) return;
      const lr = el.getBoundingClientRect();
      const sr = section.getBoundingClientRect();
      tmp.set(
        ((lr.left + lr.width / 2 - sr.left) / sr.width) * 2 - 1,
        -((lr.top + lr.height / 2 - sr.top) / sr.height) * 2 + 1
      );
      raycaster.setFromCamera(tmp, camera);
      raycaster.ray.intersectPlane(zeroPlane, logoPoint);
    };

    const onClick = (e) => {
      if (ok.p < 0.99) return;
      const r = section.getBoundingClientRect();
      tmp.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(tmp, camera);
      if (raycaster.intersectObject(glass, false).length) {
        gsap.to(ok, { p: 0, duration: 1.1, ease: "power3.inOut", overwrite: true });
      }
    };
    const onShow = () => {
      gsap.to(ok, { p: 1, duration: 1.2, ease: "power3.inOut", overwrite: true });
    };
    section.addEventListener("click", onClick);
    window.addEventListener("ok:show", onShow);

    // ---------- layout ----------
    let glassScale = 1;
    const drawSize = new THREE.Vector2();
    const resize = () => {
      const w = section.clientWidth;
      const h = section.clientHeight;
      renderer.setSize(w, h, false);
      renderer.getDrawingBufferSize(drawSize);
      sceneRT.setSize(drawSize.x, drawSize.y);
      const flowW = 256;
      const flowH = Math.max(1, Math.round((flowW * h) / w));
      flowA.setSize(flowW, flowH);
      flowB.setSize(flowW, flowH);
      flowMat.uniforms.uAspect.value = w / h;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const bgH = 2 * tanHalf * (camera.position.z - BG_Z);
      bg.scale.set(bgH * camera.aspect, bgH, 1);
      bgMat.uniforms.uRes.value.set(w, h);
      viewH = 2 * tanHalf * camera.position.z;
      viewW = viewH * camera.aspect;
      const target = Math.min(viewW * 0.26, viewH * 0.44);
      glassScale = target / LETTERS_WIDTH;
      drawHeadline();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(section);
    resize();
    document.fonts.ready.then(() => !disposed && drawHeadline());

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(section);

    // ---------- loop ----------
    const start = performance.now();
    let last = start;
    const pos = glassGeo.attributes.position;
    let raf;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      const t = (now - start) / 1000;
      bgMat.uniforms.uTime.value = t;

      // glass: tinted by the current background colour, slow full turn
      paletteAt(t * PALETTE_SPEED, tint);
      glassMat.attenuationColor.copy(tint);
      glassMat.color.setRGB(1, 1, 1).lerp(tint, 0.35);

      locateLogo();
      glass.position.copy(logoPoint).multiplyScalar(1 - ok.p);
      glass.scale.setScalar(glassScale * (0.06 + 0.94 * ok.p));
      glass.visible = ok.p > 0.01;
      glass.rotation.y = t * 0.15;
      glass.rotation.x = Math.sin(t * 0.3) * 0.08;

      // liquid surface: broad slow swell + fine ripple along the normals
      if (glass.visible) {
        for (let i = 0; i < pos.count; i++) {
          const j = i * 3;
          const bx = base[j];
          const by = base[j + 1];
          const bz = base[j + 2];
          const k =
            noise.noise3d(bx * 0.9 + t * 0.18, by * 0.9 - t * 0.12, bz * 0.9) * 0.13 +
            noise.noise3d(bx * 2.2, by * 2.2 + t * 0.3, bz * 2.2) * 0.03;
          pos.setXYZ(i, bx + baseNormal[j] * k, by + baseNormal[j + 1] * k, bz + baseNormal[j + 2] * k);
        }
        pos.needsUpdate = true;
        glassGeo.computeVertexNormals();
      }

      // falling elements: slow drop with sideways sway, back to the top below
      const bottom = -halfAt().y;
      floaters.forEach((f) => {
        f.y -= f.speed * dt;
        if (f.y < bottom - box(f, MAX_TILT)[1]) respawn(f);
        // gentle rocking in the screen plane (about ±20°)
        f.rot = f.baseRot + Math.sin(t * f.rockFreq + f.phase) * 0.35;
        f.sway = Math.sin(t * f.swayFreq + f.phase) * f.swayAmp;
      });

      // stickers may touch but not overlap: move overlapping pairs apart
      // sideways, or, when there is no room at the edge, let the upper one wait
      for (let i = 0; i < floaters.length; i++) {
        for (let j = i + 1; j < floaters.length; j++) {
          const a = floaters[i];
          const b = floaters[j];
          const [aw, ah] = box(a, a.rot);
          const [bw, bh] = box(b, b.rot);
          const dx = b.x + b.sway - (a.x + a.sway);
          const dy = b.y - a.y;
          const overX = aw + bw - Math.abs(dx);
          const overY = ah + bh - Math.abs(dy);
          if (overX <= 0 || overY <= 0) continue;
          const push = (overX / 2) * (dx >= 0 ? 1 : -1);
          const roomA = Math.abs(a.x - push) <= xLimit(a);
          const roomB = Math.abs(b.x + push) <= xLimit(b);
          if (overX < overY && roomA && roomB) {
            a.x -= push;
            b.x += push;
          } else if (dy >= 0) {
            b.y += overY;
          } else {
            a.y += overY;
          }
        }
      }

      floaters.forEach((f) => {
        const limit = xLimit(f);
        f.x = Math.min(Math.max(f.x, -limit), limit);
        f.mesh.position.set(f.x + f.sway, f.y, FLOAT_Z);
        // only a hint of tilt besides the rocking
        f.mesh.rotation.set(
          Math.sin(t * 0.4 + f.phase) * 0.1,
          Math.cos(t * 0.35 + f.phase) * 0.12,
          f.rot
        );
        f.tick?.(t);
      });

      // 1. the scene itself
      renderer.setRenderTarget(sceneRT);
      renderer.render(scene, camera);

      // 2. pointer trail
      const vel = flowMat.uniforms.uPointerVel.value;
      if (pointerInside) vel.subVectors(pointer, lastPointer).multiplyScalar(2.5);
      else vel.set(0, 0);
      lastPointer.copy(pointer);
      flowMat.uniforms.uPrev.value = flowA.texture;
      flowMat.uniforms.uTime.value = t;
      screenQuad.material = flowMat;
      renderer.setRenderTarget(flowB);
      renderer.render(screenScene, screenCam);
      [flowA, flowB] = [flowB, flowA];

      // 3. composite to the screen
      compositeMat.uniforms.uFlow.value = flowA.texture;
      screenQuad.material = compositeMat;
      renderer.setRenderTarget(null);
      renderer.render(screenScene, screenCam);
    };
    frame();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("click", onClick);
      window.removeEventListener("ok:show", onShow);
      gsap.killTweensOf(ok);
      disposables.forEach((d) => d.dispose());
      [sceneRT, flowA, flowB].forEach((rt) => rt.dispose());
      [flowMat, compositeMat, glassMat, bgMat].forEach((m) => m.dispose());
      screenQuad.geometry.dispose();
      glassGeo.dispose();
      bg.geometry.dispose();
      textTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero">
      <canvas ref={canvasRef} className="hero-canvas" />
      <h1 className="sr-only">
        {PERSON.name} — {PERSON.roleEn}
      </h1>

      <SkillsReel />

      <p className="hero-tag">
        <strong>{PERSON.roleEn}</strong>
        <em>10+ лет управленческого опыта</em>
      </p>
    </section>
  );
}
