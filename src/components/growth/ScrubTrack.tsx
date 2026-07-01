"use client";

import { useCallback, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import {
  KNOB_R,
  TRACK_H,
  TRACK_W,
  progressForY,
  yFor,
} from "./trackGeo";

const X0 = 30; // resting x of the wire; the notch bulges right, toward the readout
const SIGMA = 46; // width of the elastic deformation

/** A vertical wire deformed by a gaussian notch centred on the knob. */
function buildPath(knobY: number, amp: number): string {
  const steps = 36;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    // Build bottom -> top so the fill reveals upward with progress.
    const y = TRACK_H * (1 - i / steps);
    const bump = amp * Math.exp(-((y - knobY) ** 2) / (2 * SIGMA * SIGMA));
    const x = X0 + bump;
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

export function ScrubTrack({
  progress,
  onScrub,
}: {
  progress: MotionValue<number>;
  onScrub: (fraction: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Notch amplitude grows with scrub velocity, then springs back to rest.
  const velocity = useVelocity(progress);
  const ampTarget = useTransform(velocity, (v) => 9 + Math.min(Math.abs(v) * 11, 40));
  const amp = useSpring(ampTarget, { stiffness: 210, damping: 18, mass: 0.5 });

  const [path, setPath] = useState(() => buildPath(yFor(progress.get()), amp.get()));
  const rebuild = () => setPath(buildPath(yFor(progress.get()), amp.get()));
  useMotionValueEvent(progress, "change", rebuild);
  useMotionValueEvent(amp, "change", rebuild);

  const knobX = useTransform(amp, (a) => X0 + a - KNOB_R);
  const knobY = useTransform(progress, (p) => yFor(p) - KNOB_R);
  const dashoffset = useTransform(progress, (p) => 1 - p);
  const glowFilter = useTransform(progress, (p) => `drop-shadow(0 0 ${4 + p * 10}px var(--brass-hot))`);

  const scrubFromY = useCallback(
    (clientY: number) => {
      const el = wrapRef.current;
      if (!el) return;
      onScrub(progressForY(clientY - el.getBoundingClientRect().top));
    },
    [onScrub],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      scrubFromY(e.clientY);
    },
    [scrubFromY],
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) scrubFromY(e.clientY);
    },
    [scrubFromY],
  );
  const endDrag = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative shrink-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ width: TRACK_W, height: TRACK_H }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <svg
        width={TRACK_W}
        height={TRACK_H}
        viewBox={`0 0 ${TRACK_W} ${TRACK_H}`}
        className="absolute inset-0 overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id="scrub-wire" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--brass)" />
            <stop offset="55%" stopColor="var(--brass-hot)" />
            <stop offset="100%" stopColor="var(--incandescent)" />
          </linearGradient>
        </defs>

        {/* Cold wire */}
        <path d={path} fill="none" stroke="var(--edge)" strokeWidth={2.5} strokeLinecap="round" />

        {/* Warmed fill from the bottom up to the knob */}
        <motion.path
          d={path}
          fill="none"
          stroke="url(#scrub-wire)"
          strokeWidth={2.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          style={{ strokeDashoffset: dashoffset, filter: glowFilter }}
        />
      </svg>

      {/* Knob — the draggable handle */}
      <motion.div
        className="absolute flex items-center justify-center rounded-full border border-brass/60 bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_28px_rgba(0,0,0,0.6)]"
        style={{ width: KNOB_R * 2, height: KNOB_R * 2, x: knobX, y: knobY }}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: "0 0 0 1px color-mix(in oklab, var(--brass) 32%, transparent)" }}
        />
        {/* Double chevron pointing up the scale toward the goal */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 13l6-5 6 5" stroke="var(--brass-hot)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 18l6-5 6 5" stroke="var(--brass)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </div>
  );
}
