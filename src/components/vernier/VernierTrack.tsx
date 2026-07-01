"use client";

import { useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";

const TRACK_W = 120;
const TRACK_H = 340;
const X0 = 30; // resting x of the wire; the notch bulges right, toward the readout
const KNOB_R = 24;
const SIGMA = 44; // width of the elastic deformation
const TRAVEL_TOP = KNOB_R + 6;
const TRAVEL_BOTTOM = TRACK_H - KNOB_R - 6;

/** A vertical wire deformed by a gaussian notch centred on the knob. */
function buildPath(knobY: number, amp: number): string {
  const steps = 34;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const y = (TRACK_H * i) / steps;
    const bump = amp * Math.exp(-((y - knobY) ** 2) / (2 * SIGMA * SIGMA));
    const x = X0 + bump;
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

const yFor = (p: number) => TRAVEL_TOP + p * (TRAVEL_BOTTOM - TRAVEL_TOP);

export function VernierTrack({ progress }: { progress: MotionValue<number> }) {
  // Amplitude of the notch grows with scrub velocity, then springs back to rest.
  const velocity = useVelocity(progress);
  const ampTarget = useTransform(velocity, (v) => 9 + Math.min(Math.abs(v) * 11, 38));
  const amp = useSpring(ampTarget, { stiffness: 210, damping: 17, mass: 0.5 });

  const [path, setPath] = useState(() => buildPath(yFor(progress.get()), amp.get()));
  const rebuild = () => setPath(buildPath(yFor(progress.get()), amp.get()));
  useMotionValueEvent(progress, "change", rebuild);
  useMotionValueEvent(amp, "change", rebuild);

  // Knob rides the deformed wire: its x tracks the notch peak it creates.
  const knobX = useTransform(amp, (a) => X0 + a - KNOB_R);
  const knobY = useTransform(progress, (p) => yFor(p) - KNOB_R);

  // The filled (heated) portion of the wire runs from the top down to the knob.
  const dashoffset = useTransform(progress, (p) => 1 - p);
  const glowFilter = useTransform(progress, (p) => `drop-shadow(0 0 ${3 + p * 9}px var(--brass-hot))`);

  return (
    <div className="relative" style={{ width: TRACK_W, height: TRACK_H }}>
      <svg
        width={TRACK_W}
        height={TRACK_H}
        viewBox={`0 0 ${TRACK_W} ${TRACK_H}`}
        className="absolute inset-0 overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id="brass-wire" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--incandescent)" />
            <stop offset="45%" stopColor="var(--brass-hot)" />
            <stop offset="100%" stopColor="var(--brass)" />
          </linearGradient>
        </defs>

        {/* Cold wire beneath */}
        <path d={path} fill="none" stroke="var(--slate-edge)" strokeWidth={2.5} strokeLinecap="round" />

        {/* Heated fill from the top down to the knob */}
        <motion.path
          d={path}
          fill="none"
          stroke="url(#brass-wire)"
          strokeWidth={2.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          style={{
            strokeDashoffset: dashoffset,
            filter: glowFilter,
          }}
        />
      </svg>

      {/* The knob — the slider handle */}
      <motion.div
        className="absolute flex items-center justify-center rounded-full border border-brass/60 bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.55)]"
        style={{
          width: KNOB_R * 2,
          height: KNOB_R * 2,
          x: knobX,
          y: knobY,
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: "0 0 0 1px color-mix(in oklab, var(--brass) 30%, transparent)" }}
        />
        {/* Double chevron, pointing up the scale toward the goal */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 13l6-5 6 5"
            stroke="var(--brass-hot)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 18l6-5 6 5"
            stroke="var(--brass)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
