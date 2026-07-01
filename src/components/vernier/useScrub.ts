"use client";

import { useCallback } from "react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";

export type Scrub = {
  /** Spring-smoothed reading position, 0..1. Everything derives from this. */
  progress: MotionValue<number>;
  /** Raw, un-smoothed target the spring chases. */
  target: MotionValue<number>;
  /** Jump the target to an absolute position. */
  set: (p: number) => void;
  /** Move the target by a relative delta. */
  nudge: (delta: number) => void;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The measuring engine. Owns a single normalized value and a spring that
 * chases it, so drag / wheel / keyboard all feed one source of truth and
 * the whole instrument moves as one system.
 */
export function useScrub(initial = 0): Scrub {
  const target = useMotionValue(clamp01(initial));
  const progress = useSpring(target, {
    stiffness: 140,
    damping: 22,
    mass: 0.7,
    restDelta: 0.0005,
  });

  const set = useCallback((p: number) => target.set(clamp01(p)), [target]);
  const nudge = useCallback(
    (delta: number) => target.set(clamp01(target.get() + delta)),
    [target],
  );

  return { progress, target, set, nudge };
}
