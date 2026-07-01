"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  animate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "motion/react";

export type GrowthController = {
  /** Spring-smoothed display position, 0..1. Everything derives from this. */
  progress: MotionValue<number>;
  /** Attach to the component root to trigger the reveal when it scrolls in. */
  rootRef: React.RefObject<HTMLDivElement | null>;
  /** Set the position while inspecting (hover/drag), 0..1. */
  scrubTo: (fraction: number) => void;
  /** Stop inspecting — return to the current (final) value. */
  endScrub: () => void;
  /** True while the one-time count-up reveal is playing. */
  revealing: boolean;
};

const REVEAL_MS = 2100;
const REVEAL_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Drives the component from real signals, never a timer: a one-time count-up
 * when it scrolls into view, then manual scrubbing to inspect any point.
 * Rests on the final value under reduced motion.
 */
export function useGrowthController(onReveal?: () => void): GrowthController {
  const reduce = useReducedMotion();
  const target = useMotionValue(0);
  const progress = useSpring(target, { stiffness: 180, damping: 26, mass: 0.6 });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const revealCtrl = useRef<ReturnType<typeof animate> | null>(null);
  const started = useRef(false);
  const onRevealRef = useRef(onReveal);
  useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (reduce) {
      target.set(1);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            setRevealing(true);
            revealCtrl.current = animate(target, 1, {
              duration: REVEAL_MS / 1000,
              ease: REVEAL_EASE,
              onComplete: () => {
                setRevealing(false);
                onRevealRef.current?.();
              },
            });
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, target]);

  const scrubTo = useCallback(
    (fraction: number) => {
      revealCtrl.current?.stop();
      setRevealing(false);
      target.set(clamp01(fraction));
    },
    [target],
  );

  const endScrub = useCallback(() => {
    target.set(1);
  }, [target]);

  return { progress, rootRef, scrubTo, endScrub, revealing };
}
