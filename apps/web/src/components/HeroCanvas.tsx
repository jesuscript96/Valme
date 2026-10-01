"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Interactive monochrome "data terrain": a tilted grid of points that
 * undulates with layered waves and ripples away from the pointer. The
 * whole thing is rendered in a custom shader for performance.
 */
const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uSize;
  uniform float uRatio;
  uniform float uHalfX;
  uniform float uHalfY;
  varying float vBright;

  void main() {
    vec3 p = position;

    // Layered traveling waves.
    float w = sin(p.x * 0.18 + uTime * 0.55) * 1.6
            + cos(p.y * 0.22 + uTime * 0.45) * 1.4
            + sin((p.x + p.y) * 0.12 + uTime * 0.8) * 1.0;

    // Pointer ripple.
    float d = distance(p.xy, uMouse);
    float ripple = exp(-d * d * 0.0009) * 6.0 * sin(d * 0.25 - uTime * 2.2);
    p.z += w + ripple;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Radial fade so the field dissolves at its edges.
    vec2 norm = vec2(position.x / uHalfX, position.y / uHalfY);
    float edge = smoothstep(1.15, 0.25, length(norm));

    vBright = clamp((p.z + 6.0) / 14.0, 0.04, 1.0) * edge;
    gl_PointSize = uSize * uRatio * (340.0 / -mv.z) * (0.45 + vBright);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vBright;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float dist = length(c);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.08, dist) * vBright;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function HeroCanvas({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mount.current;
    if (!container) return;

    // Bail to the CSS fallback if WebGL is unavailable.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 90);

    // Build the grid.
    const cols = isMobile ? 90 : 150;
    const rows = isMobile ? 55 : 90;
    const gapX = 1.4;
    const gapY = 1.4;
    const halfX = (cols * gapX) / 2;
    const halfY = (rows * gapY) / 2;

    const positions = new Float32Array(cols * rows * 3);
    let i = 0;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        positions[i++] = x * gapX - halfX;
        positions[i++] = y * gapY - halfY;
        positions[i++] = 0;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(9999, 9999) },
        uSize: { value: isMobile ? 2.4 : 3.0 },
        uRatio: { value: dpr },
        uHalfX: { value: halfX },
        uHalfY: { value: halfY },
        uColor: {
          value:
            variant === "light"
              ? new THREE.Color(0x2a2a30) // soft charcoal dots for light panels
              : new THREE.Color(0xffffff),
        },
      },
    });

    const points = new THREE.Points(geometry, material);
    points.rotation.x = -0.62; // tilt the field into a receding plane
    scene.add(points);

    // Pointer tracking (NDC + world-plane projection for the ripple).
    const targetRot = { x: 0, y: 0 };
    const mouseWorld = new THREE.Vector2(9999, 9999);
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRot.y = nx * 0.18;
      targetRot.x = ny * 0.1;
      mouseWorld.set(nx * halfX, ny * halfY * 0.6);
    };
    const onPointerLeave = () => mouseWorld.set(9999, 9999);
    window.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    const start = performance.now();
    let raf = 0;
    let active = true;
    const render = () => {
      if (!active) return;
      const t = (performance.now() - start) / 1000;
      material.uniforms.uTime.value = t;
      // Ease the ripple origin and parallax for smoothness.
      const m = material.uniforms.uMouse.value as THREE.Vector2;
      m.lerp(mouseWorld, 0.08);
      points.rotation.y += (targetRot.y - points.rotation.y) * 0.05;
      points.rotation.x += (-0.62 + targetRot.x - points.rotation.x) * 0.05;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const onVisibility = () => {
      const wasActive = active;
      active = !document.hidden;
      if (active && !wasActive) render();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement);
    };
  }, [variant]);

  return <div ref={mount} className="absolute inset-0 h-full w-full" />;
}
