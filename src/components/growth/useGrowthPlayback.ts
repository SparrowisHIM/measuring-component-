"use client";

import { useEffect, useState } from "react";
import { animate, useMotionValue, useReducedMotion, type MotionValue } from "motion/react";

export type Phase = "intro" | "growing" | "payoff" | "outro";

export type Playback = {
  /** Normalized timeline position, 0..1. Everything derives from this. */
  t: MotionValue<number>;
  phase: Phase;
};

const GROW_MS = 5800;
const INTRO_MS = 900;
const PAYOFF_MS = 1800;
const OUTRO_MS = 850;

// Brisk out of the gate, easing into the arrival so 10,000 lands softly.
const GROW_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/**
 * Directs the growth as a looping cinematic take: reveal, build, a held
 * payoff, then a dimmed reset that rewinds off-screen for a seamless loop.
 * Honours reduced motion by resting on the final state.
 */
export function useGrowthPlayback(): Playback {
  const reduce = useReducedMotion();
  const t = useMotionValue(0);
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    let alive = true;
    let controls: ReturnType<typeof animate> | null = null;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      if (reduce) {
        t.set(1);
        setPhase("payoff");
        return;
      }
      while (alive) {
        setPhase("intro");
        t.set(0);
        await delay(INTRO_MS);
        if (!alive) break;

        setPhase("growing");
        controls = animate(t, 1, { duration: GROW_MS / 1000, ease: GROW_EASE });
        await controls.finished.catch(() => {});
        if (!alive) break;

        setPhase("payoff");
        await delay(PAYOFF_MS);
        if (!alive) break;

        setPhase("outro");
        await delay(OUTRO_MS);
      }
    };

    run();
    return () => {
      alive = false;
      controls?.stop();
    };
  }, [reduce, t]);

  return { t, phase };
}
