"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import {
  Phone,
  Particles,
  LightRing,
  FloorGrid,
  EarbudsCase,
  Earbud,
  Watch,
  ChargeCable,
  Glow,
} from "./objects";
import { journey, getQuality, type WorldKey, type ExploreKey } from "./journey-state";

/* ------------------------------------------------------------------ */
/* Shared studio environment (procedural, offline)                     */
/* ------------------------------------------------------------------ */

export function StudioEnv() {
  const q = getQuality();
  return (
    <Environment resolution={q.low ? 64 : 128} frames={1}>
      <Lightformer intensity={2.2} color="#f3ebdd" position={[0, 5, -4]} scale={[12, 2, 1]} />
      <Lightformer intensity={1.6} color="#d8b98a" position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 1.2, 1]} />
      <Lightformer intensity={1.2} color="#a5313f" position={[6, -1, 2]} rotation-y={-Math.PI / 2} scale={[8, 1.2, 1]} />
      <Lightformer intensity={0.8} color="#ffffff" position={[0, -5, 2]} rotation-x={Math.PI / 2} scale={[10, 1, 1]} form="ring" />
      <Lightformer intensity={0.5} color="#f3ebdd" position={[0, 0, 6]} scale={[3, 3, 1]} form="circle" />
    </Environment>
  );
}

/* ------------------------------------------------------------------ */
/* World configuration                                                 */
/* ------------------------------------------------------------------ */

type V3 = [number, number, number];
type PhoneT = { p: V3; r: V3; s: number };
type Cfg = {
  cam: V3;
  key: string;
  keyI: number;
  rim: string;
  amb: number;
  phones: PhoneT[]; // 3 hero phones
  rows: number; // showroom back rows visibility
  ring: { s: number; o: number; speed: number; color: string; rx: number; y: number };
  cone: number;
  grid: number;
  net: number;
  buds: number;
  watch: number;
  cable: number;
  accY: number;
  pColor: string;
  pOpacity: number;
};

const HIDDEN: PhoneT = { p: [0, -7, -3], r: [0, 0, 0], s: 0.001 };

const base: Cfg = {
  cam: [0, 0.2, 6.5],
  key: "#c9a961",
  keyI: 2.4,
  rim: "#f3ebdd",
  amb: 0.35,
  phones: [
    { p: [0, -0.1, 0], r: [0.06, -0.4, 0.08], s: 1.15 },
    { p: [-2.4, 0.7, -1.6], r: [0.1, 0.6, -0.25], s: 0.8 },
    { p: [2.5, -0.9, -1.9], r: [-0.1, -0.7, 0.2], s: 0.75 },
  ],
  rows: 0,
  ring: { s: 2.2, o: 0.5, speed: 0.35, color: "#c9a961", rx: 0, y: 0 },
  cone: 0,
  grid: 0,
  net: 0,
  buds: 0,
  watch: 0,
  cable: 0,
  accY: 0,
  pColor: "#d8b98a",
  pOpacity: 0.7,
};

const WORLDS: Record<WorldKey, Cfg> = {
  hero: base,
  deals: {
    ...base,
    cam: [0, 0, 6.2],
    key: "#ff5a3c",
    keyI: 4,
    rim: "#ffd7a8",
    amb: 0.25,
    phones: [
      { p: [0, -0.2, 0.4], r: [0.05, 0, -0.12], s: 1.05 },
      { p: [-1.5, 0.1, -0.8], r: [0, 0.55, -0.35], s: 0.9 },
      { p: [1.5, 0.1, -0.8], r: [0, -0.55, 0.35], s: 0.9 },
    ],
    ring: { s: 1.9, o: 1, speed: 3.2, color: "#ff7a5c", rx: 0.2, y: -0.1 },
    pColor: "#ffb08a",
    pOpacity: 0.9,
  },
  new: {
    ...base,
    cam: [0, 0.3, 5.6],
    key: "#f3ebdd",
    keyI: 3,
    rim: "#d8b98a",
    amb: 0.2,
    phones: [{ p: [0, 0, 0.8], r: [0.12, Math.PI * 0.9, 0], s: 1.2 }, HIDDEN, HIDDEN],
    ring: { s: 1.4, o: 0.35, speed: 0.6, color: "#f3ebdd", rx: Math.PI / 2, y: -1.6 },
    cone: 1,
    pColor: "#f3ebdd",
    pOpacity: 0.45,
  },
  store: {
    ...base,
    cam: [0, 1.3, 7.2],
    key: "#d8b98a",
    keyI: 2.6,
    rim: "#f3ebdd",
    amb: 0.4,
    phones: [
      { p: [0, -0.55, 0.2], r: [0, 0, 0], s: 0.95 },
      { p: [-2, -0.55, -1.2], r: [0, 0.45, 0], s: 0.95 },
      { p: [2, -0.55, -1.2], r: [0, -0.45, 0], s: 0.95 },
    ],
    rows: 1,
    ring: { s: 0.001, o: 0, speed: 0.3, color: "#c9a961", rx: 0, y: 0 },
    grid: 1,
    pColor: "#d8b98a",
    pOpacity: 0.35,
  },
  gallery: {
    ...base,
    cam: [0, 0.2, 8.5],
    key: "#e8b98a",
    keyI: 1.5,
    rim: "#f3ebdd",
    amb: 0.55,
    phones: [
      { p: [-3.4, 1.4, -3], r: [0.2, 0.9, 0], s: 0.6 },
      { p: [3.6, -1.2, -3.5], r: [0, -0.9, 0.2], s: 0.55 },
      HIDDEN,
    ],
    ring: { s: 0.001, o: 0, speed: 0.3, color: "#c9a961", rx: 0, y: 0 },
    pColor: "#f0c9a0",
    pOpacity: 0.9,
  },
  partner: {
    ...base,
    cam: [0, 0.4, 7.4],
    key: "#c9a961",
    keyI: 3,
    rim: "#f3ebdd",
    amb: 0.3,
    phones: [
      { p: [0, 1.1, -0.6], r: [0.1, 0, 0], s: 0.7 },
      { p: [-2.3, -0.9, 0], r: [0, 0.5, 0], s: 0.7 },
      { p: [2.3, -0.9, 0], r: [0, -0.5, 0], s: 0.7 },
    ],
    ring: { s: 3.1, o: 0.7, speed: 0.5, color: "#c9a961", rx: Math.PI / 2.4, y: -0.2 },
    net: 1,
    pColor: "#e9d3a6",
    pOpacity: 0.6,
  },
  explore: base,
  creative: {
    ...base,
    cam: [0, 0, 8],
    keyI: 1.2,
    amb: 0.25,
    phones: [HIDDEN, HIDDEN, HIDDEN],
    ring: { s: 0.001, o: 0, speed: 0.3, color: "#c9a961", rx: 0, y: 0 },
    pOpacity: 0.5,
  },
  footer: {
    ...base,
    cam: [0, 0, 8],
    keyI: 1,
    amb: 0.2,
    phones: [HIDDEN, HIDDEN, HIDDEN],
    ring: { s: 0.001, o: 0, speed: 0.3, color: "#c9a961", rx: 0, y: 0 },
    pOpacity: 0.35,
  },
};

const EXPLORE: Record<ExploreKey, Partial<Cfg>> = {
  all: {
    cam: [0, 0.2, 7],
    phones: [
      { p: [0, -0.1, 0.4], r: [0, 0, 0], s: 1 },
      { p: [-1.9, 0.1, -0.7], r: [0, 0.5, 0], s: 0.95 },
      { p: [1.9, 0.1, -0.7], r: [0, -0.5, 0], s: 0.95 },
    ],
    ring: { s: 2.6, o: 0.4, speed: 0.4, color: "#c9a961", rx: Math.PI / 2, y: -1.4 },
  },
  apple: {
    cam: [0, 0.3, 5.2],
    key: "#f3ebdd",
    keyI: 3.2,
    phones: [{ p: [0.35, 0.15, 1.2], r: [0.25, Math.PI - 0.55, 0.08], s: 1.25 }, HIDDEN, HIDDEN],
    ring: { s: 1.2, o: 0.5, speed: 0.8, color: "#f3ebdd", rx: 0.3, y: 0.3 },
    pColor: "#f3ebdd",
    pOpacity: 0.4,
  },
  samsung: {
    cam: [0, 0.1, 5.6],
    key: "#b9d7ff",
    keyI: 3,
    phones: [
      { p: [0, 0, 1], r: [0, -0.18, 0], s: 1.3 },
      { p: [-1.9, 0.2, -0.6], r: [0, 0.6, 0], s: 0.9 },
      HIDDEN,
    ],
    ring: { s: 2, o: 0.5, speed: 1, color: "#d8e6ff", rx: 0, y: 0 },
    pColor: "#dce8ff",
    pOpacity: 0.5,
  },
  xiaomi: {
    cam: [0, 0.3, 6.8],
    key: "#ffb26b",
    keyI: 2.8,
    phones: [{ p: [0, -0.1, 0], r: [0.05, Math.PI + 0.35, 0], s: 1.05 }, HIDDEN, HIDDEN],
    ring: { s: 2.4, o: 0.8, speed: 0.7, color: "#ffb26b", rx: Math.PI / 2.2, y: -0.2 },
    buds: 1,
    watch: 1,
    cable: 1,
    accY: 0,
    pColor: "#ffd0a0",
  },
  accessory: {
    cam: [0, 0.4, 6.4],
    phones: [HIDDEN, HIDDEN, HIDDEN],
    ring: { s: 2.3, o: 0.6, speed: 0.6, color: "#c9a961", rx: Math.PI / 2, y: -1.2 },
    buds: 1,
    watch: 1,
    cable: 1,
  },
  flagship: {
    cam: [0, 0.2, 6.4],
    phones: [
      { p: [0, -0.1, 0.5], r: [0, 0, 0], s: 1.1 },
      { p: [-1.8, 0.2, -0.6], r: [0, 0.5, 0], s: 0.95 },
      { p: [1.8, 0.2, -0.6], r: [0, -0.5, 0], s: 0.95 },
    ],
    ring: { s: 2.6, o: 0.45, speed: 0.5, color: "#c9a961", rx: Math.PI / 2, y: -1.4 },
  },
  midrange: {
    cam: [0, 0.2, 6.6],
    phones: [
      { p: [-0.9, -0.1, 0.4], r: [0, 0.25, 0], s: 1 },
      { p: [0.9, -0.1, 0.4], r: [0, -0.25, 0], s: 1 },
      HIDDEN,
    ],
    ring: { s: 0.001, o: 0, speed: 0.4, color: "#c9a961", rx: 0, y: 0 },
  },
  earbuds: {
    cam: [0, 0.4, 5.2],
    phones: [HIDDEN, HIDDEN, HIDDEN],
    ring: { s: 1.8, o: 0.6, speed: 1.4, color: "#f3ebdd", rx: 0, y: 0.1 },
    buds: 1.6,
    watch: 0,
    cable: 0,
    accY: 0,
  },
  wearable: {
    cam: [0, 0.2, 5],
    phones: [HIDDEN, HIDDEN, HIDDEN],
    ring: { s: 1.5, o: 0.6, speed: 0.9, color: "#c9a961", rx: 0.4, y: 0 },
    buds: 0,
    watch: 1.9,
    cable: 0,
  },
  charging: {
    cam: [0, 0.6, 6],
    key: "#ffd27a",
    keyI: 3,
    phones: [{ p: [0.4, -0.6, 0.4], r: [-1.35, 0, 0.3], s: 1 }, HIDDEN, HIDDEN],
    ring: { s: 1.6, o: 0.7, speed: 2, color: "#ffd27a", rx: Math.PI / 2, y: -0.75 },
    buds: 0,
    watch: 0,
    cable: 1.4,
    pColor: "#ffe0a0",
  },
};

function resolveCfg(): Cfg {
  const w = journey.world;
  if (w === "explore") return { ...WORLDS.explore, ...EXPLORE[journey.explore] };
  return WORLDS[w];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const d = THREE.MathUtils.damp;
function dampV(v: THREE.Vector3 | THREE.Euler, t: V3, l: number, dt: number) {
  v.x = d(v.x, t[0], l, dt);
  v.y = d(v.y, t[1], l, dt);
  v.z = d(v.z, t[2], l, dt);
}
const tmpColor = new THREE.Color();
function dampColor(c: THREE.Color, hex: string, l: number, dt: number) {
  tmpColor.set(hex);
  c.r = d(c.r, tmpColor.r, l, dt);
  c.g = d(c.g, tmpColor.g, l, dt);
  c.b = d(c.b, tmpColor.b, l, dt);
}

/* ------------------------------------------------------------------ */
/* Network lines (partnership)                                         */
/* ------------------------------------------------------------------ */

function Network({ nodes, opacityRef }: { nodes: THREE.Vector3[]; opacityRef: React.MutableRefObject<number> }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(18), 3));
    return g;
  }, []);
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const pulses = useRef<THREE.Sprite[]>([]);
  useFrame(({ clock }) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const pairs: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 0],
    ];
    pairs.forEach(([a, b], i) => {
      pos.setXYZ(i * 2, nodes[a].x, nodes[a].y, nodes[a].z);
      pos.setXYZ(i * 2 + 1, nodes[b].x, nodes[b].y, nodes[b].z);
    });
    pos.needsUpdate = true;
    if (mat.current) mat.current.opacity = 0.5 * opacityRef.current;
    const t = clock.getElapsedTime();
    pulses.current.forEach((s, i) => {
      if (!s) return;
      const [a, b] = pairs[i];
      const u = (t * 0.35 + i * 0.33) % 1;
      s.position.lerpVectors(nodes[a], nodes[b], u);
      s.material.opacity = opacityRef.current;
    });
  });
  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial ref={mat} color="#e9d3a6" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      {[0, 1, 2].map((i) => (
        <Glow
          key={i}
          ref={(el: THREE.Sprite | null) => {
            if (el) pulses.current[i] = el;
          }}
          size={0.5}
          color="#f0dcb0"
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Journey scene                                                       */
/* ------------------------------------------------------------------ */

export function JourneyScene() {
  const q = getQuality();
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const rig = useRef<THREE.Group>(null);
  const phoneRefs = useRef<THREE.Group[]>([]);
  const rowRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const ringMats = useRef<THREE.Group>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.Group>(null);
  const budsRef = useRef<THREE.Group>(null);
  const watchRef = useRef<THREE.Group>(null);
  const cableRef = useRef<THREE.Group>(null);
  const keyLight = useRef<THREE.PointLight>(null);
  const rimLight = useRef<THREE.DirectionalLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const particlesRef = useRef<THREE.Group>(null);
  const netOpacity = useRef(0);
  const nodes = useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], []);
  const state = useRef({ ringO: 0.5, ringSpeed: 0.3, ringColor: new THREE.Color("#c9a961"), pColor: new THREE.Color("#d8b98a"), pOp: 0.7 });
  const { size } = useThree();

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const cfg = resolveCfg();
    const t = clock.getElapsedTime();
    const w = journey.world;
    const pr = journey.progress;
    const mobile = size.width < 820;
    const zoom = mobile ? 1.45 : 1;
    const yShift = mobile ? (w === "hero" ? 0.55 : 0.35) : 0;

    // camera
    if (cam.current) {
      dampV(cam.current.position, [cfg.cam[0], cfg.cam[1], cfg.cam[2] * zoom], 2.2, dt);
      cam.current.lookAt(0, yShift * 0.4, 0);
    }
    // pointer parallax rig
    if (rig.current) {
      rig.current.rotation.y = d(rig.current.rotation.y, journey.px * 0.12, 3, dt);
      rig.current.rotation.x = d(rig.current.rotation.x, -journey.py * 0.06, 3, dt);
      rig.current.position.y = d(rig.current.position.y, yShift, 2.5, dt);
    }
    // phones
    phoneRefs.current.forEach((g, i) => {
      if (!g) return;
      const tgt = cfg.phones[i] ?? HIDDEN;
      const float = Math.sin(t * 0.8 + i * 1.7) * 0.06;
      let ry = tgt.r[1];
      let py = tgt.p[1] + float;
      if (w === "new" && i === 0) {
        // unveil: rise then rotate from back to front as the user scrolls
        const e = THREE.MathUtils.smoothstep(pr, 0.05, 0.75);
        ry = Math.PI * 0.9 - e * Math.PI * 0.9;
        py = tgt.p[1] - 0.9 * (1 - THREE.MathUtils.smoothstep(pr, 0, 0.3)) + float;
      } else if (w === "deals" && i === 0) {
        ry = Math.sin(t * 0.9) * 0.35;
      } else if (w === "hero" && i === 0) {
        ry = tgt.r[1] + Math.sin(t * 0.35) * 0.25;
      } else if (w === "store") {
        ry = tgt.r[1] + Math.sin(t * 0.3 + i) * 0.12;
      } else if (w === "explore" && journey.explore === "samsung" && i === 0) {
        ry = tgt.r[1] + Math.sin(t * 0.5) * 0.2;
      } else if (w === "explore" && journey.explore === "apple" && i === 0) {
        ry = tgt.r[1] + Math.sin(t * 0.4) * 0.12;
      }
      // desktop hero: keep the flagship beside the RTL copy column (left half of the viewport)
      const px = w === "hero" && !mobile ? tgt.p[0] - 1.6 : tgt.p[0];
      dampV(g.position, [px, py, tgt.p[2]], 2.6, dt);
      dampV(g.rotation, [tgt.r[0], ry, tgt.r[2]], 2.6, dt);
      const s = d(g.scale.x, tgt.s, 2.6, dt);
      g.scale.setScalar(s);
      nodes[i].copy(g.position);
    });
    // showroom rows
    if (rowRef.current) {
      const s = d(rowRef.current.scale.x, Math.max(cfg.rows, 0.001), 2.4, dt);
      rowRef.current.scale.setScalar(s);
      rowRef.current.position.y = d(rowRef.current.position.y, cfg.rows ? -0.55 : -3, 2.4, dt);
    }
    // ring
    if (ringRef.current) {
      const s = d(ringRef.current.scale.x, cfg.ring.s, 2.4, dt);
      ringRef.current.scale.setScalar(s);
      ringRef.current.position.y = d(ringRef.current.position.y, cfg.ring.y, 2.4, dt);
      ringRef.current.rotation.x = d(ringRef.current.rotation.x, cfg.ring.rx, 2.4, dt);
      const st = state.current;
      st.ringO = d(st.ringO, cfg.ring.o, 2.4, dt);
      st.ringSpeed = d(st.ringSpeed, cfg.ring.speed * (w === "deals" ? 1 + pr * 1.5 : 1), 2, dt);
      dampColor(st.ringColor, cfg.ring.color, 2.4, dt);
      ringMats.current?.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material & { color?: THREE.Color; opacity: number };
        if (m && m.color) {
          m.color.copy(st.ringColor);
          const baseO = (m.userData.baseO as number | undefined) ?? (m.userData.baseO = m.opacity);
          m.opacity = baseO * st.ringO;
        }
      });
      if (ringMats.current) ringMats.current.rotation.z -= dt * st.ringSpeed;
    }
    // cone (unveiling spotlight)
    if (coneRef.current) {
      const m = coneRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = d(m.opacity, cfg.cone * 0.14, 2.4, dt);
      coneRef.current.rotation.y = t * 0.2;
    }
    // grid
    if (gridRef.current) {
      gridRef.current.position.y = d(gridRef.current.position.y, cfg.grid ? -1.65 : -5, 2.2, dt);
    }
    // network
    netOpacity.current = d(netOpacity.current, cfg.net, 2.4, dt);
    // accessories
    const accSpin = t * 0.35;
    if (budsRef.current) {
      const s = d(budsRef.current.scale.x, Math.max(cfg.buds, 0.001), 2.4, dt);
      budsRef.current.scale.setScalar(s);
      const orbit = cfg.buds > 0 && cfg.watch > 0;
      const tx = orbit ? Math.cos(accSpin) * 2.1 : 0;
      const tz = orbit ? Math.sin(accSpin) * 1.2 : 0.6;
      dampV(budsRef.current.position, [tx, (orbit ? 0.6 : 0) + cfg.accY, tz], 2.4, dt);
      budsRef.current.rotation.y = d(budsRef.current.rotation.y, orbit ? 0 : Math.sin(t * 0.4) * 0.35, 2, dt);
    }
    if (watchRef.current) {
      const s = d(watchRef.current.scale.x, Math.max(cfg.watch, 0.001), 2.4, dt);
      watchRef.current.scale.setScalar(s);
      const orbit = cfg.buds > 0 && cfg.watch > 0;
      const a = accSpin + (Math.PI * 2) / 3;
      const tx = orbit ? Math.cos(a) * 2.1 : 0;
      const tz = orbit ? Math.sin(a) * 1.2 : 0.6;
      dampV(watchRef.current.position, [tx, (orbit ? -0.3 : 0.1) + cfg.accY, tz], 2.4, dt);
      watchRef.current.rotation.y = orbit ? Math.sin(t * 0.5) * 0.4 : Math.sin(t * 0.4) * 0.5;
      watchRef.current.rotation.x = orbit ? 0 : 0.25;
    }
    if (cableRef.current) {
      const s = d(cableRef.current.scale.x, Math.max(cfg.cable, 0.001), 2.4, dt);
      cableRef.current.scale.setScalar(s);
      const orbit = cfg.buds > 0 && cfg.watch > 0;
      const a = accSpin + (Math.PI * 4) / 3;
      const tx = orbit ? Math.cos(a) * 2.1 : -0.2;
      const tz = orbit ? Math.sin(a) * 1.2 : 0.2;
      dampV(cableRef.current.position, [tx, (orbit ? 0.2 : -0.9) + cfg.accY, tz], 2.4, dt);
    }
    // lights
    if (keyLight.current) {
      dampColor(keyLight.current.color, cfg.key, 2.4, dt);
      const pulse = w === "deals" ? 1 + Math.sin(t * 4) * 0.25 : 1;
      keyLight.current.intensity = d(keyLight.current.intensity, cfg.keyI * pulse * 6, 2.4, dt);
      keyLight.current.position.x = Math.sin(t * 0.5) * 2.5;
    }
    if (rimLight.current) dampColor(rimLight.current.color, cfg.rim, 2.4, dt);
    if (amb.current) amb.current.intensity = d(amb.current.intensity, cfg.amb, 2.4, dt);
    // particles
    if (particlesRef.current) {
      const st = state.current;
      dampColor(st.pColor, cfg.pColor, 2.4, dt);
      st.pOp = d(st.pOp, cfg.pOpacity, 2.4, dt);
      particlesRef.current.traverse((o) => {
        const m = (o as THREE.Points).material as THREE.PointsMaterial | undefined;
        if (m && m.isPointsMaterial) {
          m.color.copy(st.pColor);
          m.opacity = st.pOp;
        }
      });
    }
  });

  const cablePts = useMemo<[number, number, number][]>(
    () => [
      [-2.6, -1.6, -0.6],
      [-1.6, -1.5, 0.2],
      [-0.6, -0.9, 0.5],
      [0.1, -0.35, 0.65],
    ],
    [],
  );

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={q.mobile ? 42 : 36} position={[0, 0.2, 9]} near={0.1} far={60} />
      <ambientLight ref={amb} intensity={0.35} color="#f3ebdd" />
      <hemisphereLight intensity={0.25} color="#f3ebdd" groundColor="#3a0b12" />
      <pointLight ref={keyLight} position={[2, 3, 3]} intensity={14} color="#c9a961" distance={20} decay={2} />
      <directionalLight ref={rimLight} position={[-4, 3, -3]} intensity={2.4} color="#f3ebdd" />
      <StudioEnv />

      <group ref={rig}>
        {/* hero phones */}
        {(["apple", "samsung", "xiaomi"] as const).map((v, i) => (
          <group
            key={v}
            ref={(el) => {
              if (el) phoneRefs.current[i] = el;
            }}
            position={[0, -4, 0]}
          >
            <Phone variant={v} tint={i === 0 ? "#6e1a26" : i === 1 ? "#1f2a44" : "#3a2a12"} body={i === 1 ? "#26242a" : i === 2 ? "#141216" : "#1d1b20"} />
          </group>
        ))}

        {/* showroom back rows */}
        <group ref={rowRef} position={[0, -3, -3]} scale={0.001}>
          {[-3.6, -1.2, 1.2, 3.6].map((x, i) => (
            <group key={i} position={[x, 0.1, -2.6 - (i % 2) * 0.6]} rotation={[0, (x < 0 ? 1 : -1) * 0.25, 0]}>
              <Phone variant={(["apple", "samsung", "xiaomi", "apple"] as const)[i]} tint="#2a1f12" body="#1a181c" screen="dark" />
            </group>
          ))}
          {!q.low &&
            [-5.4, -2.6, 2.6, 5.4].map((x, i) => (
              <group key={`b${i}`} position={[x, 0.2, -4.6]} rotation={[0, (x < 0 ? 1 : -1) * 0.35, 0]}>
                <Phone variant={(["samsung", "xiaomi", "apple", "samsung"] as const)[i]} tint="#1f1a1c" body="#1a181c" screen="dark" />
              </group>
            ))}
        </group>

        {/* light ring */}
        <group ref={ringRef} scale={2.2}>
          <group ref={ringMats}>
            <mesh>
              <torusGeometry args={[1, 0.006, 6, q.low ? 48 : 96]} />
              <meshBasicMaterial color="#c9a961" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh>
              <torusGeometry args={[1, 0.011, 6, q.low ? 40 : 80, Math.PI * 0.55]} />
              <meshBasicMaterial color="#c9a961" transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[1, 0.008, 6, q.low ? 40 : 80, Math.PI * 0.3]} />
              <meshBasicMaterial color="#c9a961" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        </group>

        {/* unveiling light cone */}
        <mesh ref={coneRef} position={[0, 2.2, 0.8]} rotation={[0, 0, 0]}>
          <coneGeometry args={[2.2, 5.5, 32, 1, true]} />
          <meshBasicMaterial color="#f3ebdd" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* showroom floor */}
        <group ref={gridRef} position={[0, -5, -1]}>
          <FloorGrid size={22} divisions={q.low ? 14 : 22} />
        </group>

        {/* partnership network */}
        <Network nodes={nodes} opacityRef={netOpacity} />

        {/* accessories */}
        <group ref={budsRef} scale={0.001}>
          <EarbudsCase open={1} position={[0, -0.2, 0]} />
          <group position={[-0.28, 0.45, 0.05]} rotation={[0.2, 0, 0.3]}>
            <Earbud />
          </group>
          <group position={[0.28, 0.5, 0.05]} rotation={[0.2, 0, -0.3]}>
            <Earbud />
          </group>
        </group>
        <group ref={watchRef} scale={0.001}>
          <Watch />
        </group>
        <group ref={cableRef} scale={0.001}>
          <ChargeCable points={cablePts} pulses={q.low ? 2 : 4} />
        </group>

        {/* atmosphere */}
        <group ref={particlesRef}>
          <Particles spread={12} />
        </group>
      </group>
    </>
  );
}
