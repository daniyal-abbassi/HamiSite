"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { getQuality } from "./journey-state";

type GroupProps = ThreeElements["group"];

/* ------------------------------------------------------------------ */
/* Textures                                                            */
/* ------------------------------------------------------------------ */

const texCache = new Map<string, THREE.CanvasTexture>();

/** Procedural phone UI screen: brand-tinted gradient + subtle UI shapes. */
export function useScreenTexture(tint: string, variant: "ui" | "camera" | "dark" = "ui") {
  return useMemo(() => {
    const key = `${tint}-${variant}`;
    const cached = texCache.get(key);
    if (cached) return cached;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 256, 512);
    if (variant === "dark") {
      g.addColorStop(0, "#0a0a0c");
      g.addColorStop(1, "#141216");
    } else if (variant === "camera") {
      g.addColorStop(0, "#050506");
      g.addColorStop(1, "#111014");
    } else {
      g.addColorStop(0, tint);
      g.addColorStop(0.55, "#120d12");
      g.addColorStop(1, "#050506");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 512);

    if (variant === "ui") {
      // soft light bloom
      const r = ctx.createRadialGradient(80, 110, 0, 80, 110, 220);
      r.addColorStop(0, "rgba(243,235,221,0.35)");
      r.addColorStop(1, "rgba(243,235,221,0)");
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, 256, 512);
      // time
      ctx.fillStyle = "rgba(243,235,221,0.92)";
      ctx.font = "600 44px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("۱۲:۴۸", 128, 130);
      // widgets
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      const rr = (x: number, y: number, w: number, h: number, rad: number) => {
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, rad);
        else ctx.rect(x, y, w, h);
        ctx.fill();
      };
      rr(24, 200, 100, 100, 22);
      rr(132, 200, 100, 100, 22);
      rr(24, 316, 208, 70, 22);
      ctx.fillStyle = "rgba(201,169,97,0.85)";
      rr(40, 214, 30, 30, 8);
      ctx.fillStyle = "rgba(165,49,63,0.9)";
      rr(148, 214, 30, 30, 8);
      // dock
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      rr(24, 430, 208, 56, 24);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? "rgba(216,185,138,0.7)" : "rgba(243,235,221,0.5)";
        rr(38 + i * 50, 442, 32, 32, 10);
      }
    } else if (variant === "camera") {
      // viewfinder grid + shutter
      ctx.strokeStyle = "rgba(243,235,221,0.14)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo((256 / 3) * i, 60);
        ctx.lineTo((256 / 3) * i, 400);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 60 + (340 / 3) * i);
        ctx.lineTo(256, 60 + (340 / 3) * i);
        ctx.stroke();
      }
      const rg = ctx.createRadialGradient(128, 230, 10, 128, 230, 150);
      rg.addColorStop(0, "rgba(201,169,97,0.35)");
      rg.addColorStop(1, "rgba(201,169,97,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 256, 512);
      ctx.strokeStyle = "rgba(243,235,221,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(128, 452, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(243,235,221,0.95)";
      ctx.beginPath();
      ctx.arc(128, 452, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 2;
    texCache.set(key, t);
    return t;
  }, [tint, variant]);
}

let glowTex: THREE.CanvasTexture | null = null;
export function getGlowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(0.6, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

/* ------------------------------------------------------------------ */
/* Phone                                                               */
/* ------------------------------------------------------------------ */

export type PhoneVariant = "apple" | "samsung" | "xiaomi";

type PhoneProps = GroupProps & {
  variant?: PhoneVariant;
  body?: string;
  tint?: string;
  screen?: "ui" | "camera" | "dark";
  screenOn?: boolean;
};

const LENS_TRI: [number, number][] = [
  [-0.1, 0.1],
  [0.1, 0.02],
  [-0.1, -0.1],
];

function Lens({ r = 0.075, position }: { r?: number; position: [number, number, number] }) {
  const q = getQuality();
  const seg = q.low ? 14 : 24;
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.03, seg]} />
        <meshStandardMaterial color="#1c1a1f" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <circleGeometry args={[r * 0.68, seg]} />
        <meshPhysicalMaterial color="#05060a" metalness={0.2} roughness={0.05} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[r * 0.72, r * 0.86, seg]} />
        <meshStandardMaterial color="#c9a961" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[-r * 0.2, r * 0.22, 0.022]}>
        <circleGeometry args={[r * 0.12, 8]} />
        <meshBasicMaterial color="#8fb4ff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export function Phone({
  variant = "apple",
  body = "#1d1b20",
  tint = "#6e1a26",
  screen = "ui",
  screenOn = true,
  ...props
}: PhoneProps) {
  const q = getQuality();
  const tex = useScreenTexture(tint, screen);
  const smooth = q.low ? 2 : 4;
  return (
    <group {...props}>
      {/* body */}
      <RoundedBox args={[1, 2.1, 0.09]} radius={0.12} smoothness={smooth}>
        <meshStandardMaterial color={body} metalness={0.9} roughness={0.32} />
      </RoundedBox>
      {/* thin gold frame accent */}
      <RoundedBox args={[1.01, 2.11, 0.05]} radius={0.12} smoothness={smooth}>
        <meshStandardMaterial color="#8a7550" metalness={1} roughness={0.22} />
      </RoundedBox>
      {/* screen */}
      <RoundedBox args={[0.93, 2.03, 0.006]} radius={0.09} smoothness={smooth} position={[0, 0, 0.046]}>
        <meshBasicMaterial map={tex} toneMapped={false} color={screenOn ? "#ffffff" : "#222"} />
      </RoundedBox>
      {/* glass reflection layer */}
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[0.93, 2.03]} />
        <meshPhysicalMaterial
          color="#000"
          transparent
          opacity={0.25}
          metalness={0}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* dynamic island / punch hole */}
      {variant === "apple" ? (
        <mesh position={[0, 0.9, 0.052]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.032, 0.16, 3, 8]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      ) : (
        <mesh position={[0, 0.92, 0.052]}>
          <circleGeometry args={[0.03, 12]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      )}
      {/* side buttons */}
      <mesh position={[0.512, 0.35, 0]}>
        <boxGeometry args={[0.02, 0.22, 0.04]} />
        <meshStandardMaterial color="#8a7550" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[-0.512, 0.55, 0]}>
        <boxGeometry args={[0.02, 0.12, 0.04]} />
        <meshStandardMaterial color="#8a7550" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[-0.512, 0.3, 0]}>
        <boxGeometry args={[0.02, 0.12, 0.04]} />
        <meshStandardMaterial color="#8a7550" metalness={1} roughness={0.3} />
      </mesh>

      {/* back camera systems */}
      <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.046]}>
        {variant === "apple" && (
          <group position={[-0.24, 0.7, 0]}>
            <RoundedBox args={[0.44, 0.44, 0.035]} radius={0.11} smoothness={smooth}>
              <meshStandardMaterial color="#141317" metalness={0.9} roughness={0.35} />
            </RoundedBox>
            {LENS_TRI.map((p, i) => (
              <Lens key={i} position={[p[0], p[1], 0.03]} r={0.085} />
            ))}
            <mesh position={[0.12, -0.12, 0.02]}>
              <circleGeometry args={[0.03, 10]} />
              <meshBasicMaterial color="#f3ebdd" />
            </mesh>
          </group>
        )}
        {variant === "samsung" && (
          <group position={[-0.3, 0.55, 0]}>
            {[0.32, 0.1, -0.12, -0.34].map((y, i) => (
              <Lens key={i} position={[0, y, 0.015]} r={i === 3 ? 0.06 : 0.08} />
            ))}
            <mesh position={[0.16, 0.25, 0.005]}>
              <circleGeometry args={[0.025, 10]} />
              <meshBasicMaterial color="#f3ebdd" />
            </mesh>
          </group>
        )}
        {variant === "xiaomi" && (
          <group position={[0, 0.6, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.36, 0.36, 0.04, q.low ? 24 : 40]} />
              <meshStandardMaterial color="#141317" metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.021]}>
              <ringGeometry args={[0.33, 0.36, q.low ? 24 : 40]} />
              <meshStandardMaterial color="#c9a961" metalness={1} roughness={0.25} />
            </mesh>
            {[
              [-0.13, 0.13],
              [0.13, 0.13],
              [-0.13, -0.13],
              [0.13, -0.13],
            ].map((p, i) => (
              <Lens key={i} position={[p[0], p[1], 0.035]} r={0.085} />
            ))}
          </group>
        )}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Earbuds                                                             */
/* ------------------------------------------------------------------ */

export function Earbud({ color = "#f3ebdd", ...props }: GroupProps & { color?: string }) {
  const q = getQuality();
  const seg = q.low ? 12 : 24;
  return (
    <group {...props}>
      <mesh scale={[1, 0.85, 0.9]}>
        <sphereGeometry args={[0.14, seg, seg]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.35} />
      </mesh>
      <mesh position={[0.02, -0.2, 0.02]} rotation={[0, 0, 0.25]}>
        <capsuleGeometry args={[0.045, 0.28, 3, seg / 2]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.02, 0.13]}>
        <sphereGeometry args={[0.07, seg / 2, seg / 2]} />
        <meshStandardMaterial color="#2a2830" metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function EarbudsCase({
  open = 0,
  color = "#1d1b20",
  ...props
}: GroupProps & { open?: number; color?: string }) {
  const q = getQuality();
  const smooth = q.low ? 2 : 4;
  return (
    <group {...props}>
      <RoundedBox args={[0.8, 0.5, 0.36]} radius={0.16} smoothness={smooth} position={[0, -0.05, 0]}>
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </RoundedBox>
      {/* inner gold glow */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.28]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.35 * open} />
      </mesh>
      {/* lid, hinged at back */}
      <group position={[0, 0.2, -0.18]} rotation={[-open * 1.9, 0, 0]}>
        <RoundedBox args={[0.8, 0.3, 0.36]} radius={0.14} smoothness={smooth} position={[0, 0.15, 0.18]}>
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
        </RoundedBox>
      </group>
      <mesh position={[0, -0.05, 0.181]}>
        <circleGeometry args={[0.018, 10]} />
        <meshBasicMaterial color="#c9a961" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Watch                                                               */
/* ------------------------------------------------------------------ */

export function Watch({ band = "#6e1a26", ...props }: GroupProps & { band?: string }) {
  const q = getQuality();
  const tex = useScreenTexture("#2a1f12", "ui");
  const smooth = q.low ? 2 : 4;
  return (
    <group {...props}>
      <RoundedBox args={[0.64, 0.74, 0.16]} radius={0.2} smoothness={smooth}>
        <meshStandardMaterial color="#1d1b20" metalness={0.95} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[0.54, 0.64, 0.01]} radius={0.16} smoothness={smooth} position={[0, 0, 0.082]}>
        <meshBasicMaterial map={tex} toneMapped={false} />
      </RoundedBox>
      <mesh position={[0.34, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.06, 16]} />
        <meshStandardMaterial color="#c9a961" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0.33, -0.1, 0]}>
        <boxGeometry args={[0.03, 0.14, 0.06]} />
        <meshStandardMaterial color="#1d1b20" metalness={1} roughness={0.3} />
      </mesh>
      {/* band arcs */}
      <mesh position={[0, 0, -0.45]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.58, 0.1, 6, q.low ? 20 : 36, Math.PI * 1.1]} />
        <meshStandardMaterial color={band} metalness={0.2} roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Charging cable with energy pulses                                   */
/* ------------------------------------------------------------------ */

export function ChargeCable({
  points,
  pulses = 3,
  color = "#26242a",
  pulseColor = "#e9d3a6",
  speed = 0.35,
  ...props
}: GroupProps & {
  points: [number, number, number][];
  pulses?: number;
  color?: string;
  pulseColor?: string;
  speed?: number;
}) {
  const q = getQuality();
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points],
  );
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * speed + i / pulses) % 1;
      const p = curve.getPointAt(u);
      m.position.copy(p);
      const s = 0.6 + Math.sin(u * Math.PI) * 0.8;
      m.scale.setScalar(s);
    });
  });
  return (
    <group {...props}>
      <mesh>
        <tubeGeometry args={[curve, q.low ? 32 : 64, 0.028, q.low ? 6 : 10, false]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* connector */}
      <mesh position={points[points.length - 1]}>
        <boxGeometry args={[0.09, 0.05, 0.16]} />
        <meshStandardMaterial color="#c9a961" metalness={1} roughness={0.25} />
      </mesh>
      {Array.from({ length: pulses }).map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el as unknown as THREE.Mesh;
          }}
          scale={[0.35, 0.35, 1]}
        >
          <spriteMaterial
            map={getGlowTexture()}
            color={pulseColor}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Light ring / trail                                                  */
/* ------------------------------------------------------------------ */

export function LightRing({
  radius = 1.6,
  color = "#c9a961",
  arc = Math.PI * 0.6,
  speed = 1.2,
  tube = 0.012,
  opacity = 1,
  ...props
}: GroupProps & {
  radius?: number;
  color?: string;
  arc?: number;
  speed?: number;
  tube?: number;
  opacity?: number;
}) {
  const q = getQuality();
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z -= dt * speed;
  });
  return (
    <group {...props}>
      <mesh>
        <torusGeometry args={[radius, tube * 0.6, 6, q.low ? 48 : 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.18 * opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[radius, tube, 6, q.low ? 40 : 80, arc]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <sprite position={[radius * Math.cos(arc), radius * Math.sin(arc), 0]} scale={[0.5, 0.5, 1]}>
          <spriteMaterial map={getGlowTexture()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
      </group>
    </group>
  );
}

export function Glow({
  color = "#c9a961",
  size = 2,
  opacity = 0.6,
  ...props
}: ThreeElements["sprite"] & { color?: string; size?: number; opacity?: number }) {
  return (
    <sprite scale={[size, size, 1]} {...props}>
      <spriteMaterial map={getGlowTexture()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  );
}

/* ------------------------------------------------------------------ */
/* Particles                                                           */
/* ------------------------------------------------------------------ */

export function Particles({
  count,
  spread = 10,
  color = "#d8b98a",
  size = 0.035,
  speed = 0.04,
  opacity = 0.7,
}: {
  count?: number;
  spread?: number;
  color?: string;
  size?: number;
  speed?: number;
  opacity?: number;
}) {
  const q = getQuality();
  const n = count ?? q.particles;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread * 1.6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6 - 1;
    }
    return arr;
  }, [n, spread]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * speed;
    ref.current.position.y = Math.sin(t * 0.2) * 0.3;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        map={getGlowTexture()}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Showroom floor grid                                                 */
/* ------------------------------------------------------------------ */

export function FloorGrid({ size = 16, divisions = 16, color = "#c9a961", ...props }: GroupProps & { size?: number; divisions?: number; color?: string }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const half = size / 2;
    const step = size / divisions;
    for (let i = 0; i <= divisions; i++) {
      const v = -half + i * step;
      pts.push(-half, 0, v, half, 0, v);
      pts.push(v, 0, -half, v, 0, half);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [size, divisions]);
  return (
    <group {...props}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={color} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0c0b0e" metalness={0.9} roughness={0.35} />
      </mesh>
    </group>
  );
}
