"use client";

import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { View, PerspectiveCamera, Float } from "@react-three/drei";
import { Phone, LightRing, Glow, Particles, FloorGrid, EarbudsCase, Earbud, Watch, ChargeCable } from "./objects";
import { StudioEnv } from "./worlds";
import { getQuality, journey } from "./journey-state";

/** Clears depth before this view renders so it layers cleanly over the journey scene. */
function DepthClear({ index }: { index: number }) {
  useFrame(({ gl }) => {
    gl.clear(false, true, false);
  }, index);
  return null;
}

function BannerView({ children, className, cam = [0, 0, 6], fov = 38 }: { children: ReactNode; className?: string; cam?: [number, number, number]; fov?: number }) {
  const q = getQuality();
  return (
    <View index={2} className={className ?? "absolute inset-0"}>
      <DepthClear index={2} />
      <PerspectiveCamera makeDefault position={[cam[0], cam[1], cam[2] * (q.mobile ? 1.35 : 1)]} fov={fov} near={0.1} far={50} />
      <ambientLight intensity={0.35} color="#f3ebdd" />
      <StudioEnv />
      {children}
    </View>
  );
}

function PointerRig({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, journey.px * strength, 3, dt);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -journey.py * strength * 0.5, 3, dt);
  });
  return <group ref={ref}>{children}</group>;
}

/* -------------------------- 01 Deals banner -------------------------- */
/* Urgency: fast light ring, pulsing oxblood light, orbiting price tags   */

function PriceTags({ count = 5 }: { count?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.9;
    ref.current.children.forEach((c, i) => {
      c.position.y = Math.sin(t * 2 + i) * 0.25;
      c.rotation.y = -t * 0.9;
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9]}>
            <mesh>
              <boxGeometry args={[0.42, 0.24, 0.02]} />
              <meshStandardMaterial color={i % 2 ? "#c9a961" : "#a5313f"} metalness={0.8} roughness={0.3} emissive={i % 2 ? "#8a7550" : "#6e1a26"} emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0.15, 0, 0.012]}>
              <circleGeometry args={[0.04, 12]} />
              <meshBasicMaterial color="#0e0d10" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function DealsScene() {
  const light = useRef<THREE.PointLight>(null);
  const phone = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (light.current) light.current.intensity = 18 + Math.sin(t * 5) * 8;
    if (phone.current) phone.current.rotation.y = Math.sin(t * 0.8) * 0.45;
  });
  return (
    <>
      <pointLight ref={light} position={[2, 2, 3]} color="#ff5a3c" intensity={20} distance={15} decay={2} />
      <directionalLight position={[-3, 2, 2]} intensity={2} color="#ffd7a8" />
      <PointerRig>
        <group ref={phone} position={[0, -0.15, 0]} rotation={[0.05, 0, -0.1]}>
          <Phone variant="apple" tint="#6e1a26" />
        </group>
        <LightRing radius={1.55} color="#ff7a5c" speed={3.4} arc={Math.PI * 0.7} tube={0.014} />
        <LightRing radius={1.75} color="#ffb08a" speed={-1.6} arc={Math.PI * 0.3} tube={0.008} opacity={0.7} />
        <PriceTags />
        <Glow color="#ff5a3c" size={5} opacity={0.22} position={[0, 0, -1.5]} />
      </PointerRig>
      <Particles count={getQuality().low ? 80 : 200} spread={7} color="#ffb08a" size={0.03} speed={0.12} />
    </>
  );
}

export function DealsBanner3D() {
  return (
    <BannerView cam={[0, 0, 6.2]}>
      <DealsScene />
    </BannerView>
  );
}

/* -------------------------- 03 Store banner -------------------------- */
/* Showroom: rows of devices over a reflective grid floor, camera dolly   */

function StoreScene() {
  const rig = useRef<THREE.Group>(null);
  const q = getQuality();
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    if (rig.current) rig.current.rotation.y = Math.sin(t * 0.15) * 0.25 + journey.px * 0.2;
    camera.position.y = 1.2 + Math.sin(t * 0.3) * 0.15;
    camera.lookAt(0, -0.2, 0);
  });
  const cols = q.low ? [-1.6, 0, 1.6] : [-3.2, -1.6, 0, 1.6, 3.2];
  const variants = ["samsung", "apple", "xiaomi", "apple", "samsung"] as const;
  return (
    <>
      <pointLight position={[0, 4, 2]} color="#d8b98a" intensity={22} distance={18} decay={2} />
      <directionalLight position={[-4, 3, 4]} intensity={1.6} color="#f3ebdd" />
      <group ref={rig}>
        <FloorGrid size={20} divisions={q.low ? 12 : 20} position={[0, -1.15, 0]} />
        {cols.map((x, i) => (
          <group key={i} position={[x, 0, -Math.abs(x) * 0.4]} rotation={[0, -x * 0.12, 0]}>
            <Phone variant={variants[i % variants.length]} tint={i % 2 ? "#2a1f12" : "#6e1a26"} scale={0.85} />
            <Glow color="#c9a961" size={1.2} opacity={0.25} position={[0, -1.1, 0.2]} />
          </group>
        ))}
        {!q.low &&
          [-2.4, -0.8, 0.8, 2.4].map((x, i) => (
            <group key={`r${i}`} position={[x, 0.1, -2.6]} rotation={[0, -x * 0.1, 0]}>
              <Phone variant={variants[(i + 2) % variants.length]} tint="#1f1a1c" screen="dark" scale={0.85} />
            </group>
          ))}
        <Watch position={[q.low ? 0 : -4.6, -0.75, 1.2]} scale={0.7} rotation={[0.3, 0.6, 0]} />
        <EarbudsCase open={0.8} position={[q.low ? 0 : 4.6, -0.8, 1.2]} scale={0.9} rotation={[0.2, -0.5, 0]} />
      </group>
      <Particles count={q.low ? 80 : 220} spread={9} color="#d8b98a" size={0.03} speed={0.05} opacity={0.5} />
    </>
  );
}

export function StoreBanner3D() {
  return (
    <BannerView cam={[0, 1.2, 7.5]} fov={36}>
      <StoreScene />
    </BannerView>
  );
}

/* ----------------------- 05 Partnership banner ----------------------- */
/* Connection: two devices exchanging pulses along golden arcs + nodes    */

function Arc({ from, to, lift = 1.2, color = "#e9d3a6", offset = 0 }: { from: [number, number, number]; to: [number, number, number]; lift?: number; color?: string; offset?: number }) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...from),
    new THREE.Vector3((from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + lift, (from[2] + to[2]) / 2 + 0.4),
    new THREE.Vector3(...to),
  );
  const pulse = useRef<THREE.Sprite>(null);
  useFrame(({ clock }) => {
    if (!pulse.current) return;
    const u = (clock.getElapsedTime() * 0.4 + offset) % 1;
    pulse.current.position.copy(curve.getPointAt(u));
  });
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 40, 0.008, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Glow ref={pulse} color="#fff2d0" size={0.45} />
    </group>
  );
}

function PartnerScene() {
  const rig = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (rig.current) rig.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.2 + journey.px * 0.2;
  });
  const q = getQuality();
  return (
    <>
      <pointLight position={[0, 3, 3]} color="#c9a961" intensity={20} distance={16} decay={2} />
      <directionalLight position={[3, 2, -2]} intensity={1.6} color="#f3ebdd" />
      <group ref={rig}>
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
          <Phone variant="apple" position={[-1.7, -0.1, 0]} rotation={[0, 0.7, 0]} scale={0.85} tint="#6e1a26" />
        </Float>
        <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.4}>
          <Phone variant="samsung" position={[1.7, -0.1, 0]} rotation={[0, -0.7, 0]} scale={0.85} tint="#2a1f12" />
        </Float>
        <Arc from={[-1.3, 0.3, 0.2]} to={[1.3, 0.3, 0.2]} offset={0} />
        <Arc from={[1.3, -0.4, 0.2]} to={[-1.3, -0.4, 0.2]} lift={-0.9} offset={0.5} />
        <Arc from={[-1.3, 0.6, -0.2]} to={[0, 2.1, -0.6]} lift={0.3} offset={0.25} color="#c9a961" />
        <Arc from={[1.3, 0.6, -0.2]} to={[0, 2.1, -0.6]} lift={0.3} offset={0.75} color="#c9a961" />
        {/* growth nodes */}
        {[
          [0, 2.1, -0.6],
          [-2.9, 1.4, -1],
          [2.9, 1.4, -1],
          [0, -2, -0.8],
        ].map((p, i) => (
          <group key={i} position={p as [number, number, number]}>
            <mesh>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color="#c9a961" metalness={1} roughness={0.2} emissive="#8a7550" emissiveIntensity={0.8} />
            </mesh>
            <Glow color="#e9d3a6" size={0.6} opacity={0.6} />
          </group>
        ))}
        <LightRing radius={3} color="#c9a961" speed={0.35} arc={Math.PI * 0.5} tube={0.008} opacity={0.6} rotation={[Math.PI / 2.3, 0, 0]} position={[0, -0.6, 0]} />
      </group>
      <Particles count={q.low ? 80 : 220} spread={8} color="#e9d3a6" size={0.03} speed={0.06} opacity={0.5} />
    </>
  );
}

export function PartnerBanner3D() {
  return (
    <BannerView cam={[0, 0.3, 7]} fov={38}>
      <PartnerScene />
    </BannerView>
  );
}

/* --------------------------- 07 Creative 1 --------------------------- */
/* Fast charging: phone lying flat, cable energy pulses, expanding rings  */

function ChargeScene() {
  const rings = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    rings.current?.children.forEach((r, i) => {
      const u = (t * 0.5 + i / 3) % 1;
      r.scale.setScalar(0.4 + u * 2.4);
      ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.6;
    });
    if (light.current) light.current.intensity = 14 + Math.sin(t * 6) * 5;
  });
  const q = getQuality();
  return (
    <>
      <pointLight ref={light} position={[0.4, 1.5, 1.5]} color="#ffd27a" intensity={16} distance={12} decay={2} />
      <directionalLight position={[-3, 3, 2]} intensity={1.4} color="#f3ebdd" />
      <PointerRig strength={0.15}>
        <group rotation={[0.9, -0.35, 0.15]} position={[0.3, -0.2, 0]}>
          <Phone variant="xiaomi" tint="#3a2a12" />
          <group ref={rings} position={[0, -1.06, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i}>
                <ringGeometry args={[0.3, 0.33, 48]} />
                <meshBasicMaterial color="#ffd27a" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        </group>
        <ChargeCable
          points={[
            [-3.4, -1.9, -0.4],
            [-2.2, -1.6, 0.4],
            [-1, -1.35, 0.8],
            [-0.05, -1.05, 0.95],
          ]}
          pulses={q.low ? 3 : 5}
          speed={0.5}
          pulseColor="#ffe6a8"
        />
        <Glow color="#ffd27a" size={3.5} opacity={0.25} position={[0, -0.9, 0.4]} />
      </PointerRig>
      <Particles count={q.low ? 60 : 160} spread={7} color="#ffe0a0" size={0.03} speed={0.15} opacity={0.6} />
    </>
  );
}

export function ChargeBanner3D() {
  return (
    <BannerView cam={[0, 0.4, 6]} fov={38}>
      <ChargeScene />
    </BannerView>
  );
}

/* --------------------------- 07 Creative 2 --------------------------- */
/* Wireless audio: case opens, buds float, sound-wave rings expand        */

function AudioScene() {
  const buds = useRef<THREE.Group>(null);
  const waves = useRef<THREE.Group>(null);
  const openRef = useRef(0);
  const caseGroup = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    openRef.current = THREE.MathUtils.damp(openRef.current, 1, 1.2, dt);
    if (buds.current) {
      buds.current.position.y = -0.1 + openRef.current * 0.9 + Math.sin(t * 1.2) * 0.08;
      buds.current.rotation.y = Math.sin(t * 0.6) * 0.5 + journey.px * 0.4;
    }
    if (caseGroup.current) caseGroup.current.rotation.y = Math.sin(t * 0.4) * 0.3 + journey.px * 0.3;
    waves.current?.children.forEach((w, i) => {
      const u = (t * 0.35 + i / 4) % 1;
      w.scale.setScalar(0.6 + u * 3);
      ((w as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.45;
    });
  });
  const q = getQuality();
  return (
    <>
      <pointLight position={[1, 2, 3]} color="#f3ebdd" intensity={14} distance={12} decay={2} />
      <pointLight position={[-2, -1, 2]} color="#a5313f" intensity={10} distance={10} decay={2} />
      <group ref={caseGroup} position={[0, -0.9, 0]}>
        <EarbudsCase open={0.95} scale={1.7} />
      </group>
      <group ref={buds} position={[0, -0.1, 0]}>
        <group position={[-0.42, 0, 0]} rotation={[0.1, 0.4, 0.35]} scale={1.5}>
          <Earbud />
        </group>
        <group position={[0.42, 0.05, 0]} rotation={[0.1, -0.4, -0.35]} scale={1.5}>
          <Earbud />
        </group>
      </group>
      <group ref={waves} position={[0, 0.5, -0.4]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <ringGeometry args={[0.5, 0.515, 64]} />
            <meshBasicMaterial color="#f3ebdd" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      <Glow color="#c9a961" size={3} opacity={0.2} position={[0, 0.3, -1]} />
      <Particles count={q.low ? 60 : 160} spread={6} color="#f3ebdd" size={0.025} speed={0.1} opacity={0.5} />
    </>
  );
}

export function AudioBanner3D() {
  return (
    <BannerView cam={[0, 0.3, 5.5]} fov={38}>
      <AudioScene />
    </BannerView>
  );
}

/* --------------------------- 07 Creative 3 --------------------------- */
/* Night photography: camera module macro, aperture ring, lens flares     */

function CameraScene() {
  const rig = useRef<THREE.Group>(null);
  const aperture = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (rig.current) {
      rig.current.rotation.y = Math.PI - 0.45 + Math.sin(t * 0.4) * 0.15 + journey.px * 0.25;
      rig.current.rotation.x = 0.2 + Math.sin(t * 0.3) * 0.06 - journey.py * 0.1;
    }
    if (aperture.current) aperture.current.rotation.z = t * 0.6;
  });
  const q = getQuality();
  return (
    <>
      <pointLight position={[-2, 2, -3]} color="#8fb4ff" intensity={16} distance={12} decay={2} />
      <pointLight position={[2, -1, -2]} color="#c9a961" intensity={12} distance={12} decay={2} />
      <directionalLight position={[0, 3, -4]} intensity={1.5} color="#f3ebdd" />
      <group ref={rig} position={[0.55, -1.15, 0]} scale={2.1}>
        <Phone variant="apple" tint="#101018" screen="camera" />
        {/* aperture blades around the camera island (on the back) */}
        <group ref={aperture} position={[0.24, 0.7, -0.12]}>
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0]} rotation={[0, 0, a]}>
                <boxGeometry args={[0.02, 0.14, 0.004]} />
                <meshBasicMaterial color="#e9d3a6" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            );
          })}
          <mesh>
            <ringGeometry args={[0.4, 0.405, 64]} />
            <meshBasicMaterial color="#c9a961" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <Glow color="#8fb4ff" size={0.9} opacity={0.7} position={[0.24, 0.7, -0.2]} />
        <Glow color="#ffffff" size={0.25} opacity={0.9} position={[0.13, 0.8, -0.2]} />
      </group>
      <Glow color="#8fb4ff" size={4} opacity={0.15} position={[-1.5, 1, -2]} />
      <Particles count={q.low ? 90 : 240} spread={8} color="#b9d0ff" size={0.03} speed={0.04} opacity={0.6} />
    </>
  );
}

export function CameraBanner3D() {
  return (
    <BannerView cam={[0, 0.2, 5.4]} fov={36}>
      <CameraScene />
    </BannerView>
  );
}
